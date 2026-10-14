# {案件名} workspace

このディレクトリは git 管理外の親ディレクトリ。配下にリポジトリと横断ドキュメント `ai-docs/` がある。案件の設定は `.claude/workspace.md`。

## タスクの管理
新しいタスクのタイトルや内容が貼られたとき、タスクを進める・再開する依頼があったときは、`/ai-workspace:advance-task` の手順で、受け取りから完了まで進める。

## 指摘の取り込み
ユーザーから指摘・訂正・不満を受けたら、対応を終えた区切りで `/ai-workspace:distill-lesson` の手順で教訓にする。

## 作業開始時
1. `.claude/workspace.md` と `ai-docs/INDEX.md` を Read して地図を把握する
2. 進行中タスクがあれば `ai-docs/tasks/<dir>/context.md` を読んで再開する
3. 作業中に残すべき知見が出たら `ai-docs` スキルで ai-docs を更新する
