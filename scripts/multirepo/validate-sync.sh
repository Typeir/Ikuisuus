#!/usr/bin/env bash

# ============================================================================
# Post-Commit Validation Hook  (installed in BOTH repos)
#
# After a commit, checks if the OTHER repo is still dirty. If so, the user
# committed here without committing there — warn them to sync.
#
#   Post-commit on main repo  → warns if content repo still has changes
#   Post-commit on content repo → warns if main repo still has changes
#
# ============================================================================

set -euo pipefail

CURRENT_REPO="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0

# ---- Detect which repo we're in and find the other -------------------------

if [ -d "$CURRENT_REPO/.git" ]; then
  # .git is a DIRECTORY — we're in the MAIN repo
  # Other is the content submodule (2 levels down)
  OTHER_REPO="$CURRENT_REPO/src/content"
  OTHER_LABEL="content"
elif [ -f "$CURRENT_REPO/.git" ]; then
  # .git is a FILE (gitdir pointer) — we're in the CONTENT repo (submodule)
  # Other is the main repo (2 levels up)
  OTHER_REPO="$(cd "$CURRENT_REPO/../.." 2>/dev/null && pwd)" || exit 0
  OTHER_LABEL="main"
else
  exit 0
fi

# ---- Check if the other repo is still dirty --------------------------------
# Unset git env vars so git -C actually uses the other repo's context
unset GIT_DIR GIT_WORK_TREE 2>/dev/null || true

# DEBUG: trace detection
echo "[DEBUG validate-sync] CURRENT_REPO=$CURRENT_REPO" >&2
echo "[DEBUG validate-sync] OTHER_REPO=$OTHER_REPO OTHER_LABEL=$OTHER_LABEL" >&2
git -C "$OTHER_REPO" diff --quiet 2>/dev/null; echo "[DEBUG] diff exit=$?" >&2
git -C "$OTHER_REPO" diff --cached --quiet 2>/dev/null; echo "[DEBUG] cached exit=$?" >&2
echo "[DEBUG] GIT_DIR=${GIT_DIR:-unset} GIT_WORK_TREE=${GIT_WORK_TREE:-unset}" >&2

other_is_dirty=0
if ! git -C "$OTHER_REPO" diff --quiet 2>/dev/null || \
   ! git -C "$OTHER_REPO" diff --cached --quiet 2>/dev/null; then
  other_is_dirty=1
fi

if [ $other_is_dirty -eq 1 ]; then
  cat << EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  MULTIREPO OUT OF SYNC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Commit recorded here, but the $OTHER_LABEL repo still has uncommitted changes.

SOLUTION:
  ik commit -m "sync: <your message>"

Or check status:
  ik status

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF
fi

exit 0

