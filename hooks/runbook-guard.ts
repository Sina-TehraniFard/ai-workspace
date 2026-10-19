import type { EngineInterface, ToolCallInput } from 'claude-code'

export type Runbook =
  | 'run-task'
  | 'ai-docs'
  | 'implement'
  | 'lessons'
  | 'review-changes'
  | 'distill-lesson'
  | 'triage-issue'
  | 'explain-stepwise'
  | 'do'
  | 'init'

type Requirement = { runbooks: Runbook[]; reason: string }

const SKILL_RUNBOOKS: Runbook[] = ['run-task', 'review-changes', 'distill-lesson', 'ai-docs']
const READ_RUNBOOKS: Runbook[] = ['implement', 'triage-issue', 'explain-stepwise', 'do', 'init']
const CHOICES: Runbook[] = ['run-task', 'do', 'implement', 'triage-issue', 'explain-stepwise', 'review-changes', 'distill-lesson', 'ai-docs']
const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])
const READ_ONLY_TOOLS = new Set(['Read', 'Grep', 'Glob', 'Skill', 'ToolSearch', 'AskUserQuestion'])

export function normalizePath(path: string): string {
  const parts: string[] = []
  for (const part of path.split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..') parts.pop()
    else parts.push(part)
  }
  return `/${parts.join('/')}`
}

export function runbookOfSkill(skill: string, pluginName: string): Runbook | undefined {
  const [plugin, name] = skill.split(':')
  if (plugin !== pluginName || name === undefined) return undefined
  if (name.includes('review')) return 'review-changes'
  return [...SKILL_RUNBOOKS, ...READ_RUNBOOKS].find(r => r === name)
}

export function isReviewSkill(skill: string): boolean {
  return /review/i.test(skill)
}

export function runbookOfRead(path: string, pluginRoot: string, cwd: string): Runbook | undefined {
  const file = normalizePath(path)
  if (file === `${cwd}/ai-docs/lessons.md`) return 'lessons'
  if (!file.startsWith(`${pluginRoot}/commands/`)) return undefined
  const name = file.slice(`${pluginRoot}/commands/`.length).replace(/\.md$/, '')
  return [...SKILL_RUNBOOKS, ...READ_RUNBOOKS].find(r => r === name)
}

export function editTarget(path: string, cwd: string): 'ai-docs' | 'code' | undefined {
  const file = normalizePath(path)
  if (!file.startsWith(`${cwd}/`)) return undefined
  if (file.startsWith(`${cwd}/ai-docs/`)) return 'ai-docs'
  if (file.startsWith(`${cwd}/.claude/`)) return undefined
  return 'code'
}

export function isCommit(command: string): boolean {
  return command.split(/&&|\|\||[;|\n]/).some(part => {
    const words = part.trim().split(/\s+/)
    for (let i = words.indexOf('git') + 1; i > 0 && i < words.length; i++) {
      const word = words[i] ?? ''
      if (word === '-C' || word === '-c') i++
      else if (!word.startsWith('-')) return word === 'commit'
    }
    return false
  })
}

export function needsRunbook(tool: string, hasChosenRunbook: boolean): boolean {
  return !hasChosenRunbook && !READ_ONLY_TOOLS.has(tool)
}

export function missingRunbooks(required: Runbook[], read: ReadonlySet<Runbook>): Runbook[] {
  return required.filter(r => !read.has(r))
}

export function usedLine(used: readonly Runbook[]): string | undefined {
  return used.length === 0 ? undefined : `使った手順: ${used.join(' → ')}`
}

export function isCorrectionAnswer(answer: string): boolean {
  return /^\s*(yes|はい)/i.test(answer)
}

type SessionState = { read: Set<Runbook>; hasEditedCode: boolean; hasSentRunTask: boolean }
type TurnState = { used: Runbook[]; hasChosenRunbook: boolean; isCorrectionPending: Promise<boolean> }

const newSession = (): SessionState => ({ read: new Set(), hasEditedCode: false, hasSentRunTask: false })
const newTurn = (hasChosenRunbook: boolean): TurnState => ({ used: [], hasChosenRunbook, isCorrectionPending: Promise.resolve(false) })

let session = newSession()
let turn = newTurn(false)

export function resetSession() {
  session = newSession()
}

export function startTurn(isCommandTyped: boolean) {
  turn = newTurn(isCommandTyped)
}

export function recordRead(runbook: Runbook | undefined) {
  if (runbook === undefined) return
  session.read.add(runbook)
  if (!turn.used.includes(runbook)) turn.used.push(runbook)
  if (runbook !== 'lessons') turn.hasChosenRunbook = true
}

export function currentTurn(): Readonly<{ used: readonly Runbook[]; hasChosenRunbook: boolean }> {
  return turn
}

export async function workspaceDir($: EngineInterface): Promise<string | undefined> {
  const cwd = await $.session.cwd()
  return (await $.fs.exists(`${cwd}/.claude/workspace.md`)) ? cwd : undefined
}

