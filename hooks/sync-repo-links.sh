#!/bin/bash
# ワークスペース直下の各リポジトリの skills / commands / agents を、ワークスペースの .claude/ からリンクで使えるようにする。
# skills はフォルダごとのリンクを Claude Code が認識しないため、1スキルずつリンクする。
set -euo pipefail

ws_dir="${CLAUDE_PROJECT_DIR:-$PWD}"
claude_dir="$ws_dir/.claude"
[ -f "$claude_dir/workspace.md" ] || exit 0

mkdir -p "$claude_dir/skills" "$claude_dir/commands" "$claude_dir/agents"

for link in "$claude_dir"/skills/* "$claude_dir"/commands/* "$claude_dir"/agents/*; do
  if [ -L "$link" ] && [ ! -e "$link" ]; then
    rm "$link"
  fi
done

for repo_git in "$ws_dir"/*/.git; do
  [ -e "$repo_git" ] || continue
  repo="$(basename "$(dirname "$repo_git")")"

  for kind in commands agents; do
    if [ -d "$ws_dir/$repo/.claude/$kind" ] && [ ! -e "$claude_dir/$kind/$repo" ]; then
      ln -s "../../$repo/.claude/$kind" "$claude_dir/$kind/$repo"
    fi
  done

  for skill_dir in "$ws_dir/$repo"/.claude/skills/*/; do
    [ -f "$skill_dir/SKILL.md" ] || continue
    name="$(basename "$skill_dir")"
    target="../../$repo/.claude/skills/$name"
    link="$claude_dir/skills/$name"
    if [ -L "$link" ] && [ "$(readlink "$link")" = "$target" ]; then
      continue
    fi
    if [ -e "$link" ] || [ -L "$link" ]; then
      echo "skip: skills/$name already exists ($repo)" >&2
      continue
    fi
    ln -s "$target" "$link"
  done
done

echo '{"hookSpecificOutput": {"hookEventName": "SessionStart", "reloadSkills": true}}'
