#!/usr/bin/env bash

# ============================================================================
# Multirepo Sync Wrapper
#
# Syncs git operations across main wiki repo and content submodule.
# 
# Usage:
#   ik add [files...]          # Stage files in both repos
#   ik commit -m "msg"         # Commit in both repos
#   ik push [args...]          # Push both repos
#   ik status                  # Show status of both repos
#   ik diff [args...]          # Show diff from both repos
#
# ============================================================================

set -euo pipefail

# Get project root from script location
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
MAIN_REPO="$( cd "$SCRIPT_DIR/../.." && pwd )"
CONTENT_REPO="$MAIN_REPO/src/content"

# ---- Colors ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# ---- Helpers ----
log_main()    { echo -e "${CYAN}[main]${NC} $1"; }
log_content() { echo -e "${CYAN}[content]${NC} $1"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warn()    { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error()   { echo -e "${RED}❌ $1${NC}" >&2; }

# ---- Validators ----
check_submodule() {
  if [ ! -e "$CONTENT_REPO/.git" ]; then
    log_error "Content submodule not found at '$CONTENT_REPO'"
    log_error "Run: bash scripts/migration/toggle-content-submodule.sh restore"
    exit 1
  fi
}

# ---- Commands ----

cmd_add() {
  local files=("${@:2}")
  if [ ${#files[@]} -eq 0 ]; then
    files=(".")
  fi

  log_main "git add ${files[*]}"
  git -C "$MAIN_REPO" add "${files[@]}" || {
    log_error "Failed to stage in main repo"
    exit 1
  }

  log_content "git add ${files[*]}"
  if ! git -C "$CONTENT_REPO" add "${files[@]}" 2>/dev/null; then
    log_warn "Content repo add failed (may be untracked, OK)"
  fi

  log_success "Staged in both repos"
}

cmd_commit() {
  log_main "git commit $*"
  if ! git -C "$MAIN_REPO" commit "$@"; then
    log_error "Failed to commit in main repo"
    exit 1
  fi

  log_content "git commit $*"
  if ! git -C "$CONTENT_REPO" commit "$@" 2>/dev/null; then
    log_warn "Content repo commit skipped (no staged changes)"
  fi

  log_success "Committed in both repos"
}

cmd_push() {
  log_main "git push $*"
  git -C "$MAIN_REPO" push "$@" || {
    log_error "Failed to push main repo"
    exit 1
  }

  log_content "git push $*"
  if ! git -C "$CONTENT_REPO" push "$@" 2>/dev/null; then
    log_warn "Content repo push skipped (check status)"
  fi

  log_success "Pushed both repos"
}

cmd_status() {
  echo ""
  log_main "Status:"
  git -C "$MAIN_REPO" status --short || true

  echo ""
  log_content "Status:"
  git -C "$CONTENT_REPO" status --short || true
  echo ""
}

cmd_diff() {
  echo ""
  log_main "Diff:"
  git -C "$MAIN_REPO" diff "$@" || true

  echo ""
  log_content "Diff:"
  git -C "$CONTENT_REPO" diff "$@" || true
  echo ""
}

cmd_log() {
  echo ""
  log_main "Log:"
  git -C "$MAIN_REPO" log --oneline -10 || true

  echo ""
  log_content "Log:"
  git -C "$CONTENT_REPO" log --oneline -10 || true
  echo ""
}

cmd_validate() {
  local main_dirty=0
  local content_dirty=0

  if ! git -C "$MAIN_REPO" diff --quiet; then
    main_dirty=1
  fi
  if ! git -C "$MAIN_REPO" diff --cached --quiet; then
    main_dirty=1
  fi

  if ! git -C "$CONTENT_REPO" diff --quiet 2>/dev/null; then
    content_dirty=1
  fi
  if ! git -C "$CONTENT_REPO" diff --cached --quiet 2>/dev/null; then
    content_dirty=1
  fi

  if [ $main_dirty -eq 1 ] && [ $content_dirty -eq 0 ]; then
    log_warn "Main repo has changes, but content repo is clean"
    echo "   Did you forget to stage content changes?"
    echo "   Run: ik add . && ik commit -m \"...\" "
  fi

  if [ $main_dirty -eq 0 ] && [ $content_dirty -eq 1 ]; then
    log_warn "Content repo has changes, but main repo is clean"
    echo "   Run: ik add . && ik commit -m \"...\""
  fi
}

# ---- Dispatch ----

check_submodule

case "${1:-}" in
  add)
    cmd_add "$@"
    ;;
  commit)
    cmd_commit "${@:2}"
    ;;
  push)
    cmd_push "${@:2}"
    ;;
  status|st)
    cmd_status
    ;;
  diff)
    cmd_diff "${@:2}"
    ;;
  log)
    cmd_log
    ;;
  validate)
    cmd_validate
    ;;
  help|-h|--help)
    cat << EOF
ik — Multirepo sync wrapper for main + content submodule

USAGE:
  ik <command> [args...]

COMMANDS:
  add [files...]    Stage files in both repos
  commit -m "msg"   Commit in both repos (see: git commit --help)
  push [args...]    Push both repos
  status, st        Show status of both repos
  diff [args...]    Show diff from both repos (see: git diff --help)
  log               Show last 10 commits from both repos
  validate          Check for unsynced changes
  help              Show this message

EXAMPLES:
  ik add .
  ik commit -m "Add new content"
  ik push origin main
  ik status
  ik diff --cached

EOF
    ;;
  *)
    log_error "Unknown command: ${1:-<missing>}"
    echo ""
    echo "Run: ik help"
    exit 1
    ;;
esac
