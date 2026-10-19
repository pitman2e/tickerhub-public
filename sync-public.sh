#!/bin/bash
DEST_NAME="tickerhub-public"

SRC="."
DEST="../${DEST_NAME}/"

# Prevent running from within the destination directory
if [[ "$PWD" == *"${DEST_NAME}"* ]]; then
  echo "Incorrect folder to execute this script" >&2
  exit 1
fi

rsync -av \
  --delete \
  --exclude='document/' \
  --exclude='backend/TickerHub.Api/Migrations/' \
  --exclude='frontend/node_modules/' \
  --exclude='frontend/dist/' \
  --exclude='ci/build.uat.sh' \
  --exclude='ci/build.prod.sh' \
  --exclude='frontend/ci/build.uat.sh' \
  --exclude='TestResults/' \
  --exclude='**/.git' \
  "$SRC" "$DEST"

cp -f "$DEST/frontend/src/auth/firebase.example.ts" "$DEST/frontend/src/auth/firebase.ts"
  
# Navigate to destination directory
cd "$DEST" || exit 1

git status

# Prompt to run git log
read -p "Run git diff? [y/N]: " show_diff
if [[ "$show_diff" =~ ^[Yy]$ ]]; then
  git diff
fi

# Prompt to confirm commit & push
read -p "Continue to commit? [y/N]: " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Operation aborted."
  exit 0
fi

git add .
git commit --amend -m "Snapshot"
git push -f
