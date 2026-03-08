# Multirepo Sync (Main + Content Submodule)

This project uses a **monorepo-adjacent** setup where the main wiki (`Ikuisuus`) and content (`src/content`) are separate git repositories that need to stay in sync.

## Quick Start

### 1. Install Hooks (one-time)
```bash
npm run multirepo:setup
```

This installs a post-commit hook that warns you if the two repos get out of sync.

### 2. Use `ik` for Synced Commits

Instead of `git add/.../commit/push`, use `ik`:

```bash
# Stage files in both repos
ik add .

# Commit in both repos
ik commit -m "Add new monsters"

# Push both repos
ik push origin main

# Check status
ik status

# See the difference
ik diff
```

Or if you prefer npm scripts:
```bash
bash scripts/multirepo/ik.sh add .
bash scripts/multirepo/ik.sh commit -m "..."
bash scripts/multirepo/ik.sh push origin main
```

### 3. (Optional) Create Shell Alias

Make `ik` available globally without typing the path:

**Bash** (`~/.bashrc`):
```bash
alias ik='bash /full/path/to/ikuisuus/scripts/multirepo/ik.sh'
```

**Zsh** (`~/.zshrc`):
```bash
alias ik='bash /full/path/to/ikuisuus/scripts/multirepo/ik.sh'
```

Then reload:
```bash
source ~/.bashrc  # or ~/.zshrc
```

---

## How It Works

### The Wrapper Pattern

`ik.sh` is a simple wrapper that runs `git` commands on both repos:

```bash
ik add .        # Runs git add in main + git add in src/content
ik commit -m "" # Runs git commit in both repos
ik push         # Runs git push in both repos
```

**Why this approach?**
- ✅ Familiar: Just adds `ik` prefix to normal git workflow
- ✅ Safe: Validates changes before committing
- ✅ Fast: No interactive prompts, no friction
- ✅ Recoverable: You can still use `git` directly if needed

### The Validation Hook

After you commit, `.git/hooks/post-commit` checks if both repos have changes **and** are at different commits. If so, it warns you.

**Note**: The hook only warns if *both* repos have changes. If one repo is clean (no changes), repos can be at different commits without warning — no need for empty sync commits.

### The Pre-Commit Warning Hook

Before you commit with `git commit`, `.git/hooks/pre-commit` displays a tip reminding you to use `ik commit` instead so both repos stay in sync.

This is **also not** a blocker—it's just informational. You can commit anyway if you want.

---

## Available Commands

### `ik add [files...]`
Stage files in both repos. If a file doesn't exist in one repo, it's silently skipped.

```bash
ik add .              # Stage all changes
ik add src/content    # Stage specific files
````

### `ik commit [options]`
Commit staged changes in both repos. Supports all `git commit` options.

```bash
ik commit -m "message"          # Simple message
ik commit --amend --no-edit     # Amend last commit
ik commit --no-verify           # Skip hooks
```

### `ik push [options]`
Push both repos to their remotes.

```bash
ik push                         # Default push
ik push origin main             # Specific branch
ik push --force-with-lease      # Force push safely
```

### `ik status` or `ik st`
Show status of both repos side-by-side.

```bash
ik status
ik st
```

### `ik diff [options]`
Show staged or unstaged diffs from both repos.

```bash
ik diff                 # Unstaged changes
ik diff --cached        # Staged changes
ik diff main..HEAD      # Commits since main
```

### `ik log`
Show last 10 commits from both repos.

```bash
ik log
```

### `ik validate`
Manually check if repos are in sync (runs automatically after commit via hook).

```bash
ik validate
```

### `ik help`
Show this help message.

```bash
ik help
```

---

## Troubleshooting

### "Content submodule not found"
The `src/content` submodule is either missing or not initialized.

**Solution:**
```bash
bash scripts/migration/toggle-content-submodule.sh restore
```

### Git says "fatal: run_command returned non-zero status"
The submodule might have a detached HEAD or be in a broken state.

**Solution:**
```bash
cd src/content
git status              # Check what's wrong
git checkout main       # Or the correct branch
cd ../..
ik status
```

### I accidentally ran `git commit` instead of `ik commit`

The post-commit hook will warn you. Don't panic—just sync the repos:

```bash
# Undo the main repo commit (keeps changes staged)
git reset --soft HEAD~1

# Now use ik to commit properly
ik commit -m "message"
```

### Both repos have changes but `ik add .` only stageed one

This can happen if the repos have different `.gitignore` files. Check which files exist:

```bash
ik status
git -C src/content status
```

Then stage manually where needed:
```bash
git add <files in main>
git -C src/content add <files in content>
ik commit -m "..."
```

### I want to commit to only one repo

That's fine—just use `git` directly:

```bash
git add .           # Stage in main only
git commit -m "..."

# Or in content only:
cd src/content
git add .
git commit -m "..."
cd ../..
```

The validation hook will remind you they're out of sync. Ignore it if intentional.

---

## Architecture

```
Ikuisuus (main repo)
├── src/
│   ├── app/
│   ├── lib/
│   └── content/ ← Git submodule (ikuisuus-content repo)
│
├── scripts/multirepo/
│   ├── ik.sh                 ← Wrapper script (git add/commit/push)
│   ├── validate-sync.sh      ← Post-commit hook (validation)
│   └── setup-hooks.sh        ← Hook installer
│
└── .git/hooks/
    └── post-commit           ← Installed by setup-hooks.sh
```

**Data Flows:**

1. **User runs `ik commit`** →
   - ik.sh runs `git commit` in main repo
   - ik.sh runs `git commit` in content repo  
   - Both repos now at same commit

2. **Post-commit hook fires** →
   - Validates that both repos are in sync
   - Warns if they're not (e.g., user ran `git` instead of `ik`)

3. **User runs `ik push`** →
   - Pushes main repo to origin
   - Pushes content repo to its origin
   - Both repos stay in sync with remotes

---

## For CI/CD

If your CI pipeline uses this repo, make sure it's aware of the submodule:

```yaml
# GitHub Actions example
- uses: actions/checkout@v4
  with:
    submodules: recursive    # ← Important!
    fetch-depth: 0
```

Then in your workflow, push with submodule awareness:

```bash
git push origin main
(cd src/content && git push origin main)
```

Or use `ik` wrapper if set up:
```bash
bash scripts/multirepo/ik.sh push origin main
```

---

## Questions?

See the analysis document for detailed comparison of alternative approaches:
[multirepo-sync-analysis.md](./multirepo-sync-analysis.md)

