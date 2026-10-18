---
description: "複数リポジトリをまとめた親フォルダ、または1つのリポジトリを、/ai-workspace:run-task・/ai-workspace:distill-lesson・ai-docs スキルで扱えるワークスペースとして初期設定する。初期設定がまだのときは /ai-workspace:run-task がこの手順を読んで行う。足りない項目の補完に使う（/ai-workspace:init 明示起動専用）"
argument-hint: "[案件名（省略時は質問する）]"
allowed-tools: "Read, Grep, Glob, Bash, Edit, Write, AskUserQuestion, Agent"
disable-model-invocation: true
---

# /ai-workspace:init

今いるフォルダを調べ、足りないことだけを質問して、`.claude/`（入口・案件の設定）と `ai-docs/`（記録の骨組み）を作る。ひな形は `${CLAUDE_PLUGIN_ROOT}/assets/workspace/`。

## 行動原則

- 調べて分かることは聞かない。聞くのは、調べても根拠が見つからないことだけ
- 根拠の無い決まりを書かない。分からない欄は質問するか「未確認」と書く
- 既にあるファイルは上書きしない。足りない部分だけを足す
- 案件の情報（会社名・案件名・リポジトリ名・業務の中身）は案件のフォルダにだけ書き、`~/.claude/` には書かない
- 書き方は `${CLAUDE_PLUGIN_ROOT}/references/writing-style.md` に従う

## Step 1: 場所の確認と形の決定

- `.claude/workspace.md` が既にあれば、初期設定済みと伝え、足りない項目の補完だけを行うかを AskUserQuestion で聞く
- 形を `git rev-parse --show-toplevel` の結果で決める。決めた形は Step 4 で workspace.md の「形」に書く
  - 失敗する（git リポジトリの外）: 直下に git リポジトリ（`ls -d */.git`）が1つ以上あれば親フォルダ型。無ければ、リポジトリか、リポジトリをまとめたフォルダで起動し直すよう1行で伝えて止める
  - 今のフォルダを返す（リポジトリの最上位）: 単独型の候補。親フォルダ型のワークスペースの中で、リポジトリを開いてしまった場合と区別できないため、Step 3 の質問で単独型で使うかを聞く。断られたら、親フォルダで起動し直すよう1行で伝えて止める
  - 別のフォルダを返す（リポジトリの途中）: 返ったフォルダで起動し直すよう1行で伝えて止める
- 親フォルダ型なら、直下のリポジトリを示し、このフォルダを初期設定してよいかを Step 3 の質問で聞く。断られたら止める

## Step 2: 調べる

リポジトリごとに次を調べ、事実と根拠（コマンドやファイルのパス）を控える。単独型では今のフォルダが対象のリポジトリで、`<repo>` は `.` になる。リポジトリが3つ以上なら Agent で並列に調べてよい。
- 既定ブランチ: `git -C <repo> symbolic-ref --short refs/remotes/origin/HEAD`
- 規約の正本: `AGENTS.md`、`CLAUDE.md`、`CONTRIBUTING.md`、`.github/PULL_REQUEST_TEMPLATE.md` の有無
- ブランチ名の形式: 規約の正本に書かれていればそれ。無ければ `gh pr list --state merged --limit 100 --json headRefName` で接頭辞を数え、最多のものと Issue 番号の入れ方を候補にする
- 品質確認のコマンド: 規約の正本、`Makefile` のターゲット、`package.json` の scripts など
- 計画書・設計書の置き場: 規約の正本と、`docs` などのフォルダ名
- リポジトリの道具: `.claude/skills/`、`.claude/commands/`、`.claude/agents/` の一覧
- 自動で書き換わるファイル: 規約の正本の記述から拾う

## Step 3: 足りないことを聞く

Step 1 の確認と、Step 2 で根拠が見つからなかった項目だけを、AskUserQuestion で1回に4問までにまとめて聞く。候補が調べて出ていれば、その候補を選択肢の先頭に置く。
- Step 1 の確認（単独型で使うか、または親フォルダ型で初期設定してよいか）
- 案件名（引数が無いとき）
- チケットの所在と表記（GitHub Issue / Notion / その他）
- 要件の正（Issue の完了の定義、チケットの本文など）
- ブランチ名の形式・品質確認のコマンド・計画書の置き場のうち、根拠が無かったもの

## Step 4: 作る

`${CLAUDE_PLUGIN_ROOT}/assets/workspace/` のひな形を写し、`{...}` を Step 2・3 の結果で埋める。埋められない欄は「未確認」と書く。
- `.claude/CLAUDE.md`: 親フォルダ型で、既に親フォルダに `CLAUDE.md` があれば、その中身を `.claude/CLAUDE.md` に統合し、元のファイルを消すかを AskUserQuestion で聞く。単独型ではリポジトリ直下の `CLAUDE.md` に触れない。既に `.claude/CLAUDE.md` があれば、ひな形の見出しのうち無いものだけを足す
- `.claude/workspace.md`: 「形」に Step 1 で決めた形（親フォルダ / 単独）を書く
- `ai-docs/INDEX.md`、`ai-docs/lessons.md`、`ai-docs/env/task-workflow.md`
- 空のフォルダ `ai-docs/context/`、`ai-docs/decisions/`、`ai-docs/tasks/`、`ai-docs/inbox/`
- `ai-docs/decisions/<今日>-workspace-init.md`: 調べて決めたこと（ブランチ名の形式など）と、その根拠

## Step 5: 確かめる

- 親フォルダ型なら、`CLAUDE_PROJECT_DIR=$PWD ${CLAUDE_PLUGIN_ROOT}/hooks/sync-repo-links.sh` を実行し、`.claude/skills` などにリンクができたことを `ls -l` で確かめる
- 各リポジトリ（単独型では今のフォルダ）について、今のブランチで `${CLAUDE_PLUGIN_ROOT}/hooks/guard-default-branch.sh` に編集を渡したときの結果（止まる／通る）を確かめる
- ユーザーに、Claude Code をこのフォルダで起動し直すよう伝える（リンクと設定は起動時に読まれるため）

## Step 6: 報告

5行以内で、作ったファイル、未確認のまま残した項目、次にやること（起動し直して `/ai-workspace:run-task` を打つ）を書く。

## エラーハンドリング

- `gh` が認証エラー: ブランチ名の形式は規約の正本と既存ブランチ名（`git branch -r`）から推定し、その旨を報告に書く
- ひな形が無い: プラグインを入れ直すよう1行で伝えて止める
