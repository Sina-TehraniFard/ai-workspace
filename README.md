# ai-workspace

複数の git リポジトリをまとめた親フォルダ（ワークスペース）で、Claude Code がタスクを受け取りから完了まで進めるためのプラグインです。

- タスクを段階表（要件の把握 → 既存コードを読む → 設計 → ブランチ → 実装計画 → 実装 → 品質確認 → セルフレビュー → PR → 記録 → 完了）に沿って進め、判断が要る所だけ人に聞きます
- 作業記録・決定・環境メモを `ai-docs/` に残し、次の会話で続きから再開します
- ユーザーや PR レビューの指摘を「場面 → 行動 → 理由」の教訓に直し、台帳に反映します
- 既定ブランチ（main / master / develop）のままリポジトリを編集するのを止めます

## 入れ方

```
/plugin marketplace add Sina-TehraniFard/ai-workspace
/plugin install ai-workspace@ai-workspace
```

`jq` が必要です（既定ブランチの編集を止めるフックで使います）。

## 始め方

1. リポジトリをまとめた親フォルダで Claude Code を起動します
2. `/ai-workspace:init` で初期設定します。リポジトリを調べ、分からないことだけを質問して `.claude/` と `ai-docs/` を作ります
3. Claude Code を起動し直し、タスクのタイトルと内容を `/ai-workspace:advance-task` に渡します

```
workspace/
├── .claude/
│   ├── CLAUDE.md        入口
│   └── workspace.md     案件ごとの設定（リポジトリ・ブランチ名の形式・チケットの所在）
├── ai-docs/
│   ├── INDEX.md         記録の目次
│   ├── lessons.md       教訓台帳
│   ├── env/task-workflow.md  タスクの段階表
│   ├── context/ decisions/ tasks/ inbox/
├── repo-a/
└── repo-b/
```

## 中身

| 種類 | 名前 | すること |
|---|---|---|
| コマンド | `advance-task` | タスクを段階表に沿って受け取りから完了まで進める |
| コマンド | `distill-lesson` | 指摘から教訓を抜き出し、既存の記録と照合して台帳に反映する |
| コマンド | `init` | 親フォルダをワークスペースとして初期設定する |
| コマンド | `triage-issue` | Issue をバグか新機能かに分け、根本原因の調査または設計をする |
| コマンド | `implement` | 既存の実装を調べてから実装し、ビルドとテストまで確かめる |
| コマンド | `review-changes` | 観点の違う複数のサブエージェントで並列にレビューする |
| コマンド | `explain-stepwise` | 分からないことを数ステップに分け、1ステップずつ説明する |
| スキル | `ai-docs` | `ai-docs/` を規約に沿って更新する |
| サブエージェント | `domain-advisor` | 変更容易性の観点でのレビュー・設計相談・命名 |
| フック | `sync-repo-links.sh` | 起動時に、各リポジトリの `.claude/` の skills / commands / agents を親フォルダからリンクする |
| フック | `guard-default-branch.sh` | 既定ブランチのままの編集を止める |

フックは `.claude/workspace.md` がある親フォルダでだけ動きます。ほかのプロジェクトでは何もしません。

## License

MIT
