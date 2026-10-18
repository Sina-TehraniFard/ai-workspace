#!/bin/bash
# ワークスペースのリポジトリのファイルを、既定ブランチ（main / master / develop / origin の HEAD）のまま編集させない。
# 単独型ではワークスペース自体が対象のリポジトリで、記録の置き場（ai-docs/ と .claude/）は親フォルダ型と同じく止めない。
set -euo pipefail

ws_dir="${CLAUDE_PROJECT_DIR:-$PWD}"
[ -f "$ws_dir/.claude/workspace.md" ] || exit 0

file_path="$(jq -r '.tool_input.file_path // .tool_input.notebook_path // empty')"
[ -n "$file_path" ] || exit 0

if grep -q '^- 形: 単独' "$ws_dir/.claude/workspace.md"; then
  case "$file_path" in
    "$ws_dir"/ai-docs/*|"$ws_dir"/.claude/*) exit 0 ;;
  esac
  repo_dirs=("$ws_dir")
else
  repo_dirs=()
  for repo_git in "$ws_dir"/*/.git; do
    [ -e "$repo_git" ] && repo_dirs+=("$(dirname "$repo_git")")
  done
fi

for repo_dir in ${repo_dirs[@]+"${repo_dirs[@]}"}; do
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
