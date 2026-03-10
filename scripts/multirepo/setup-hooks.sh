#!/usr/bin/env bash

# ============================================================================
# Setup Multirepo Hooks
#
# Installs git hooks to warn about out-of-sync repos.
# Only needs to be run once per clone.
#
# Usage:
#   bash scripts/multirepo/setup-hooks.sh
#
# ============================================================================

set -euo pipefail

# Get project root from script location
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"
HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()    { echo -e "${CYAN}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error()   { echo -e "${RED}❌ $1${NC}" >&2; }

# ---- Validate ----
if [ ! -d "$HOOKS_DIR" ]; then
  log_error ".git/hooks directory not found"
  log_error "Make sure you're in the project root"
  exit 1
fi

# ---- Install Hooks ----
log_info "Installing multirepo validation hooks..."

# Pre-commit hook (warning) — main repo
cp "$PROJECT_ROOT/scripts/multirepo/pre-commit-warn.sh" "$HOOKS_DIR/pre-commit"
chmod +x "$HOOKS_DIR/pre-commit"
log_success "Installed pre-commit hook (main repo)"

# Post-commit hook — main repo
cp "$PROJECT_ROOT/scripts/multirepo/validate-sync.sh" "$HOOKS_DIR/post-commit"
chmod +x "$HOOKS_DIR/post-commit"
log_success "Installed post-commit hook (main repo)"

# Content repo hooks (if submodule exists)
CONTENT_REPO="$PROJECT_ROOT/src/content"
if [ -e "$CONTENT_REPO/.git" ]; then
  CONTENT_HOOKS_DIR="$CONTENT_REPO/.git/hooks"
  # .git for a submodule may be a file pointing to the real hooks dir
  if [ -f "$CONTENT_REPO/.git" ]; then
    GITDIR=$(sed 's/^gitdir: //' "$CONTENT_REPO/.git")
    # Resolve relative path
    CONTENT_HOOKS_DIR="$(cd "$CONTENT_REPO" && cd "$GITDIR" && pwd)/hooks"
  fi
  mkdir -p "$CONTENT_HOOKS_DIR"
  cp "$PROJECT_ROOT/scripts/multirepo/pre-commit-warn.sh" "$CONTENT_HOOKS_DIR/pre-commit"
  chmod +x "$CONTENT_HOOKS_DIR/pre-commit"
  log_success "Installed pre-commit hook (content repo)"
  cp "$PROJECT_ROOT/scripts/multirepo/validate-sync.sh" "$CONTENT_HOOKS_DIR/post-commit"
  chmod +x "$CONTENT_HOOKS_DIR/post-commit"
  log_success "Installed post-commit hook (content repo)"
else
  log_info "Content submodule not found — skipping content repo hooks"
fi
echo "Next steps:"
echo "  1. Make sure ik.sh is executable:"
echo "     chmod +x scripts/multirepo/ik.sh"
echo ""
echo "  2. Test it:"
echo "     bash scripts/multirepo/ik.sh help"
echo ""
echo "  3. Optional: Create shell alias in \~/.bashrc or \~/.zshrc:"
echo "     alias ik='bash $PROJECT_ROOT/scripts/multirepo/ik.sh'"
echo ""
