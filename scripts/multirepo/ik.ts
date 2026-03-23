#!/usr/bin/env tsx
/**
 * @fileoverview ik — Multirepo sync CLI for main repo + content submodule.
 *
 * Smart commands (add, commit, push, pull) preserve submodule integrity by
 * operating on repos in the correct dependency order. Every other git command
 * is passed through automatically to both repos.
 *
 * Usage:
 *   ik add [files...]          Stage files in both repos
 *   ik commit -m "msg"         Commit in both repos (content first)
 *   ik push [args...]          Push both repos (content first, amend if stale)
 *   ik pull [args...]          Pull both repos (content first)
 *   ik fetch [args...]         Fetch both repos
 *   ik status                  Show short status of both repos
 *   ik diff [args...]          Diff both repos
 *   ik log [args...]           Log both repos (--oneline -10 by default)
 *   ik validate                Check for unsynced changes
 *   ik <any-git-cmd> [args...] Passthrough to both repos
 *
 * @module ik
 */

import { spawnSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

/** Absolute path to the directory containing this script. */
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

/** Absolute path to the main (wiki) repository root. */
const MAIN_REPO = resolve(SCRIPT_DIR, '../..');

/** Absolute path to the content submodule root. */
const CONTENT_REPO = resolve(MAIN_REPO, 'src/content');

/**
 * ANSI colour codes used for terminal output.
 * @property reset  - Resets all attributes.
 * @property red    - Error messages.
 * @property green  - Success messages.
 * @property yellow - Warning messages.
 * @property cyan   - Repo-label prefixes.
 */
const C = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
} as const;

/**
 * Shared environment block forwarded to every child git process.
 * Sets `IK_RUNNING=1` so hook scripts suppress cross-repo warnings.
 */
const CHILD_ENV = { ...process.env, IK_RUNNING: '1' };

/**
 * Prints a cyan repo-label prefix followed by a message.
 * @param label - Repo label (e.g. `main` or `content`).
 * @param msg   - Message to display.
 */
function logRepo(label: string, msg: string): void {
  console.log(`${C.cyan}[${label}]${C.reset} ${msg}`);
}

/**
 * Prints a green success message.
 * @param msg - Success text.
 */
function logSuccess(msg: string): void {
  console.log(`${C.green}✅ ${msg}${C.reset}`);
}

/**
 * Prints a yellow warning message.
 * @param msg - Warning text.
 */
function logWarn(msg: string): void {
  console.log(`${C.yellow}⚠️  ${msg}${C.reset}`);
}

/**
 * Prints a red error message to stderr.
 * @param msg - Error text.
 */
function logError(msg: string): void {
  process.stderr.write(`${C.red}❌ ${msg}${C.reset}\n`);
}

/**
 * Runs a git command in a repository, inheriting all stdio handles so that
 * interactive output (colours, pager, progress bars) works correctly.
 * @param repo - Absolute path to the repository root.
 * @param args - Git arguments (subcommand + flags).
 * @returns Exit code of the git process (0 = success).
 */
function git(repo: string, args: string[]): number {
  const result = spawnSync('git', ['-C', repo, ...args], {
    stdio: 'inherit',
    env: CHILD_ENV,
  });
  return result.status ?? 1;
}

/**
 * Runs a git command silently and captures stdout as a trimmed string.
 * @param repo - Absolute path to the repository root.
 * @param args - Git arguments (subcommand + flags).
 * @returns Trimmed stdout string, or empty string on failure.
 */
function gitCapture(repo: string, args: string[]): string {
  const result = spawnSync('git', ['-C', repo, ...args], {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: CHILD_ENV,
  });
  return (result.stdout?.toString() ?? '').trim();
}

/**
 * Checks whether a repository has any uncommitted changes (staged or unstaged).
 * @param repo - Absolute path to the repository root.
 * @returns `true` when the working tree or index contains changes.
 */
function isDirty(repo: string): boolean {
  const unstaged = spawnSync('git', ['-C', repo, 'diff', '--quiet'], { stdio: 'pipe', env: CHILD_ENV });
  const staged   = spawnSync('git', ['-C', repo, 'diff', '--cached', '--quiet'], { stdio: 'pipe', env: CHILD_ENV });
  return (unstaged.status !== 0) || (staged.status !== 0);
}

/**
 * Returns `true` when the content submodule ref recorded in main is
 * out of sync with what is currently staged or committed in the working tree.
 */
function isSubmoduleRefDirty(): boolean {
  const unstaged = spawnSync('git', ['-C', MAIN_REPO, 'diff', '--quiet', '--', 'src/content'], { stdio: 'pipe', env: CHILD_ENV });
  const staged   = spawnSync('git', ['-C', MAIN_REPO, 'diff', '--cached', '--quiet', '--', 'src/content'], { stdio: 'pipe', env: CHILD_ENV });
  return (unstaged.status !== 0) || (staged.status !== 0);
}

