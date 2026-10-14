#!/bin/bash
# ワークスペース直下のリポジトリのファイルを、既定ブランチ（main / master / develop / origin の HEAD）のまま編集させない。
set -euo pipefail

ws_dir="${CLAUDE_PROJECT_DIR:-$PWD}"
[ -f "$ws_dir/.claude/workspace.md" ] || exit 0

file_path="$(jq -r '.tool_input.file_path // .tool_input.notebook_path // empty')"
[ -n "$file_path" ] || exit 0

for repo_git in "$ws_dir"/*/.git; do
  [ -e "$repo_git" ] || continue
  repo_dir="$(dirname "$repo_git")"
  case "$file_path" in
    "$repo_dir"/*) ;;
    *) continue ;;
  esac

  branch="$(git -C "$repo_dir" branch --show-current)"
  default="$(git -C "$repo_dir" symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null || true)"
  default="${default#origin/}"
  case "$branch" in
    main|master|develop|"$default")
      echo "$(basename "$repo_dir") は $branch ブランチです。作業ブランチを切ってから編集してください" >&2
      exit 2
      ;;
  esac
done
