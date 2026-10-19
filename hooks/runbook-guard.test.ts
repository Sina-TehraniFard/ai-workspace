import { describe, expect, test } from 'claude-code/testing'

import {
  currentTurn,
  editTarget,
  isCommit,
  isCorrectionAnswer,
  missingRunbooks,
  needsRunbook,
  normalizePath,
  recordRead,
  runbookOfRead,
  runbookOfSkill,
  startTurn,
  usedLine,
} from './runbook-guard'

const root = '/Users/dev/.claude/plugins/cache/ai-workspace/ai-workspace/0.3.0'
const cwd = '/Users/dev/shop'

describe('runbookOfSkill', () => {
  test('このプラグインのスキル名から手順書を返す', async () => {
    // Given: Skill で読み込んだ ai-docs と distill-lesson
    const skills = ['ai-workspace:ai-docs', 'ai-workspace:distill-lesson']
    // When: 手順書を決める
    const runbooks = skills.map(s => runbookOfSkill(s, 'ai-workspace'))
    // Then: それぞれの手順書が返る
    expect(runbooks).toEqual(['ai-docs', 'distill-lesson'])
  })

  test('別のプラグインや個人の同じ名前のスキルは数えない', async () => {
    // Given: 別のプラグインの implement、個人の ai-docs、組み込みの init
    const skills = ['dev-be:implement', 'ai-docs', 'init']
    // When: 手順書を決める
    const runbooks = skills.map(s => runbookOfSkill(s, 'ai-workspace'))
    // Then: どれも手順書にならない
    expect(runbooks).toEqual([undefined, undefined, undefined])
  })

  test('このプラグインの review を含むスキルはセルフレビューとして数える', async () => {
    // Given: review-changes
    const skill = 'ai-workspace:review-changes'
    // When: 手順書を決める
    const runbook = runbookOfSkill(skill, 'ai-workspace')
    // Then: review-changes が返る
    expect(runbook).toBe('review-changes')
  })
})

describe('runbookOfRead', () => {
  test('プラグインの commands を Read したら、その手順書を返す', async () => {
    // Given: プラグインの implement.md と do.md のパス
    const paths = [`${root}/commands/implement.md`, `${root}/commands/./do.md`]
    // When: 手順書を決める
    const runbooks = paths.map(p => runbookOfRead(p, root, cwd))
    // Then: implement と do が返る
    expect(runbooks).toEqual(['implement', 'do'])
  })

  test('ワークスペースの lessons.md を Read したら lessons を返す', async () => {
    // Given: ワークスペース直下の教訓台帳を、遠回りのパスでも指す
    const paths = [`${cwd}/ai-docs/lessons.md`, `${cwd}/api/../ai-docs/lessons.md`]
    // When: 手順書を決める
    const runbooks = paths.map(p => runbookOfRead(p, root, cwd))
    // Then: どちらも lessons
    expect(runbooks).toEqual(['lessons', 'lessons'])
  })

  test('リポジトリの中の同じ名前のファイルは手順書として数えない', async () => {
    // Given: 開発中のプラグインのリポジトリにある implement.md
    const path = `${cwd}/commands/implement.md`
    // When: 手順書を決める
    const runbook = runbookOfRead(path, root, cwd)
    // Then: 何も返らない
    expect(runbook).toBeUndefined()
  })
})

describe('editTarget', () => {
  test('ai-docs の下は ai-docs として扱う', async () => {
    // Given: タスクの context.md
    const path = `${cwd}/ai-docs/tasks/202610190900-x/context.md`
    // When: 編集の対象を分ける
    const target = editTarget(path, cwd)
    // Then: ai-docs
    expect(target).toBe('ai-docs')
  })

  test('リポジトリのファイルはコードとして扱う', async () => {
    // Given: 親フォルダ型の api リポジトリのファイル
    const path = `${cwd}/api/src/Order.java`
    // When: 編集の対象を分ける
    const target = editTarget(path, cwd)
    // Then: code
    expect(target).toBe('code')
  })

  test('.claude の下とワークスペースの外は対象にしない', async () => {
    // Given: ワークスペースの設定、ホームの設定、.. でワークスペースの外を指すパス
    const paths = [`${cwd}/.claude/workspace.md`, '/Users/dev/.claude/CLAUDE.md', `${cwd}/../shop-old/a.ts`]
    // When: 編集の対象を分ける
    const targets = paths.map(p => editTarget(p, cwd))
    // Then: どれも対象にならない
    expect(targets).toEqual([undefined, undefined, undefined])
  })
})

