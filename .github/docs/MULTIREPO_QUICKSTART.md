# Multirepo Sync - Quick Reference

## TL;DR

You now have a **wrapper + validation** system for syncing commits across your main wiki and content submodule.

### One-Time Setup

```bash
npm run multirepo:setup
```

### Use It

```bash
# Instead of `git add/commit/push`, use `ik`:
ik add .
ik commit -m "Add monsters"
ik push origin main
```

---

## What Was Created

```
scripts/multirepo/
├── ik.sh                  ← Main wrapper (use this!)
├── pre-commit-warn.sh     ← Reminds you to use ik (before commit)
├── validate-sync.sh       ← Auto-validates after commits
├── setup-hooks.sh         ← Installs hooks (run once)
└── README.md             ← Full documentation
```

Plus:

- `.github/docs/MULTIREPO_SETUP.md` — Setup guide
- `.github/docs/multirepo-sync-analysis.md` — Why this approach
- npm scripts in package.json

---

## How It Works

**You run:**

```bash
ik commit -m "message"
```

**Behind the scenes:**

1. `ik.sh` runs `git commit` in main repo ✓
2. `ik.sh` runs `git commit` in content repo ✓
3. Post-commit hook validates they're in sync ✓

**If you slip up:**

```bash
git commit -m "oops"        # Forgot to use `ik`
# Post-commit hook warns: ⚠️  MULTIREPO OUT OF SYNC

git reset --soft HEAD~1     # Undo (keeps staging)
ik commit -m "message"      # Do it right
```

---

## All Commands

| Command               | What It Does         |
| --------------------- | -------------------- |
| `ik add .`            | Stage in both repos  |
| `ik commit -m "msg"`  | Commit in both repos |
| `ik push origin main` | Push both repos      |
| `ik status`           | Show status of both  |
| `ik diff --cached`    | Show diffs           |
| `ik log`              | Last 10 commits      |
| `ik validate`         | Check sync status    |
| `ik help`             | Show help            |

---

## Optional: Global Shell Alias

Add to `~/.bashrc` or `~/.zshrc`:

```bash
alias ik='bash ~/path/to/ikuisuus/scripts/multirepo/ik.sh'
```

Then reload:

```bash
source ~/.bashrc
```

Now you can just type `ik` anywhere:

```bash
ik status
ik add .
ik commit -m "..."
```

---

## What's Next?

1. **Test it:**

   ```bash
   npm run multirepo:setup
   ik status
   ```

2. **Optional:** Set up shell alias for global access

3. **Start using `ik` instead of `git` for commits**

That's it!

---

## Why This Approach?

- ✅ Simple to use (just add `ik` prefix)
- ✅ No prompts or friction
- ✅ Validation catches mistakes
- ✅ ~140 lines of code, easy to debug
- ✅ You can still use `git` directly if needed (hook warns)

## See Also

- Full docs: `scripts/multirepo/README.md`
- Why this over other options: `.github/docs/multirepo-sync-analysis.md`
- Setup details: `.github/docs/MULTIREPO_SETUP.md`
