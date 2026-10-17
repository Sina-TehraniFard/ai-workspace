import { describe, expect, test } from 'claude-code/testing'

import { activeTaskDirs, stageOf } from './task-band'

const index = `# demo ai-docs

## タスク
> status: 着手予定 / ペンディング / 進行中

| dir | title | ticket | scope | status | summary |
|---|---|---|---|---|---|
| [20261001-123-order-export](tasks/20261001-123-order-export/context.md) | 注文データを CSV で出力する | #123 | [api, web] | 進行中 | 出力項目を決めた |
| 20261003-130-fix-login | ログイン後に500になる | #130 | [api] | ペンディング | 認証基盤の回答待ち |
| \`202610051030-cleanup-logs\` | 古いログを消すバッチ | | [batch] | 進行中 | 削除条件を確認中 |
| 20261007-141-mail | 通知メールの文面変更 | #141 | [web] | 着手予定 | |

## Decisions（ADR）
| dir | title | ticket | scope | status | summary |
|---|---|---|---|---|---|
| 20260901-db | DB を分ける | | [api] | 進行中 | |
`

describe('activeTaskDirs', () => {
  test('タスク表の進行中の行だけを、リンクや記号を外した dir で返す', async () => {
    // Given: 状態の混ざったタスク表と、後ろに別の表がある INDEX.md
    // When: 進行中のタスクを取り出す
    const tasks = activeTaskDirs(index)
    // Then: タスク表の進行中2件だけが、dir と title の組で返る
    expect(tasks).toEqual([
      { dir: '20261001-123-order-export', title: '注文データを CSV で出力する' },
      { dir: '202610051030-cleanup-logs', title: '古いログを消すバッチ' },
    ])
  })

  test('タスク表に行が無ければ空を返す', async () => {
    // Given: ひな形のままの INDEX.md
    const empty = '## タスク\n\n| dir | title | ticket | scope | status | summary |\n|---|---|---|---|---|---|\n'
    // When: 進行中のタスクを取り出す
    const tasks = activeTaskDirs(empty)
    // Then: 何も返らない
    expect(tasks).toEqual([])
  })
})

describe('stageOf', () => {
  test('context.md の段階の行を返す', async () => {
    // Given: 冒頭に段階の行がある context.md
    const context = '---\ntype: task\n---\n## 時点: 2026-10-17\n## 段階: 6 実装\n## 現状サマリ: 出力処理を書いている\n'
    // When: 段階を読む
    const stage = stageOf(context)
    // Then: 番号と名前が返る
    expect(stage).toBe('6 実装')
  })

  test('段階の行が無い context.md では undefined を返す', async () => {
    // Given: 段階の行を足す前の形の context.md
    const context = '## 時点: 2026-10-01\n## 現状サマリ: 調査中\n'
    // When: 段階を読む
    const stage = stageOf(context)
    // Then: 段階は分からない
    expect(stage).toBeUndefined()
  })
})
