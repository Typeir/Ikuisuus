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

# ---- Check if current repo has staged changes (about to commit) ---------------

current_has_staged=0
if ! git diff --cached --quiet 2>/dev/null; then
  current_has_staged=1
fi

# Only check other repo if we're actually committing something
if [ $current_has_staged -eq 0 ]; then
  exit 0
fi

# ---- Check if the other repo has uncommitted changes -----------------------
# Unset git env vars so git -C actually uses the other repo's context
unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE 2>/dev/null || true

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

