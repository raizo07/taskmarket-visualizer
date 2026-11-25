#!/usr/bin/env bash
# One command: build, publish the repo if it does not exist, push, and make sure
# GitHub Pages is serving from Actions. Requires the GitHub CLI, authenticated.
set -euo pipefail

REPO="${REPO:-taskmarket-visualizer}"
OWNER="${OWNER:-$(gh api user --jq .login)}"
URL="https://${OWNER}.github.io/${REPO}/"

echo "==> building"
npm run build

echo "==> repository ${OWNER}/${REPO}"
if ! gh repo view "${OWNER}/${REPO}" >/dev/null 2>&1; then
  gh repo create "${OWNER}/${REPO}" --public \
    --description "A live read of the Taskmarket market: who posts, what gets paid, when the swarm is awake." \
    --source . --remote origin --push
else
  git remote get-url origin >/dev/null 2>&1 || git remote add origin "https://github.com/${OWNER}/${REPO}.git"
  git push -u origin main
fi

echo "==> enabling GitHub Pages (Actions source)"
gh api -X POST "repos/${OWNER}/${REPO}/pages" \
  -f build_type=workflow >/dev/null 2>&1 || \
  gh api -X PUT "repos/${OWNER}/${REPO}/pages" -f build_type=workflow >/dev/null 2>&1 || true

echo "==> done. The first deploy takes about a minute."
echo "    ${URL}"
