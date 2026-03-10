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

if [ -e "$CURRENT_REPO/src/content/.git" ]; then
  OTHER_REPO="$CURRENT_REPO/src/content"
  OTHER_LABEL="content"
else
  CANDIDATE="$(cd "$CURRENT_REPO/../.." 2>/dev/null && pwd)" || exit 0
  if [ -e "$CANDIDATE/scripts/multirepo/ik.sh" ]; then
    OTHER_REPO="$CANDIDATE"
    OTHER_LABEL="main"
  else
    exit 0
  fi
fi

# ---- Check if the other repo is still dirty --------------------------------

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

