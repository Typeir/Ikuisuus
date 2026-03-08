#!/usr/bin/env bash
# ============================================================================
# Toggle Content Submodule
#
# Destroys or restores the src/content submodule so you can freely swap
# between the CONTENT_REPO branch (submodule) and the classic branch
# (embedded content tracked directly in the wiki repo).
#
# Usage:
#   bash scripts/migration/toggle-content-submodule.sh destroy   # before switching to classic branch
#   bash scripts/migration/toggle-content-submodule.sh restore   # after switching back to submodule branch
#
# ============================================================================

set -euo pipefail

SUBMODULE_PATH="src/content"
CONTENT_REPO_URL="https://github.com/Typeir/ikuisuus-content.git"
WIKI_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$WIKI_ROOT"

# ---- Helpers ----
red()   { printf "\033[1;31m%s\033[0m\n" "$*"; }
green() { printf "\033[1;32m%s\033[0m\n" "$*"; }
cyan()  { printf "\033[1;36m%s\033[0m\n" "$*"; }

# ---- Commands ----

destroy() {
  cyan "=== Destroying submodule at $SUBMODULE_PATH ==="

  # 1. Deinit (unregisters from .git/config)
  if git config --file .gitmodules --get "submodule.${SUBMODULE_PATH}.url" &>/dev/null; then
    echo "[1/3] Deinitializing submodule..."
    git submodule deinit -f "$SUBMODULE_PATH" 2>/dev/null || true
  else
    echo "[1/3] No submodule entry in .gitmodules — skipping deinit."
  fi

  # 2. Remove cached git index entry
  echo "[2/3] Removing git index entry..."
  git rm -rf --cached "$SUBMODULE_PATH" 2>/dev/null || true

  # 3. Clean up filesystem and .git/modules cache
  echo "[3/3] Cleaning up files..."
  rm -rf "$SUBMODULE_PATH"
  rm -rf ".git/modules/${SUBMODULE_PATH}"

  green "Done! Submodule destroyed."
  echo ""
  echo "You can now switch to the classic branch:"
  echo "  git checkout main"
  echo ""
  echo "To restore the submodule later, run:"
  echo "  bash scripts/migration/toggle-content-submodule.sh restore"
}

restore() {
  cyan "=== Restoring submodule at $SUBMODULE_PATH ==="

  # Clean any leftover directory so git submodule add works
  if [ -d "$SUBMODULE_PATH" ]; then
    echo "[pre] Removing existing $SUBMODULE_PATH directory..."
    rm -rf "$SUBMODULE_PATH"
  fi

  # Also clean .git/modules cache if present
  if [ -d ".git/modules/${SUBMODULE_PATH}" ]; then
    echo "[pre] Removing stale .git/modules/${SUBMODULE_PATH}..."
    rm -rf ".git/modules/${SUBMODULE_PATH}"
  fi

  # Remove stale index entry if any
  git rm -rf --cached "$SUBMODULE_PATH" 2>/dev/null || true

  echo "[1/2] Adding submodule from $CONTENT_REPO_URL ..."
  git submodule add "$CONTENT_REPO_URL" "$SUBMODULE_PATH"

  echo "[2/2] Initializing and updating..."
  git submodule update --init --recursive "$SUBMODULE_PATH"

  green "Done! Submodule restored at $SUBMODULE_PATH."
  echo ""
  echo "Remember to commit the .gitmodules change if it was modified."
}

# ---- Dispatch ----

case "${1:-}" in
  destroy|d)
    destroy
    ;;
  restore|r)
    restore
    ;;
  *)
    echo "Usage: bash $0 {destroy|restore}"
    echo ""
    echo "  destroy (d)  — Remove the content submodule so you can switch to the classic branch"
    echo "  restore (r)  — Re-add the content submodule after switching back"
    exit 1
    ;;
esac
