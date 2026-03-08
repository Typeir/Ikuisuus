#!/usr/bin/env bash

# ============================================================================
# Post-Commit Validation Hook
#
# Warns user if main and content repos are out of sync after a commit.
# This helps catch the case where user ran `git commit` instead of `ik commit`.
#
# Install: bash scripts/multirepo/setup-hooks.sh
#
# ============================================================================

set -euo pipefail

# Get project root from script location
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MAIN_REPO="$( cd "$SCRIPT_DIR/../.." && pwd )"
CONTENT_REPO="$MAIN_REPO/src/content"

# Only validate if content submodule exists
if [ ! -e "$CONTENT_REPO/.git" ]; then
  exit 0
fi

# Check if repos have actual changes
main_has_changes=0
if ! git -C "$MAIN_REPO" diff --quiet || ! git -C "$MAIN_REPO" diff --cached --quiet; then
  main_has_changes=1
fi

content_has_changes=0
if ! git -C "$CONTENT_REPO" diff --quiet 2>/dev/null || ! git -C "$CONTENT_REPO" diff --cached --quiet 2>/dev/null; then
  content_has_changes=1
fi

# Only warn if BOTH have changes but are at different commits
if [ $main_has_changes -eq 1 ] && [ $content_has_changes -eq 1 ]; then
  MAIN_HEAD=$(git -C "$MAIN_REPO" rev-parse HEAD 2>/dev/null || echo "unknown")
  CONTENT_HEAD=$(git -C "$CONTENT_REPO" rev-parse HEAD 2>/dev/null || echo "unknown")
  
  if [ "$MAIN_HEAD" != "$CONTENT_HEAD" ]; then
    cat << 'EOF'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  BOTH REPOS HAVE CHANGES AND ARE OUT OF SYNC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Both main repo and content submodule have changes but are at different commits.

To sync them:
  ik commit -m "your message"

Check status:
  ik status

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF
  fi
fi

exit 0
