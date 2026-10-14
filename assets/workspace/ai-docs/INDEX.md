# {案件名} ai-docs

> ワークスペースの横断コンテキスト。読み手は AI。
> 全ファイルへここから1階層でリンクする。各行は「いつ読むか」が分かる説明を付ける。
> 書き方のルール → `ai-docs` スキル、案件固有の決まり → `.claude/workspace.md`

updated: {YYYY-MM-DD}

## 読み方ガイド
- 作業を再開する → 「タスク」表で status が 進行中 の `context.md`
- 環境構築・起動・エラー対処 → env/
- 「なぜこうなっているか」 → decisions/
- INDEX に無いものを探す → `grep -rl "tags:.*<kw>" ai-docs/` / `grep -r "^summary:" ai-docs/`

## タスク
> status: 着手予定 / ペンディング / 進行中（完了したものは tasks/_archive/ へ移す）

| dir | title | ticket | scope | status | summary |
|---|---|---|---|---|---|

## Context（安定した事実）
- [lessons](lessons.md): 指摘から抜き出した教訓の台帳。実装・セルフレビューの前に読む

## Env（開発環境）
- [task-workflow](env/task-workflow.md): タスクの段階表。新しいタスクを始めるとき・次に何をするか迷ったとき

## Decisions（ADR）

## Optional
- tasks/_archive/: 完了タスク。過去経緯を調べるときのみ
- inbox/: 未分類メモ
