#!/usr/bin/env bash

# ============================================================================
# Setup Content Submodule Hooks
#
# Installs multirepo warning hooks in the content submodule.
# Main repo hooks are managed by husky (.husky/ directory).
# Only needs to be run once per clone.
#
# Usage:
#   bash scripts/multirepo/setup-hooks.sh
#
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()    { echo -e "${CYAN}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error()   { echo -e "${RED}❌ $1${NC}" >&2; }

# ---- Content repo hooks (submodule) ----
CONTENT_REPO="$PROJECT_ROOT/src/content"
if [ ! -e "$CONTENT_REPO/.git" ]; then
  log_info "Content submodule not found — nothing to install"
  exit 0
fi

CONTENT_HOOKS_DIR="$CONTENT_REPO/.git/hooks"
if [ -f "$CONTENT_REPO/.git" ]; then
  GITDIR=$(sed 's/^gitdir: //' "$CONTENT_REPO/.git")
  CONTENT_HOOKS_DIR="$(cd "$CONTENT_REPO" && cd "$GITDIR" && pwd)/hooks"
fi

mkdir -p "$CONTENT_HOOKS_DIR"
log_info "Installing content submodule hooks..."

cp "$PROJECT_ROOT/scripts/multirepo/pre-commit-warn.sh" "$CONTENT_HOOKS_DIR/pre-commit"
chmod +x "$CONTENT_HOOKS_DIR/pre-commit"
log_success "Installed pre-commit hook (content repo)"

cp "$PROJECT_ROOT/scripts/multirepo/validate-sync.sh" "$CONTENT_HOOKS_DIR/post-commit"
chmod +x "$CONTENT_HOOKS_DIR/post-commit"
log_success "Installed post-commit hook (content repo)"

echo ""
log_info "Main repo hooks are managed by husky (.husky/ directory)"
log_info "Run 'npm run test:hooks' to verify all hooks"
