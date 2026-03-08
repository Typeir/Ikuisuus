#!/usr/bin/env bash

# ============================================================================
# Pre-Commit Warning Hook
#
# Warns user when they attempt to commit with `git commit` instead of `ik`.
# This is a friendly reminder, not a blocker—they can commit anyway.
#
# Install: bash scripts/multirepo/setup-hooks.sh
#
# ============================================================================

set -euo pipefail

# Get project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MAIN_REPO="$( cd "$SCRIPT_DIR/../.." && pwd )"
CONTENT_REPO="$MAIN_REPO/src/content"

# Only warn if content submodule exists
if [ ! -e "$CONTENT_REPO/.git" ]; then
  exit 0
fi

# Check if there are staged changes
if ! git diff --cached --quiet 2>/dev/null; then
  cat << 'EOF'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 MULTIREPO TIP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You're about to commit with `git commit`.

For this multirepo setup, use `ik` to sync both repos:

  ik commit -m "your message"

This will commit to BOTH the main wiki and content submodule.

To disable this warning, edit: .git/hooks/pre-commit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF
fi

exit 0
