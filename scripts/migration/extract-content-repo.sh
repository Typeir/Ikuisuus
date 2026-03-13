#!/usr/bin/env bash
# ============================================================================
# Content Repo Extraction Script
#
# Extracts src/content/ into a standalone git repo, sets up its .gitignore,
# CI workflow, and banned-terms list, then wires the wiki repo to consume
# the new content repo as a git submodule at the original path.
#
# Prerequisites:
#   1. Create an EMPTY repo on GitHub (e.g. Typeir/ikuisuus-content)
#   2. Set CONTENT_REPO_URL below to that repo's HTTPS or SSH clone URL
#   3. Run this script from the wiki repo root
#
# Usage:
#   bash scripts/migration/extract-content-repo.sh
# ============================================================================

set -euo pipefail

FORCE=false
for arg in "$@"; do
  case "$arg" in
    --force|-f) FORCE=true ;;
  esac
done

# --------------- CONFIGURATION (edit before running) ---------------
CONTENT_REPO_URL="${CONTENT_REPO_URL:-https://github.com/Typeir/ikuisuus-content.git}"
SUBMODULE_PATH="src/content"
TEMP_DIR="../ikuisuus-content-tmp"
# -------------------------------------------------------------------

WIKI_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$WIKI_ROOT"

echo "=== Content Repo Extraction ==="
echo "Wiki root       : $WIKI_ROOT"
echo "Content path    : $SUBMODULE_PATH"
echo "Remote URL      : $CONTENT_REPO_URL"
echo "Temp staging dir: $(cd "$(dirname "$TEMP_DIR")" && pwd)/$(basename "$TEMP_DIR")"
echo ""

# ---- Step 1: Copy content to temp directory ----
if [ -d "$TEMP_DIR" ]; then
  if [ "$FORCE" = true ]; then
    echo "[pre] Removing existing staging directory (--force)..."
    rm -rf "$TEMP_DIR"
  else
    echo "ERROR: Staging directory already exists at: $(cd "$(dirname "$TEMP_DIR")" && pwd)/$(basename "$TEMP_DIR")"
    echo "       Re-run with --force to remove it automatically."
    exit 1
  fi
fi

echo "[1/6] Copying content to staging directory..."
mkdir -p "$TEMP_DIR"
cp -r "$SUBMODULE_PATH"/* "$TEMP_DIR"/

# ---- Step 2: Initialize content repo ----
echo "[2/6] Initializing git repo in staging directory..."
cd "$TEMP_DIR"
git init
git checkout -b main

# Copy template files from migration directory
cp "$WIKI_ROOT/scripts/migration/content-repo-gitignore" .gitignore
mkdir -p .github/workflows
cp "$WIKI_ROOT/scripts/migration/content-repo-ci.yml" .github/workflows/content-check.yml
cp "$WIKI_ROOT/scripts/migration/banned_terms.txt" .github/banned_terms.txt

# ---- Step 3: Commit and push content repo ----
echo "[3/6] Committing content..."
git add -A
git commit -m "[init]: extract MDX content from wiki repo"

echo "[4/6] Pushing to $CONTENT_REPO_URL ..."
git remote add origin "$CONTENT_REPO_URL"
if [ "$FORCE" = true ]; then
  git push --force -u origin main
else
  git push -u origin main
fi

# ---- Step 5: Back in wiki repo — remove tracked content, add submodule ----
cd "$WIKI_ROOT"
echo "[5/6] Removing tracked content from wiki repo..."
git rm -rf "$SUBMODULE_PATH"

# git rm only removes tracked files — untracked files (e.g. .metadata.json,
# build artefacts) can leave the directory behind, which causes
# `git submodule add` to fail with "already exists and is not a valid git repo".
if [ -d "$SUBMODULE_PATH" ]; then
  echo "       Cleaning leftover untracked files in $SUBMODULE_PATH ..."
  rm -rf "$SUBMODULE_PATH"
fi

echo "[6/6] Adding content repo as submodule at $SUBMODULE_PATH ..."
git submodule add "$CONTENT_REPO_URL" "$SUBMODULE_PATH"
git add .gitmodules "$SUBMODULE_PATH"
git commit -m "[refactor]: replace src/content with submodule from ikuisuus-content"

echo ""
echo "=== Done ==="
echo "Content repo pushed to: $CONTENT_REPO_URL"
echo "Submodule wired at:     $SUBMODULE_PATH"
echo ""
echo "Next steps:"
echo "  1. Verify the build: npm run pre-init && npm run build"
echo "  2. Enable branch protection + required 'content-check' status on the content repo"
echo "  3. Set environment variables on Vercel (see .env.example)"
echo "  4. Clean up staging dir: rm -rf $TEMP_DIR"
