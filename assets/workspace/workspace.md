# {案件名} workspace の設定

案件ごとに違うことだけを書く。進め方は `/ai-workspace:run-task`、段階は `ai-docs/env/task-workflow.md` が正。

## リポジトリ
| リポジトリ | 役割 | 既定ブランチ | ブランチ名の形式 | 規約の正本 |
|---|---|---|---|---|
| {repo} | {役割} | {main} | {feature/<slug>}（根拠: {ファイル or 調べた方法}） | {AGENTS.md / CLAUDE.md} |

## 自動で書き換わるファイル
起動・ビルドのたびに書き換わり、コミットに混ぜないファイル。
- {パス}

## 記録の決まり
- チケット: {所在（Notion / GitHub Issue 等）と ai-docs での表記}
- 用語の正本: {パス or URL}
- チーム共有の設計書の置き場: {パス}
