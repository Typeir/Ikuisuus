#!/usr/bin/env bash

# ============================================================================
# Hook Test Suite
#
# Verifies all git hooks are installed, resolvable, and functional.
# Run: npm run test:hooks
#
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PASS=0
FAIL=0

pass() { echo -e "  ${GREEN}✓${NC} $1"; PASS=$((PASS + 1)); }
fail() { echo -e "  ${RED}✗${NC} $1"; FAIL=$((FAIL + 1)); }
section() { echo -e "\n${CYAN}── $1 ──${NC}"; }

# ============================================================================
# 1. Husky infrastructure
# ============================================================================
section "Husky infrastructure"

if [ -f "$PROJECT_ROOT/.husky/_/h" ]; then
  pass "Husky dispatcher exists (.husky/_/h)"
else
  fail "Husky dispatcher missing — run: npx husky init"
fi

HOOKS_PATH=$(git -C "$PROJECT_ROOT" config core.hooksPath 2>/dev/null || echo "")
if [ "$HOOKS_PATH" = ".husky/_" ]; then
  pass "core.hooksPath = .husky/_"
else
  fail "core.hooksPath is '$HOOKS_PATH' (expected .husky/_) — run: npx husky"
fi

# ============================================================================
# 2. Husky hook files exist
# ============================================================================
section "Husky hook files (.husky/)"

for hook in pre-commit commit-msg post-commit post-checkout post-merge pre-push; do
  if [ -f "$PROJECT_ROOT/.husky/$hook" ]; then
    pass "$hook exists"
  else
    fail "$hook missing"
  fi
done

# ============================================================================
# 3. Source scripts referenced by hooks are resolvable
# ============================================================================
section "Source scripts resolvable"

if [ -f "$PROJECT_ROOT/scripts/hooks/pre-commit.js" ]; then
  pass "scripts/hooks/pre-commit.js exists"
else
  fail "scripts/hooks/pre-commit.js missing"
fi

if [ -f "$PROJECT_ROOT/scripts/hooks/commit-msg.js" ]; then
  pass "scripts/hooks/commit-msg.js exists"
else
  fail "scripts/hooks/commit-msg.js missing"
fi

if [ -f "$PROJECT_ROOT/scripts/multirepo/pre-commit-warn.sh" ]; then
  pass "scripts/multirepo/pre-commit-warn.sh exists"
else
  fail "scripts/multirepo/pre-commit-warn.sh missing"
fi

if [ -f "$PROJECT_ROOT/scripts/multirepo/validate-sync.sh" ]; then
  pass "scripts/multirepo/validate-sync.sh exists"
else
  fail "scripts/multirepo/validate-sync.sh missing"
fi

if [ -f "$PROJECT_ROOT/scripts/core/logger.cjs" ]; then
  pass "scripts/core/logger.cjs exists (shared dependency)"
else
  fail "scripts/core/logger.cjs missing — Node hooks will crash"
fi

if [ -f "$PROJECT_ROOT/scripts/hooks/.patterns" ]; then
  pass "scripts/hooks/.patterns exists (security patterns)"
else
  fail "scripts/hooks/.patterns missing — security scan will crash"
fi

# ============================================================================
# 4. Node require() resolution (the bug that kept breaking things)
# ============================================================================
section "Node require() resolution"

# Test that pre-commit.js can load its dependencies when run from project root
PRECOMMIT_CHECK=$(cd "$PROJECT_ROOT" && node -e "
  try {
    require('./scripts/hooks/pre-commit.js');
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      process.stdout.write('FAIL:' + e.message.split('\\n')[0]);
      process.exit(1);
    }
    // Other errors (e.g. no staged files) are fine — means it loaded OK
    process.stdout.write('OK');
  }
" 2>/dev/null && echo "" || true)

if [[ "$PRECOMMIT_CHECK" == FAIL* ]]; then
  fail "pre-commit.js cannot resolve deps: ${PRECOMMIT_CHECK#FAIL:}"
else
  pass "pre-commit.js dependencies resolve"
fi

# Test commit-msg.js can load (it will exit 1 with no args, but should not MODULE_NOT_FOUND)
COMMITMSG_CHECK=$(cd "$PROJECT_ROOT" && node -e "
  try {
    require('./scripts/hooks/commit-msg.js');
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      process.stdout.write('FAIL:' + e.message.split('\\n')[0]);
      process.exit(1);
    }
    process.stdout.write('OK');
  }
