#!/usr/bin/env bash

# ============================================================================
# Pre-Commit Warning Hook  (installed in BOTH repos)
#
# Detects which repo it's running in, then checks the OTHER repo for
# uncommitted changes. Only warns when the other repo is dirty.
#
#   Committing on main repo  → warns if content repo has changes
#   Committing on content repo → warns if main repo has changes
#
# ============================================================================

set -euo pipefail

CURRENT_REPO="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0

# ---- Detect which repo we're in and find the other -------------------------

if [ -e "$CURRENT_REPO/src/content/.git" ]; then
  # Running in the MAIN repo — other is the content submodule
  OTHER_REPO="$CURRENT_REPO/src/content"
  OTHER_LABEL="content"
else
  # Running in the CONTENT repo — other is the main repo (2 levels up)
  CANDIDATE="$(cd "$CURRENT_REPO/../.." 2>/dev/null && pwd)" || exit 0
  if [ -e "$CANDIDATE/scripts/multirepo/ik.sh" ]; then
    OTHER_REPO="$CANDIDATE"
    OTHER_LABEL="main"
  else
    exit 0
  fi
fi

# ---- Check if the other repo has uncommitted changes -----------------------

other_is_dirty=0
if ! git -C "$OTHER_REPO" diff --quiet 2>/dev/null || \
   ! git -C "$OTHER_REPO" diff --cached --quiet 2>/dev/null; then
  other_is_dirty=1
fi

if [ $other_is_dirty -eq 1 ]; then
  cat << EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 MULTIREPO TIP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You're committing here, but the $OTHER_LABEL repo also has uncommitted changes.

Use \`ik\` to commit both repos together:

  ik commit -m "your message"

To disable this warning, edit: .git/hooks/pre-commit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF
fi

exit 0

