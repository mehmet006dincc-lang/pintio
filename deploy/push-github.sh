#!/usr/bin/env bash
# GitHub'a yükle — bir kez: gh auth login
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v gh >/dev/null; then
  echo "GitHub CLI gerekli: brew install gh && gh auth login"
  exit 1
fi

gh auth setup-git

echo "Pushing new-branch..."
git push -u origin new-branch --force-with-lease

echo "Pushing main..."
git push origin main

echo "Done: https://github.com/mehmet006dincc-lang/pintio"
