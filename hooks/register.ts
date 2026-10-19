import type { Register } from 'claude-code'

import {
  classifyCorrection,
  denyReason,
  recordToolCall,
  recordTypedCommand,
  resetSession,
  runTaskContext,
  SPEAKING_STYLE,
  startTurn,
  stopReason,
  usedRunbooks,
  workspaceDir,
} from './runbook-guard'
import { refreshTaskBand, registerTaskBand } from './task-band'

export const register: Register = on => {
  registerTaskBand(on)

  on('session.start', async ($, e, next) => {
    await refreshTaskBand($)
    return next(e)
  })

  on('session.end', ($, e, next) => {
    resetSession()
    return next(e)
  })

  on('session.compact', async ($, e, next) => {
    const compacted = await next(e)
    if (e.agentId === undefined && e.trigger !== 'precompute' && !('skip' in compacted)) resetSession()
    return compacted
  })

  on('prompt.submit', async ($, e, next) => {
    if (e.isMeta || e.turnId !== undefined || e.origin.kind === 'task-notification') return next(e)
    startTurn(e.command !== undefined)
    if (e.command !== undefined) recordTypedCommand($, e.command.name)
    if ((await workspaceDir($)) === undefined) return next(e)
    const withStyle = [...(e.context ?? []), SPEAKING_STYLE]
    if (e.command !== undefined) return next({ ...e, context: withStyle })
    classifyCorrection($, e.text)
    return next({ ...e, context: [...withStyle, await runTaskContext($)] })
  })

  on('tool.call', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    const cwd = await workspaceDir($)
    if (cwd === undefined) return next(e)
    const deny = denyReason($, e, cwd)
    if (deny !== undefined) return { deny }
    const result = await next(e)
    if (!('deny' in result) && !result.isError) recordToolCall($, e, cwd)
    return result
  })

  on('classic.Stop', async ($, e, next) => {
    const cwd = e.stop_hook_active ? undefined : await workspaceDir($)
    const block = cwd === undefined ? undefined : await stopReason($, cwd)
    return block === undefined ? next(e) : { ...(await next(e)), block }
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    await refreshTaskBand($)
    const answer = await next(e)
    const line = usedRunbooks()
    return line === undefined ? answer : { ...answer, text: line }
  })
}
