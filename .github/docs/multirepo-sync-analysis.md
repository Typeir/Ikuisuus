# Multirepo Sync Strategy Analysis

## Your Setup

- **Main repo**: Ikuisuus (Next.js + metadata)
- **Content submodule**: `src/content` → `https://github.com/Typeir/ikuisuus-content.git`
- **Challenge**: Keep both repos in sync when committing changes that span both

---

## Option 1: Interactive CLI

### How It Works

Custom Node.js script with prompts: select action (add/commit/push), scope (main/content/both), message, then execute commands on appropriate repos.

### Implementation

```javascript
// scripts/multirepo-cli.mjs
import inquirer from 'inquirer';
import { execSync } from 'child_process';

async function main() {
  const action = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Action?',
      choices: ['add', 'commit', 'push', 'status'],
    },
  ]);

  const scope = await inquirer.prompt([
    {
      type: 'list',
      name: 'scope',
      message: 'Scope?',
      choices: ['main', 'content', 'both'],
    },
  ]);

  if (action === 'commit') {
    const msg = await inquirer.prompt([
      { type: 'input', name: 'message', message: 'Commit message:' },
    ]);
    // execute on both if scope === 'both'
  }
}
```

### Pros ✅

- **Maximum control**: Can handle complex logic (conditional commits, partial staging)
- **Clear feedback**: Prompts guide users step-by-step
- **Auditable**: Full record of what was synced and where
- **Flexible**: Easy to add advanced features (cherry-pick, tags, etc.)

### Cons ❌

- **User dislike**: You said you're not fond of CLIs
- **Slow workflow**: Extra prompts add friction to rapid iteration
- **Breaking from git muscle memory**: Can't use `git` directly

### Grade: **C** (doesn't match your preference)

---

## Option 2: Wrapper Commands (npm scripts + shell aliases)

### How It Works

Create `ik` command that wraps git operations. Runs the same git command on both repos automatically.

### Implementation (Recommended)

```bash
#!/usr/bin/env bash
# scripts/multirepo/ik.sh
# Wrapper for syncing commits across both repos

set -euo pipefail

MAIN_REPO="$(pwd)"
CONTENT_REPO="$MAIN_REPO/src/content"

case "$1" in
  add)
    git -C "$MAIN_REPO" add "${@:2}"
    git -C "$CONTENT_REPO" add "${@:2}" 2>/dev/null || true
    echo "✅ Staged in both repos"
    ;;

  commit)
    git -C "$MAIN_REPO" commit "${@:2}"
    git -C "$CONTENT_REPO" commit "${@:2}" 2>/dev/null || true
    echo "✅ Committed in both repos"
    ;;

  push)
    git -C "$MAIN_REPO" push "${@:2}"
    git -C "$CONTENT_REPO" push "${@:2}" 2>/dev/null || true
    echo "✅ Pushed both repos"
    ;;

  status)
    echo "=== Main Repo ===" && git -C "$MAIN_REPO" status
    echo "" && echo "=== Content Repo ===" && git -C "$CONTENT_REPO" status
    ;;

  *)
    echo "ik: unknown command '$1'"
    echo "Available: add, commit, push, status"
    exit 1
    ;;
esac
```

**Setup** (add to `.bashrc` or `.zshrc`, or use npm script):

```json
{
  "scripts": {
    "ik:add": "bash scripts/multirepo/ik.sh add",
    "ik:commit": "bash scripts/multirepo/ik.sh commit",
    "ik:push": "bash scripts/multirepo/ik.sh push",
    "ik:status": "bash scripts/multirepo/ik.sh status"
  }
}
```

Or create shell alias:

```bash
alias ik='bash scripts/multirepo/ik.sh'
# Then: ik add ., ik commit -m "msg", ik push
```

### Pros ✅

- **Familiar interface**: Just `git`-like commands with `ik` prefix
- **Fast**: No prompts, direct execution
- **Simple to implement**: ~50 lines of bash
- **Clear naming**: User knows they're syncing both repos
- **Fallback**: Can still use `git` directly if needed

### Cons ❌

