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

# Pre-commit hook (warning)
cp "$PROJECT_ROOT/scripts/multirepo/pre-commit-warn.sh" "$HOOKS_DIR/pre-commit"
chmod +x "$HOOKS_DIR/pre-commit"
log_success "Installed pre-commit hook"

# Post-commit hook
cp "$PROJECT_ROOT/scripts/multirepo/validate-sync.sh" "$HOOKS_DIR/post-commit"
chmod +x "$HOOKS_DIR/post-commit"
log_success "Installed post-commit hook"

log_success "All hooks installed!"
echo ""
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