function guide($: EngineInterface, cwd: string, runbook: Runbook): string {
  if (runbook === 'lessons') return `${cwd}/ai-docs/lessons.md を Read`
  if (READ_RUNBOOKS.includes(runbook)) return `${$.plugin.root}/commands/${runbook}.md を Read`
  return `${$.plugin.name}:${runbook} を Skill で読み込む`
}

function choices($: EngineInterface, cwd: string): string {
  return `候補: ${CHOICES.map(r => guide($, cwd, r)).join('、')}。タスクを進めるなら run-task、それ以外の質問や単発の作業なら do`
}

function requirementOf(e: ToolCallInput, cwd: string): Requirement | undefined {
  if (e.tool === 'Bash') {
    return isCommit(e.command) && session.hasEditedCode
      ? { runbooks: ['review-changes'], reason: 'コードを書いた後のコミットの前' }
      : undefined
  }
  if (!EDIT_TOOLS.has(e.tool)) return undefined
  const target = editTarget('file_path' in e ? String(e.file_path) : 'notebook_path' in e ? String(e.notebook_path) : '', cwd)
  if (target === 'ai-docs') return { runbooks: ['ai-docs'], reason: 'ai-docs を書く前' }
  if (target === 'code') return { runbooks: ['implement', 'lessons'], reason: 'コードを書く前' }
  return undefined
}

export function denyReason($: EngineInterface, e: ToolCallInput, cwd: string): string | undefined {
  if (needsRunbook(e.tool, turn.hasChosenRunbook)) {
    return `この入力に合う手順書を1つ選んで読んでから、${e.tool} を使ってください。${choices($, cwd)}`
  }
  const requirement = requirementOf(e, cwd)
  const missing = requirement === undefined ? [] : missingRunbooks(requirement.runbooks, session.read)
  if (requirement === undefined || missing.length === 0) return undefined
  return `${requirement.reason}に、次の手順書を読んでください: ${missing.map(r => guide($, cwd, r)).join('、')}。読んでから同じ操作をやり直してください。`
}

export function recordToolCall($: EngineInterface, e: ToolCallInput, cwd: string) {
  if (e.tool === 'Read') recordRead(runbookOfRead(e.file_path, $.plugin.root, cwd))
  if (e.tool === 'Skill') {
    recordRead(runbookOfSkill(e.skill, $.plugin.name))
    if (isReviewSkill(e.skill)) session.read.add('review-changes')
  }
  if (requirementOf(e, cwd)?.runbooks.includes('implement')) {
    session.hasEditedCode = true
    session.read.delete('review-changes')
  }
}

export function recordTypedCommand($: EngineInterface, command: string) {
  recordRead(runbookOfSkill(command, $.plugin.name))
  if (isReviewSkill(command)) session.read.add('review-changes')
}

const CORRECTION_PROMPT = `次の発言は、直前の AI の作業や回答に対する指摘・訂正・不満ですか。yes か no だけで答えてください。

発言:
`

export function classifyCorrection($: EngineInterface, text: string) {
  turn.isCorrectionPending = $.model
    .complete({ model: 'haiku', prompt: CORRECTION_PROMPT + text.slice(0, 2_000), maxTokens: 5, timeoutMs: 8_000 })
    .then(r => r.isAnswered && isCorrectionAnswer(r.text))
    .catch(() => false)
}

export const SPEAKING_STYLE = '技術者にとって平易な言葉で、簡潔に話す。'

export async function runTaskContext($: EngineInterface): Promise<string> {
  if (session.hasSentRunTask) {
    return 'この入力も /ai-workspace:run-task の手順で扱う。手順の本文は、このセッションで前に添えたもの。読むだけの道具以外を使う前に、合う手順書を1つ選んで読む。'
  }
  session.hasSentRunTask = true
  const body = (await $.fs.read(`${$.plugin.root}/commands/run-task.md`)).replace(/^---\n[\s\S]*?\n---\n/, '')
  return `この入力は /ai-workspace:run-task の手順で扱う。手順の本文:\n\n${body.replaceAll('${CLAUDE_PLUGIN_ROOT}', $.plugin.root)}`
}

export async function stopReason($: EngineInterface, cwd: string): Promise<string | undefined> {
  if ((await turn.isCorrectionPending) && !turn.used.includes('distill-lesson')) {
    return `ユーザーの入力は指摘でした。終える前に ${guide($, cwd, 'distill-lesson')}、その手順で教訓にしてください。`
  }
  if (!turn.hasChosenRunbook) {
    return `この入力に合う手順書を選ばずに終えようとしています。手順書を1つ選んで読み、その手順で答え直してください。${choices($, cwd)}`
  }
  return undefined
}

export function usedRunbooks(): string | undefined {
  return usedLine(turn.used)
}
