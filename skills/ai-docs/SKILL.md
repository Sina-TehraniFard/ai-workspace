---
name: ai-docs
description: ワークスペース（親フォルダに .claude/workspace.md がある、複数リポジトリをまとめた作業場所）の ai-docs を規約に沿って追記・更新する。残すべき知見（環境・仕様の新事実、エラー解決、方針決定、タスクの開始・中断・完了）が出たとき、「ai-docsに残して」「コンテキスト更新して」「メモっといて」「タスク閉じて」と言われたときに使う。workspace.md が無い場所では使わない。
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# ai-docs の更新

`<ワークスペース>/ai-docs/` はワークスペースの横断的な作業記憶。読み手は AI。作業の流れを止めずに最新に保つ。ai-docs の運用ルールはこのファイルに書き、案件固有の決まりは `<ワークスペース>/.claude/workspace.md` の「記録の決まり」に書く。

## 記録するタイミング
次のいずれかが起きたら、その区切り（ユーザーへの回答を返す直前）で記録する。記録するかどうかの判断は AI に任されているので、ユーザーに承認を求めない。
- 環境・手順の新事実が判明した（インストール先、ポート、必要な設定、コマンド）
- エラーやハマりどころを解決した（原因まで分かったもの）
- 方針・技術選定を決めた／ユーザーやチームの判断を聞いた
- タスクを始めた・中断した・完了した、次のアクションが変わった
- 外部リソース（Notion・Wiki・Issue の URL）を共有された
- ユーザーに明示的に頼まれた（「残して」「メモって」「コンテキスト更新」）

## 書かないもの
- 会話内でしか意味のない一時情報、コードを読めば分かること、一般論
- 推測・未確認のこと。書くのはユーザーと決めたことと、コード・コマンド結果・原文で確かめた事実だけ
- 秘密情報の値（置き場所だけを書く）
- リポジトリ内の規約・用語・設計書のコピー（パスで参照する）

## 置き場所
| 情報 | 書き込み先 | 更新方式 |
|---|---|---|
| プロダクト・関係者・外部リンク | `context/<topic>.md` | 上書き |
| この端末の環境・手順 | `env/<topic>.md` | 上書き |
| エラー解決 | `env/troubleshooting.md` に「症状→原因→対処→確認日」 | 追記 |
| 設計・方針の決定（ADR） | `decisions/YYYYMMDD-<slug>.md` | 追記のみ。覆すときは旧を `status: superseded` にし新規作成 |
| タスク | `tasks/YYYYMMDD-<ticket>-<slug>/`（チケット無しは `tasks/YYYYMMDDHHMM-<slug>/`） | context.md は上書き、log.md は追記のみ |
| 指摘から抜き出した教訓 | `/ai-workspace:distill-lesson` の手順に従う（台帳は `lessons.md`） | 該当行だけ更新 |
| 分類に迷う | `inbox/` | 一時置き場 |

## frontmatter（全ファイル必須・1行1キー）
```yaml
---
type: context | env | decision | task | note
status: active | blocked | done | draft | superseded   # task の context.md は 着手予定 | ペンディング | 進行中 | 完了
scope: [<repo>, <repo>]             # 関係するリポジトリ
ticket: <チケット表記>               # 無ければ行ごと省略。表記は workspace.md の「記録の決まり」
title: <タスク名の原文>              # task のみ必須。INDEX の title 列にも同じ文を書く
tags: [<kw>, <kw>]
updated: YYYY-MM-DD
last_verified: YYYY-MM-DD           # context/env は必須
source: <正本のパスやURL>            # 正本がある場合
summary: 1行要約（INDEX にそのまま転記できる文）
---
```

## 命名・書式
- 英小文字ケバブケース。`final` `v2` `new` `memo` `misc` は禁止
- チケットが無ければ作成日時 `YYYYMMDDHHMM` を独自 ID にする（ディレクトリ名の日付部分も兼ねる）。関連 Issue は `source` に書く
- 日付は絶対表記（YYYY-MM-DD）。「最近」「来週」などの相対表現は禁止
- 1ファイル300行以内。100行を超えたら冒頭に目次。超えそうなら分割
- タスク内は `context.md` / `log.md` / `assets/screenshots/` / `input/`（受領資料）
- 文体は `${CLAUDE_PLUGIN_ROOT}/references/writing-style.md` に従う

## タスクの context.md 冒頭（固定）
```
## 時点: YYYY-MM-DD
## 段階: <段階表の番号> <段階の名前>
## 最初に読むもの: <パス>
## 現状サマリ: 3〜5行
## 次のアクション: 箇条書き
```

## 手順
1. `ai-docs/INDEX.md` と `.claude/workspace.md` を Read（このセッションで読済みなら省略）
2. `grep -rn` で関連する既存の記述を探す。食い違いがあれば根拠でどちらが正しいかを示し、確かめられないものは候補から外す
3. 根拠で決められない食い違い（どちらが正しいか分からない）があるときだけ、AskUserQuestion で聞く
4. 書く。frontmatter を埋め、`updated`（事実系は `last_verified` も）を今日の日付にする
5. 新規ファイル・タスク状態の変化は `INDEX.md` に反映する（タスクは「タスク」表へ。status 列は context.md の status と同じ値）
6. タスク完了時: `status: 完了` → `tasks/_archive/` へ mv → INDEX のタスク表から外す → 恒久的な知見を context/env/decisions へ昇格
7. 1ディレクトリが30ファイルを超えたら、そのディレクトリに下位 INDEX.md を作る
8. 書き込み後に秘密情報が混入していないか確認する（鍵・トークン・パスワードの値）

## タスクの扱い
- 新しい作業を受け取ったら `tasks/` を作る。チケットの所在は workspace.md の「記録の決まり」
- タスクの状態は context.md の `status` だけで持つ。値と移り変わり:
  - 着手予定: 受け取ったが、まだ始めていない
  - 進行中: 作業している。同時に複数あってよい
  - ペンディング: 他者の返事・別タスクの完了など、自分では進められない。何を待っているかを「現状サマリ」に書く
  - 完了: 完了の定義を満たした。`tasks/_archive/` へ移す
- 状態の変更も、ほかの記録と同じく承認を求めずに書いて報告する
- 中断・セッション終了が近いときは `context.md` の「現状サマリ」「次のアクション」を必ず更新する（次のセッションの再開点になる）

## 報告
書き込んだら回答の末尾に1行で報告する。
> 📝 ai-docs: `env/troubleshooting.md` に「○○」を追記、`INDEX.md` 更新

## 禁止
- このファイルと workspace.md のルールに反する命名・配置
- 既存の decision やログの書き換え（追記・superseded で対応）
- ユーザーの発言の誇張・推測での補完