/**
 * Verifies that the content submodule is initialised before any git operation.
 * Exits the process with a descriptive error when the submodule is absent.
 */
function checkSubmodule(): void {
  if (!existsSync(`${CONTENT_REPO}/.git`)) {
    logError(`Content submodule not found at '${CONTENT_REPO}'`);
    logError('Run: bash scripts/migration/toggle-content-submodule.sh restore');
    process.exit(1);
  }
}

/**
 * Stages files in both repos.
 * Content-repo failures are tolerated (untracked path is not an error).
 * Main-repo failures abort only when the error is not a Windows `short read` artefact.
 * @param files - Paths to stage; defaults to `['.']` when empty.
 */
function cmdAdd(files: string[]): void {
  const targets = files.length > 0 ? files : ['.'];

  logRepo('content', `git add ${targets.join(' ')}`);
  const contentResult = spawnSync('git', ['-C', CONTENT_REPO, 'add', ...targets], { stdio: 'pipe', env: CHILD_ENV });
  if (contentResult.status !== 0) {
    logWarn('Content repo add had no effect (may be untracked, OK)');
  }

  logRepo('main', `git add ${targets.join(' ')}`);
  const mainResult = spawnSync('git', ['-C', MAIN_REPO, 'add', ...targets], { stdio: 'pipe', env: CHILD_ENV });
  const mainStderr = mainResult.stderr?.toString() ?? '';
  const hasRealError = mainResult.status !== 0 && mainStderr.replace(/short read/g, '').trim().length > 0;

  if (hasRealError) {
    logError('Failed to stage in main repo');
    process.stderr.write(mainStderr);
    process.exit(1);
  }

  logSuccess('Staged in both repos');
}

/**
 * Commits in the content repo first so the new SHA exists before main records
 * it. After a successful content commit the submodule ref is re-staged in main
 * so the pointer stays in sync.
 * @param args - Arguments forwarded verbatim to `git commit` in both repos.
 */
function cmdCommit(args: string[]): void {
  logRepo('content', `git commit ${args.join(' ')}`);
  const contentResult = spawnSync('git', ['-C', CONTENT_REPO, 'commit', ...args], { stdio: 'pipe', env: CHILD_ENV });
  const contentCommitted = contentResult.status === 0;

  if (!contentCommitted) {
    logWarn('Content repo commit skipped (no staged changes)');
  }

  if (contentCommitted) {
    logRepo('main', 'Staging updated submodule ref');
    spawnSync('git', ['-C', MAIN_REPO, 'add', 'src/content'], { stdio: 'inherit', env: CHILD_ENV });
  }

  logRepo('main', `git commit ${args.join(' ')}`);
  const mainStatus = git(MAIN_REPO, ['commit', ...args]);
  if (mainStatus !== 0) {
    logError('Failed to commit in main repo');
    process.exit(1);
  }

  logSuccess('Committed in both repos');
}

/**
 * Pushes content first (so the remote has the SHA before main references it),
 * then detects any stale submodule ref and folds it into the last main commit
 * via `--amend` before pushing main.
 * @param args - Arguments forwarded verbatim to `git push` in both repos.
 */
function cmdPush(args: string[]): void {
  logRepo('content', `git push ${args.join(' ')}`);
  const contentStatus = git(CONTENT_REPO, ['push', ...args]);
  if (contentStatus !== 0) {
    logWarn('Content repo push skipped (check status)');
  }

  if (isSubmoduleRefDirty()) {
    logRepo('main', 'Submodule ref out of sync — amending last commit');
    spawnSync('git', ['-C', MAIN_REPO, 'add', 'src/content'], { stdio: 'inherit', env: CHILD_ENV });
    spawnSync('git', ['-C', MAIN_REPO, 'commit', '--amend', '--no-edit'], { stdio: 'inherit', env: CHILD_ENV });
  }

  logRepo('main', `git push ${args.join(' ')}`);
  const mainStatus = git(MAIN_REPO, ['push', ...args]);
  if (mainStatus !== 0) {
    logError('Failed to push main repo');
    process.exit(1);
  }

  logSuccess('Pushed both repos');
}

/**
 * Pulls content first, then main. After pulling main, runs
 * `git submodule update` to reconcile the submodule pointer when main
 * received a new submodule ref from upstream.
 * @param args - Arguments forwarded verbatim to `git pull` in both repos.
 */
