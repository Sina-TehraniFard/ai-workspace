import type { EngineInterface, On } from 'claude-code'

export type ActiveTask = { title: string; stage: string | undefined }

export function activeTaskDirs(index: string): { dir: string; title: string }[] {
  const tasks: { dir: string; title: string }[] = []
  let inTaskTable = false
  for (const line of index.split('\n')) {
    if (line.startsWith('## ')) {
      inTaskTable = line.trim() === '## タスク'
      continue
    }
    if (!inTaskTable || !line.startsWith('|')) continue
    const [dir, title, , , status] = line.split('|').slice(1, -1).map(c => c.trim())
    if (dir === undefined || title === undefined || status !== '進行中') continue
    tasks.push({ dir: dir.replace(/^\[|\].*$|`/g, ''), title })
  }
  return tasks
}

export function stageOf(context: string): string | undefined {
  const stage = context.match(/^## 段階:\s*(.+)$/m)?.[1]?.trim()
  return stage || undefined
}

let tasks: ActiveTask[] = []

export async function refreshTaskBand($: EngineInterface) {
  const cwd = await $.session.cwd()
  const indexPath = `${cwd}/ai-docs/INDEX.md`
  if (!(await $.fs.exists(`${cwd}/.claude/workspace.md`)) || !(await $.fs.exists(indexPath))) {
    tasks = []
  } else {
    const found = activeTaskDirs(await $.fs.read(indexPath))
    tasks = await Promise.all(
      found.map(async ({ dir, title }) => {
        const contextPath = `${cwd}/ai-docs/tasks/${dir}/context.md`
        const context = (await $.fs.exists(contextPath)) ? await $.fs.read(contextPath) : ''
        return { title, stage: stageOf(context) }
      }),
    )
  }
  $.ui.invalidate('ui.render')
}

export function registerTaskBand(on: On) {
  on('ui.render', { component: 'AbovePrompt' }, ($, e, next) => {
    if (e.props.hasSurvey || tasks.length === 0) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        {tasks.map(task => (
          <Text key={task.title} dimColor wrap="truncate-end">
            進行中: {task.title}
            {task.stage ? ` ／ 段階 ${task.stage}` : ''}
          </Text>
        ))}
      </Box>
    )
  })
}
