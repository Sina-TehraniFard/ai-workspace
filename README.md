# ai-workspace

複数のリポジトリを1つのフォルダにまとめて開発するときに、Claude Code がタスクを受け取ってから完了まで進めるプラグインです。

- 調査・設計・実装・確認・PR 作成まで順に進め、判断が要る所だけあなたに聞きます
- 作業の記録を残すので、次の日に開き直しても続きから再開できます
- 受けた指摘を覚え、同じ指摘を繰り返さないようにします
- 進行中のタスクと、今どこまで進んだかを入力欄の上に表示します

## 入れ方

Claude Code で次の2行を打ちます。

```
/plugin marketplace add Sina-TehraniFard/ai-workspace
/plugin install ai-workspace@ai-workspace
```

事前に `jq` を入れておいてください（macOS なら `brew install jq`）。

## 使い方

使うのは `/ai-workspace:run-task` だけです。

1. リポジトリをまとめたフォルダで Claude Code を起動し、`/ai-workspace:run-task` を打ちます。初回はフォルダの中を調べ、分からないことだけを質問して準備します
2. 準備が終わったら Claude Code を起動し直し、`/ai-workspace:run-task` にタスクのタイトルと内容を貼ります
3. 続きを進めるときは、`/ai-workspace:run-task` を何も付けずに打ちます

## License

MIT