function cmdPull(args: string[]): void {
  logRepo('content', `git pull ${args.join(' ')}`);
  const contentStatus = git(CONTENT_REPO, ['pull', ...args]);
  if (contentStatus !== 0) {
    logWarn('Content repo pull had issues (check above)');
  }

  logRepo('main', `git pull ${args.join(' ')}`);
  const mainStatus = git(MAIN_REPO, ['pull', ...args]);
  if (mainStatus !== 0) {
    logError('Failed to pull main repo');
    process.exit(1);
  }

  logRepo('main', 'Updating submodule ref after pull');
  spawnSync('git', ['-C', MAIN_REPO, 'submodule', 'update', '--init', '--recursive'], { stdio: 'inherit', env: CHILD_ENV });

  logSuccess('Pulled both repos');
}

/**
 * Shows the short git status for both repos.
 */
function cmdStatus(): void {
  console.log('');
  logRepo('main', 'Status:');
  git(MAIN_REPO, ['status', '--short']);
  console.log('');
  logRepo('content', 'Status:');
  git(CONTENT_REPO, ['status', '--short']);
  console.log('');
}

/**
 * Warns when both repos have uncommitted changes but are at diverged HEAD commits,
 * indicating the user may have forgotten to use `ik commit`.
 */
function cmdValidate(): void {
  const mainDirty    = isDirty(MAIN_REPO);
  const contentDirty = isDirty(CONTENT_REPO);

  if (!mainDirty || !contentDirty) {
    return;
  }

  const mainHead    = gitCapture(MAIN_REPO, ['rev-parse', 'HEAD']);
  const contentHead = gitCapture(CONTENT_REPO, ['rev-parse', 'HEAD']);

  if (mainHead !== contentHead) {
    logWarn('Both repos have changes but are at different commits');
    console.log('   Run: ik commit -m "your message"');
  }
}

/**
 * Runs an arbitrary git command in both repos sequentially, inheriting stdio
 * so interactive output (diff colours, log pager, progress) works as expected.
 * @param command - Git subcommand name.
 * @param args    - Additional flags and arguments forwarded verbatim.
 */
function cmdPassthrough(command: string, args: string[]): void {
  console.log('');
  logRepo('main', `git ${command} ${args.join(' ')}`);
  git(MAIN_REPO, [command, ...args]);

  console.log('');
  logRepo('content', `git ${command} ${args.join(' ')}`);
  git(CONTENT_REPO, [command, ...args]);
  console.log('');
}

/**
 * Prints the full CLI help text to stdout.
 */
function printHelp(): void {
  console.log(`
ik — Multirepo sync CLI for main + content submodule

USAGE:
  ik <command> [args...]

SMART COMMANDS  (sync-aware — run in the correct repo order):
  add [files...]    Stage files in both repos                  [default: .]
  commit -m "msg"   Commit content first, then update submodule ref in main
  push [args...]    Push content first; amend stale ref, then push main
  pull [args...]    Pull content first, then main + submodule update
  status, st        Show short status of both repos
  validate          Warn when both repos are dirty at different commits

PASSTHROUGH COMMANDS  (runs git <cmd> in both repos):
  fetch, stash, rebase, merge, branch, checkout, switch,
  restore, reset, revert, tag, remote, show, blame,
  cherry-pick, bisect, clean, grep, shortlog, describe,
  reflog, gc, diff, log  — and any other git command.

EXAMPLES:
  ik add .
  ik add src/content/en/world/lore.mdx
  ik commit -m "feat: add bloodline lore"
  ik push
  ik push origin main --force-with-lease
  ik pull
  ik pull --rebase
  ik fetch --all --prune
  ik stash push -m "wip"
  ik stash pop
  ik branch -a
  ik log --graph --oneline -20
  ik diff --cached
  ik status
`);
}

/**
 * CLI entry point. Parses `process.argv`, dispatches to the appropriate
 * command handler, and exits with a non-zero code on failure.
 */
function main(): void {
  process.env['IK_RUNNING'] = '1';

  const argv    = process.argv.slice(2);
  const command = argv[0];
  const rest    = argv.slice(1);

  checkSubmodule();

  switch (command) {
    case 'add':
      cmdAdd(rest);
      break;

    case 'commit':
      cmdCommit(rest);
      break;

    case 'push':
      cmdPush(rest);
      break;

    case 'pull':
      cmdPull(rest);
      break;

    case 'status':
    case 'st':
      cmdStatus();
      break;

    case 'validate':
      cmdValidate();
      break;

    case 'log':
      cmdPassthrough('log', rest.length > 0 ? rest : ['--oneline', '-10']);
      break;

    case 'diff':
      cmdPassthrough('diff', rest);
      break;

    case 'help':
    case '-h':
    case '--help':
      printHelp();
      break;

    case undefined:
      logError('No command given.');
      console.log('\nRun: ik help');
      process.exit(1);
      break;

    default:
      cmdPassthrough(command, rest);
  }
}

main();