describe('normalizePath', () => {
  test('. と .. を解いた絶対パスにする', async () => {
    // Given: . と .. の混ざったパス
    const path = '/Users/dev/shop/./api/../ai-docs//INDEX.md'
    // When: 正規化する
    const normalized = normalizePath(path)
    // Then: 直接のパスになる
    expect(normalized).toBe('/Users/dev/shop/ai-docs/INDEX.md')
  })
})

describe('isCommit', () => {
  test('git commit を含むコマンドを見分ける', async () => {
    // Given: よく使う書き方のコミット
    const commands = ['git commit -m "feat: x"', 'git -C api commit -m "fix: y"', 'git add . && git commit -m z']
    // When: コミットかを判定する
    const results = commands.map(isCommit)
    // Then: すべてコミット
    expect(results).toEqual([true, true, true])
  })

  test('commit という語を含むだけの git コマンドは見分けない', async () => {
    // Given: commit を引数に含むログの検索、commit-tree、git 以外の grep
    const commands = ['git log --grep commit', 'git commit-tree HEAD^{tree}', 'grep -rn commit docs', 'git status']
    // When: コミットかを判定する
    const results = commands.map(isCommit)
    // Then: どれもコミットではない
    expect(results).toEqual([false, false, false, false])
  })
})

describe('needsRunbook', () => {
  test('手順書を選ぶ前は、読むだけの道具以外を止める', async () => {
    // Given: まだ手順書を選んでいない
    const tools = ['Bash', 'Edit', 'Agent', 'Read', 'Grep', 'Skill', 'AskUserQuestion']
    // When: 道具ごとに止めるかを決める
    const results = tools.map(tool => needsRunbook(tool, false))
    // Then: Bash・Edit・Agent だけを止める
    expect(results).toEqual([true, true, true, false, false, false, false])
  })

  test('手順書を選んだ後は止めない', async () => {
    // Given: 手順書を選んだ後
    // When: Bash を止めるかを決める
    const result = needsRunbook('Bash', true)
    // Then: 止めない
    expect(result).toBe(false)
  })
})

describe('ターンの状態', () => {
  test('入力を受けたら選んだ手順書を消し、読んだら選んだことにする', async () => {
    // Given: 前のターンで do を読んだ
    startTurn(false)
    recordRead('do')
    // When: 次の入力を受ける
    startTurn(false)
    // Then: まだ手順書を選んでいない
    expect(currentTurn()).toEqual({ used: [], hasChosenRunbook: false, isCorrectionPending: expect.anything() })
  })

  test('lessons.md を読んだだけでは手順書を選んだことにしない', async () => {
    // Given: 入力を受けた直後
    startTurn(false)
    // When: lessons.md だけを読む
    recordRead('lessons')
    // Then: 使った手順には出るが、選んだことにはならない
    expect([currentTurn().used, currentTurn().hasChosenRunbook]).toEqual([['lessons'], false])
  })

  test('ユーザーが自分でコマンドを打った入力は、選んだことにする', async () => {
    // Given: /code-review のような手順書でないコマンドを打った
    // When: 入力を受ける
    startTurn(true)
    // Then: 選んだことになる
    expect(currentTurn().hasChosenRunbook).toBe(true)
  })
})

describe('missingRunbooks', () => {
  test('読んでいない手順書だけを返す', async () => {
    // Given: implement だけを読んだ状態
    const read = new Set(['implement'] as const)
    // When: コードを書く前に必要な手順書と比べる
    const missing = missingRunbooks(['implement', 'lessons'], read)
    // Then: lessons が足りない
    expect(missing).toEqual(['lessons'])
  })
})

describe('usedLine', () => {
  test('使った手順を順に1行で返す', async () => {
    // Given: do、implement、ai-docs の順に読んだ
    const used = ['do', 'implement', 'ai-docs'] as const
    // When: 1行にする
    const line = usedLine([...used])
    // Then: 矢印でつながる
    expect(line).toBe('使った手順: do → implement → ai-docs')
  })

  test('何も使っていなければ undefined を返す', async () => {
    // Given: 手順書を読んでいないターン
    // When: 1行にする
    const line = usedLine([])
    // Then: 何も出さない
    expect(line).toBeUndefined()
  })
})

describe('isCorrectionAnswer', () => {
  test('yes と はい で始まる答えを指摘とみなす', async () => {
    // Given: 小さなモデルの答え
    const answers = ['yes', 'Yes.', ' YES', 'はい', 'no', 'いいえ', '']
    // When: 指摘かを読む
    const results = answers.map(isCorrectionAnswer)
    // Then: yes と はい だけが指摘
    expect(results).toEqual([true, true, true, true, false, false, false])
  })
})
