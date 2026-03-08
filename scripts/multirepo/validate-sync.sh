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
MAIN_HEAD=$(git -C "$MAIN_REPO" rev-parse HEAD 2>/dev/null || echo "unknown")

# Only validate if content submodule exists
if [ ! -e "$CONTENT_REPO/.git" ]; then
  exit 0
fi

CONTENT_HEAD=$(git -C "$CONTENT_REPO" rev-parse HEAD 2>/dev/null || echo "unknown")

# If commits are out of sync, warn user
if [ "$MAIN_HEAD" != "$CONTENT_HEAD" ]; then
  cat << 'EOF'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  MULTIREPO OUT OF SYNC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Main repo and content submodule are at different commits!

This usually means you ran `git commit` instead of `ik commit`.

SOLUTION:
  ik commit -m "sync: <your message>"

Or check what happened:
  ik status
  ik validate

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF
fi

exit 0
