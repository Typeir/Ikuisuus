# Multirepo Sync Implementation Summary

## What You Now Have

A **hybrid wrapper + validation** system for syncing commits across your main wiki repo and content submodule. This is the **Option 2 (Wrappers) + validation hooks** from the analysis.

### Files Created

```
scripts/multirepo/
├── ik.sh                    (52 lines) - Main wrapper script
├── pre-commit-warn.sh       (44 lines) - Pre-commit hook (friendly reminder)
├── validate-sync.sh         (39 lines) - Post-commit validation hook
├── setup-hooks.sh           (48 lines) - Hook installer
└── README.md                (Complete usage guide)

.github/docs/
└── multirepo-sync-analysis.md (Detailed analysis of all 3 approaches)
```

### Package Scripts Added

```json
"multirepo:setup": "bash scripts/multirepo/setup-hooks.sh",
"multirepo:help": "bash scripts/multirepo/ik.sh help"
```

---

## Getting Started (3 Steps)

### Step 1: Install Hooks

```bash
npm run multirepo:setup
```

This installs the post-commit validation hook into `.git/hooks/post-commit`. You only need to run this once.

### Step 2: Test the Wrapper

```bash
bash scripts/multirepo/ik.sh help
bash scripts/multirepo/ik.sh status
```

You should see the status of both repos side-by-side.

### Step 3: Start Using `ik` Commands

```bash
# Instead of: git add .
ik add .

# Instead of: git commit -m "message"
ik commit -m "Add new monsters"

# Instead of: git push
ik push origin main

# Check status
ik status
```

---

## How It Works

### Normal Workflow ✅

```bash
# Stage changes
ik add .

# See what you're committing
ik diff --cached

# Commit (runs in both repos automatically)
ik commit -m "Add encounters"

# Pre-commit hook shows tip (if you used git commit)
# Post-commit hook validates sync automatically

# Push (to both repos)
ik push origin main
```

### If You Slip Up ⚠️

```bash
# You accidentally do:
git commit -m "oops"

# Post-commit hook warns only if BOTH repos have changes:
# ⚠️  BOTH REPOS HAVE CHANGES AND ARE OUT OF SYNC
# Both main repo and content submodule have changes but are at different commits.
# SOLUTION: ik commit -m "your message"

# Fix it:
git reset --soft HEAD~1    # Undo main commit (keeps staging)
ik commit -m "Add encounters"  # Now sync properly
```

**Note**: If only one repo has changes, there's no warning — repos can be at different commits without issue. No need for empty sync commits.

---

## Optional: Shell Alias (Recommended)

Make `ik` work globally without the bash path:

**For Bash** (`~/.bashrc` or `~/.bash_profile`):

```bash
alias ik='bash /Users/david/OneDrive/Desktop/Ikuisuus/scripts/multirepo/ik.sh'
```

**For Zsh** (`~/.zshrc`):

```bash
alias ik='bash /Users/david/OneDrive/Desktop/Ikuisuus/scripts/multirepo/ik.sh'
```

Then reload:

```bash
source ~/.bashrc  # (or ~/.zshrc)
```

After that, you can just type:

```bash
ik add .
ik commit -m "..."
ik push
```

---

## Available Commands

| Command               | Purpose               | Example               |
| --------------------- | --------------------- | --------------------- |
| `ik add [files...]`   | Stage in both repos   | `ik add .`            |
| `ik commit [opts]`    | Commit in both repos  | `ik commit -m "msg"`  |
| `ik push [opts]`      | Push both repos       | `ik push origin main` |
| `ik status` / `ik st` | Show both repo status | `ik status`           |
| `ik diff [opts]`      | Show diffs            | `ik diff --cached`    |
| `ik log`              | Last 10 commits       | `ik log`              |
| `ik validate`         | Manual sync check     | `ik validate`         |
| `ik help`             | Show help             | `ik help`             |

---

## Why This Approach?

### Pros

- ✅ **Familiar**: Just like `git` but with `ik` prefix
- ✅ **Fast**: No prompts, no friction
- ✅ **Safe**: Validation hook catches mistakes
- ✅ **Simple**: ~140 lines total, easy to debug
- ✅ **Fallback**: You can still use `git` directly if needed

### Cons (Minimal)

- ⚠️ **Easy to forget**: Must remember to use `ik` instead of `git`
  - **Mitigated by**: Post-commit hook warns you
- ⚠️ **Repo-specific**: Only works for this project (unless you make shell alias)
  - **Mitigated by**: Optional shell alias makes it global

---

## Comparison to Other Approaches

See [.github/docs/multirepo-sync-analysis.md](./.github/docs/multirepo-sync-analysis.md) for:

- **Option 1: Interactive CLI** — More control, but slow + you don't like CLIs
- **Option 3: Pure Git Hooks** — Transparent but fragile and hard to debug

---

## Troubleshooting

### "bash: ik: command not found"

You either forgot the full path or didn't set up the shell alias. Try:

```bash
bash scripts/multirepo/ik.sh status
```

Or set up the alias (see above).

### "Content submodule not found"

The submodule isn't initialized. Restore it:

```bash
bash scripts/migration/toggle-content-submodule.sh restore
```

### "run_command returned non-zero status"

The content submodule might be in a weird state. Check:

```bash
cd src/content
git status
git log -1
cd ../..
```

### Both repos have changes but one didn't commit

You can check what happened:

```bash
ik validate
ik status
```

Both commands show what's out of sync so you can fix manually.

---

## For Your Team

If others work with this repo, make sure they:

1. **First clone** includes the submodule:

   ```bash
   git clone --recurse-submodules https://github.com/Typeir/ikuisuus.git
   ```

2. **Install hooks** (one-time):

   ```bash
   npm run multirepo:setup
   ```

3. **Use `ik` wrapper** for commits:
   ```bash
   ik add .
   ik commit -m "..."
   ik push
   ```

---

## What's Next?

1. **Test it now:**

   ```bash
   npm run multirepo:setup
   ik status
   ```

2. **Optional:** Set up shell alias for global access

3. **Use `ik` instead of `git commit/push`** — that's it!

The validation hook will remind you if you ever slip up.

---

## Questions?

- **How does it work?** See `scripts/multirepo/ik.sh` (well-commented)
- **Why this approach?** See `.github/docs/multirepo-sync-analysis.md`
- **Usage guide?** See `scripts/multirepo/README.md`
