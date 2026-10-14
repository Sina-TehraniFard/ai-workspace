---
type: env
status: active
scope: []
tags: [workflow, skills, commands]
updated: {YYYY-MM-DD}
last_verified: {YYYY-MM-DD}
summary: タスクを受け取りから完了まで進める段階表。/ai-workspace:advance-task が段階の判定と進行に使う
---

# タスクの段階表

全段階をワークスペースの直下で起動して進める。各リポジトリのスキル・コマンド・エージェントは `.claude/` のリンク経由で使える。リポジトリの規約そのものは各リポジトリの文書が正で、ここではパスだけを示す。

| # | 段階 | 実行するもの | 成果物 |
|---|---|---|---|
| 0 | 再開 | `ai-docs/INDEX.md` → `tasks/<dir>/context.md` を読む | なし |
| 1 | 要件の把握 | 新しいタスクなら `ai-docs` スキルで `tasks/<dir>/` を作り INDEX に追記する → {要件の原文の読み方（例: `gh issue view <N>`）} → `/ai-workspace:triage-issue` の手順で分類と設計の方向を出す | タスクのフォルダ・調査結果 |
| 2 | 既存コードを読む | {類似の既存実装の読み方（例: 入口 → 中間層 → 処理本体）} | {読んだ記録の置き場} |
| 3 | 設計 | {見本の設計書の探し方}。設計判断を AskUserQuestion で1つずつ決める。ブランチは不要 | context.md の設計判断の一覧 |
| 4 | ブランチ作成 | `.claude/workspace.md` のリポジトリ表の形式で切る。slug は domain-advisor サブエージェントに候補を出させる | ブランチ |
| 5 | 実装計画書 | {計画書の置き場と命名}。章立ては同種の既存計画書に合わせる | 実装計画書 |
| 6 | 実装 | `/ai-workspace:implement` の手順。{リポジトリの実装スキル} | コード・テスト |
| 7 | 品質確認 | {リポジトリごとの品質確認コマンドと根拠のファイル} | 全部成功したログ |
| 8 | セルフレビュー | `/ai-workspace:review-changes` | 指摘と修正 |
| 9 | コミット・PR | {リポジトリのコミット・PR の規約} | PR |
| 10 | 記録 | `ai-docs` スキルで `tasks/<dir>/log.md` と `context.md` を更新 | ai-docs 更新 |
| 11 | 完了 | `status: 完了` → `tasks/_archive/` へ移動 → INDEX から削除 | なし |

## 段階ごとの注意
- 1: {要件の正（Issue の完了の定義など）}
- 6: 依頼に関係のない修正はしない
- 9: 依頼していない段階では Claude はコミットしない