" 2>/dev/null && echo "" || true)

if [[ "$COMMITMSG_CHECK" == FAIL* ]]; then
  fail "commit-msg.js cannot resolve deps: ${COMMITMSG_CHECK#FAIL:}"
else
  pass "commit-msg.js dependencies resolve"
fi

# ============================================================================
# 5. Commit message validation logic
# ============================================================================
section "Commit message validation"

TMPFILE=$(mktemp)

echo "[fix]: resolve the bug" > "$TMPFILE"
if (cd "$PROJECT_ROOT" && node scripts/hooks/commit-msg.js "$TMPFILE" 2>/dev/null); then
  pass "Accepts valid:  [fix]: resolve the bug"
else
  fail "Rejected valid: [fix]: resolve the bug"
fi

echo "[dirty]: test" > "$TMPFILE"
if (cd "$PROJECT_ROOT" && node scripts/hooks/commit-msg.js "$TMPFILE" 2>/dev/null); then
  pass "Accepts valid:  [dirty]: test"
else
  fail "Rejected valid: [dirty]: test"
fi

echo "[TICKET-42]: add feature" > "$TMPFILE"
if (cd "$PROJECT_ROOT" && node scripts/hooks/commit-msg.js "$TMPFILE" 2>/dev/null); then
  pass "Accepts valid:  [TICKET-42]: add feature"
else
  fail "Rejected valid: [TICKET-42]: add feature"
fi

echo "no brackets here" > "$TMPFILE"
if (cd "$PROJECT_ROOT" && node scripts/hooks/commit-msg.js "$TMPFILE" 2>/dev/null); then
  fail "Accepted invalid: no brackets here"
else
  pass "Rejects invalid: no brackets here"
fi

echo "fix: missing brackets" > "$TMPFILE"
if (cd "$PROJECT_ROOT" && node scripts/hooks/commit-msg.js "$TMPFILE" 2>/dev/null); then
  fail "Accepted invalid: fix: missing brackets"
else
  pass "Rejects invalid: fix: missing brackets"
fi

rm -f "$TMPFILE"

# ============================================================================
# 6. Content submodule hooks
# ============================================================================
section "Content submodule hooks"

CONTENT_REPO="$PROJECT_ROOT/src/content"
if [ -e "$CONTENT_REPO/.git" ]; then
  if [ -f "$CONTENT_REPO/.git" ]; then
    GITDIR=$(sed 's/^gitdir: //' "$CONTENT_REPO/.git")
    CONTENT_HOOKS_DIR="$(cd "$CONTENT_REPO" && cd "$GITDIR" && pwd)/hooks"
  else
    CONTENT_HOOKS_DIR="$CONTENT_REPO/.git/hooks"
  fi

  for hook in pre-commit post-commit; do
    if [ -f "$CONTENT_HOOKS_DIR/$hook" ]; then
      if [ -x "$CONTENT_HOOKS_DIR/$hook" ]; then
        pass "Content repo $hook installed and executable"
      else
        fail "Content repo $hook exists but not executable"
      fi
    else
      fail "Content repo $hook not installed — run: npm run multirepo:setup"
    fi
  done
else
  echo -e "  ${YELLOW}⊘${NC} Content submodule not present — skipping"
fi

# ============================================================================
# 7. No stale hooks in .git/hooks/ that conflict with husky
# ============================================================================
section "Stale hook check"

STALE_HOOKS=0
for hook in pre-commit commit-msg; do
  if [ -f "$PROJECT_ROOT/.git/hooks/$hook" ]; then
    FIRST_LINE=$(head -1 "$PROJECT_ROOT/.git/hooks/$hook" 2>/dev/null || echo "")
    if [[ "$FIRST_LINE" == *"node"* ]]; then
      fail ".git/hooks/$hook is a stale Node hook (husky bypasses it, but clean up with: rm .git/hooks/$hook)"
      STALE_HOOKS=$((STALE_HOOKS + 1))
    fi
  fi
done
if [ $STALE_HOOKS -eq 0 ]; then
  pass "No stale Node hooks in .git/hooks/"
fi

# ============================================================================
# Summary
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
TOTAL=$((PASS + FAIL))
if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}All $TOTAL checks passed${NC}"
else
  echo -e "${RED}$FAIL/$TOTAL checks failed${NC}"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit $FAIL