- **User error risk**: If user forgets `ik` and runs `git commit`, only main repo commits
- **Partial failures**: If content repo is dirty, commands might error (handled with `2>/dev/null`)
- **Not truly bidirectional**: Doesn't detect which repo changed first

### Grade: **B+** (practical, aligns with your speed preference)

---

## Option 3: Git Hooks Middleware

### How It Works

Use `post-commit` hook in **main repo** to automatically detect changes and propagate to content submodule. Also detect parent repo changes from **within** content submodule with reverse hook.

### Implementation (Advanced)

```bash
#!/usr/bin/env bash
# .git/hooks/post-commit (main repo)
# Auto-sync content submodule commits

CONTENT_REPO="./src/content"

# Check if content submodule has staged/unstaged changes
if git -C "$CONTENT_REPO" diff --quiet --cached && git -C "$CONTENT_REPO" diff --quiet; then
  exit 0  # No changes in content, bail
fi

# Commit content changes automatically
cd "$CONTENT_REPO"
if git diff --quiet; then
  git add -A && git commit -m "sync: mirror commit from main wiki repo" 2>/dev/null || true
fi
```

**For reverse sync** (content → main), add hook in content submodule:

```bash
#!/usr/bin/env bash
# src/content/.git/hooks/post-commit
# Try to propagate up to parent repo if main.wiki also changed

MAIN_REPO="../.."
if [ -d "$MAIN_REPO/.git" ]; then
  cd "$MAIN_REPO"
  if ! git diff --quiet; then
    git add -A && git commit -m "sync: mirror from content submodule" 2>/dev/null || true
  fi
fi
```

### Pros ✅

- **Transparent**: Syncing happens automatically, no new mental model
- **Zero friction**: Normal `git commit` works on both repos
- **Automatic conflict detection**: Hooks can validate before committing
- **Fire and forget**: Users work with `git` normally

### Cons ❌

- **Magic/surprises**: Users may not realize commits happened in both repos
- **Hook installation**: Requires custom setup for each clone
- **Debugging confusion**: Errors in hooks are hard to diagnose
- **Breaking automation**: CI/CD or scripts expecting only main repo commit get unexpected 2nd commit
- **Pre-commit hook risk**: If content repo hook fails, parent commit already happened (losing atomicity)
- **Complex error handling**: What if one repo succeeds and other fails?

### Grade: **D-** (too fragile for a multirepo workflow)

---

## My Recommendation: Hybrid Approach

Use **Option 2 (Wrappers)** for primary workflow, augmented with **post-commit hook validation**:

```bash
#!/usr/bin/env bash
# .git/hooks/post-commit (main repo only)
# Validates that content submodule was also committed (if it had changes)

CONTENT_REPO="./src/content"

# If content has unstaged changes after commit, warn user
if ! git -C "$CONTENT_REPO" diff --quiet || ! git -C "$CONTENT_REPO" diff --cached --quiet; then
  echo "⚠️  WARNING: src/content has uncommitted changes"
  echo "   Run: npm run ik:commit -m '<msg>'"
  exit 0
fi
```

This gives you:

- **Speed of Option 2** (wrapper commands)
- **Safety of Option 1** (validation warnings)
- **Simplicity**: No complex middleware

---

## Implementation Decision Matrix

| Factor                | CLI            | Wrapper      | Hooks                 |
| --------------------- | -------------- | ------------ | --------------------- |
| **Friction**          | High (prompts) | Low          | None (auto)           |
| **Error safety**      | High           | Medium       | Low                   |
| **Debugging**         | Easy           | Easy         | Hard                  |
| **Learning curve**    | Medium         | Low          | High                  |
| **Git muscle memory** | Breaks it      | Preserves it | Preserves it          |
| **Complexity**        | ~200 LOC       | ~50 LOC      | ~80 LOC + hook config |

---

## Recommended Implementation Steps

1. **Implement wrapper script** (`scripts/multirepo/ik.sh`)
2. **Add npm script shortcuts** to package.json
3. **Add validation hook** to catch missed syncs
4. **Document in README** (brief guide on when to use `ik` vs `git`)
5. **Optional**: Create `scripts/multirepo/setup.sh` to auto-install hooks

**Total time**: ~30 minutes
**Maintenance**: ~5 minutes/month
