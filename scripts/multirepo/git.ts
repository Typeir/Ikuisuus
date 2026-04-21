/**
 * @fileoverview Git primitives for the ik multirepo CLI.
 *
 * Provides low-level wrappers around `git` child processes, dirty-state
 * checks, submodule validation, and human-readable summary helpers.
 * All functions operate on absolute repo paths; none contain UI logic.
 *
 * @module multirepo/git
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import { log } from '@clack/prompts';
import { spawnSync } from 'child_process';
import { existsSync } from 'fs';

import { C, CHILD_ENV, CONTENT_REPO, MAIN_REPO } from './constants';

/**
 * Emits a cyan repo-label prefix followed by a message to stdout.
 * @param {string} label - Short repo name (e.g. `main` or `content`).
 * @param {string} msg - Descriptive message.
 * @returns {void}
 */
export function logRepo(label: string, msg: string): void {
  log.message(`${C.cyan}[${label}]${C.reset} ${msg}`);
}

/**
 * Runs a git command in a repository, inheriting all stdio handles so that
 * interactive output (colours, pager, progress bars) works correctly.
 * @param {string} repo - Absolute path to the repository root.
 * @param {string[]} args - Git arguments (subcommand + flags).
 * @returns {number} Exit code of the git process (0 = success).
 */
export function git(repo: string, args: string[]): number {
  const result = spawnSync('git', ['-C', repo, ...args], {
    stdio: 'inherit',
    env: CHILD_ENV,
  });
  return result.status ?? 1;
}

/**
 * Runs a git command silently and captures stdout as a trimmed string.
 * @param {string} repo - Absolute path to the repository root.
 * @param {string[]} args - Git arguments (subcommand + flags).
 * @returns {string} Trimmed stdout string, or empty string on failure.
 */
export function gitCapture(repo: string, args: string[]): string {
  const result = spawnSync('git', ['-C', repo, ...args], {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: CHILD_ENV,
  });
  return (result.stdout?.toString() ?? '').trim();
}

/**
 * Checks whether a repository has any uncommitted changes (staged or unstaged).
 * @param {string} repo - Absolute path to the repository root.
 * @returns {boolean} `true` when the working tree or index contains changes.
 */
export function isDirty(repo: string): boolean {
  const unstaged = spawnSync('git', ['-C', repo, 'diff', '--quiet'], {
    stdio: 'pipe',
    env: CHILD_ENV,
  });
  const staged = spawnSync('git', ['-C', repo, 'diff', '--cached', '--quiet'], {
    stdio: 'pipe',
    env: CHILD_ENV,
  });
  return unstaged.status !== 0 || staged.status !== 0;
}

/**
 * Returns `true` when the content submodule ref recorded in main is
 * out of sync with what is currently staged or committed in the working tree.
 */
export function isSubmoduleRefDirty(): boolean {
  const unstaged = spawnSync(
    'git',
    ['-C', MAIN_REPO, 'diff', '--quiet', '--', 'src/content'],
    { stdio: 'pipe', env: CHILD_ENV },
  );
  const staged = spawnSync(
    'git',
    ['-C', MAIN_REPO, 'diff', '--cached', '--quiet', '--', 'src/content'],
    { stdio: 'pipe', env: CHILD_ENV },
  );
  return unstaged.status !== 0 || staged.status !== 0;
}

/**
 * Aborts with a descriptive error when the content submodule is not initialised.
 */
export function checkSubmodule(): void {
  if (!existsSync(`${CONTENT_REPO}/.git`)) {
    log.error(`Content submodule not found at '${CONTENT_REPO}'`);
    log.error(
      'Run: bash scripts/migration/toggle-content-submodule.sh restore',
    );
    process.exit(1);
  }
}

/**
 * Re-attaches the content submodule to its `main` tracking branch when it is
 * in a detached-HEAD state.
 *
 * `git submodule update` (without `--rebase`/`--merge`) always checks out a
 * bare SHA, which leaves the working tree in detached-HEAD mode. Any
 * subsequent `git commit` in the content repo would then go nowhere. This
 * guard detects the situation and runs `git checkout main` before ik proceeds
 * with any write operation.
 */
/**
 * Guards against operating on a detached HEAD in the content repo.
 * Prints the detached SHA and instructions, then exits.
 * NEVER performs an automatic checkout — that risks orphaning commits.
 */
export function ensureContentOnBranch(): void {
  const headResult = spawnSync(
    'git',
    ['-C', CONTENT_REPO, 'symbolic-ref', '--short', 'HEAD'],
    { stdio: 'pipe', env: CHILD_ENV },
  );

  if (headResult.status !== 0) {
    const shaResult = spawnSync(
      'git',
      ['-C', CONTENT_REPO, 'rev-parse', '--short', 'HEAD'],
      {
        stdio: 'pipe',
        env: CHILD_ENV,
      },
    );
    const sha = shaResult.stdout?.toString().trim() ?? '(unknown)';
    log.error(`Content repo HEAD is detached at ${sha}.`);
    log.warn(
      'Do NOT run "git checkout main" without first checking for unpushed commits:',
    );
    log.warn('  git -C src/content log main..HEAD --oneline');
    log.warn('If you have commits above, cherry-pick them onto main:');
    log.warn('  git -C src/content checkout main');
    log.warn('  git -C src/content cherry-pick <sha>');
    log.warn('If there are no commits above main, it is safe to:');
    log.warn('  git -C src/content checkout main');
    process.exit(1);
  }
}

/**
 * Safely re-attaches the content submodule to its `main` branch when HEAD is
 * detached AND the detached commit is an ancestor of `origin/main` (so no
 * orphaning risk). A no-op when already on a branch, and a warn-and-return
 * when the detached SHA has unique commits above `origin/main`.
 *
 * Intended to be called from `ik setup`, `ik pull`, and post-checkout /
 * post-merge hooks so that routine workflows self-heal from the detached
 * HEAD state that bare `git submodule update` produces.
 *
 * @returns {boolean} `true` when a reattachment occurred, `false` otherwise.
 */
export function attachContentToBranch(): boolean {
  const headResult = spawnSync(
    'git',
    ['-C', CONTENT_REPO, 'symbolic-ref', '--short', 'HEAD'],
    { stdio: 'pipe', env: CHILD_ENV },
  );
  if (headResult.status === 0) {
    return false;
  }

  const ancestry = spawnSync(
    'git',
    ['-C', CONTENT_REPO, 'merge-base', '--is-ancestor', 'HEAD', 'origin/main'],
    { stdio: 'pipe', env: CHILD_ENV },
  );
  if (ancestry.status !== 0) {
    log.warn(
      'Content HEAD has commits above origin/main — not reattaching automatically.',
    );
    log.warn('Inspect with: git -C src/content log main..HEAD --oneline');
    return false;
  }

  const checkout = spawnSync('git', ['-C', CONTENT_REPO, 'checkout', 'main'], {
    stdio: 'pipe',
    env: CHILD_ENV,
  });
  if (checkout.status !== 0) {
    const stderr = checkout.stderr?.toString() ?? 'unknown error';
    log.warn(`Could not reattach content to main: ${stderr.trim()}`);
    return false;
  }
  log.message('Reattached content submodule to main.');
  return true;
}

/**
 * Returns a two-part status line for both repos using colour coding.
 */
export function repoSummaryLine(): string {
  const mainDirty = isDirty(MAIN_REPO);
  const contentDirty = isDirty(CONTENT_REPO);
  const m = mainDirty ? `${C.yellow}main: dirty${C.reset}` : 'main: clean';
  const c = contentDirty
    ? `${C.yellow}content: dirty${C.reset}`
    : 'content: clean';
  return `${m}   ${c}`;
}

/**
 * Lists all untracked and modified files across both repos.
 * @returns File path strings prefixed with `main:` or `content:`.
 */
export function listDirtyFiles(): string[] {
  const mainFiles = gitCapture(MAIN_REPO, ['status', '--short', '--porcelain'])
    .split('\n')
    .filter(Boolean)
    .map((l) => `main: ${l.slice(3)}`);
  const contentFiles = gitCapture(CONTENT_REPO, [
    'status',
    '--short',
    '--porcelain',
  ])
    .split('\n')
    .filter(Boolean)
    .map((l) => `content: ${l.slice(3)}`);
  return [...mainFiles, ...contentFiles];
}

/**
 * Runs an arbitrary git command in both repos sequentially, inheriting stdio
 * so interactive output (diff colours, log pager, progress) works as expected.
 * @param {string} command - Git subcommand name.
 * @param {string[]} args - Additional flags and arguments forwarded verbatim.
 * @returns {void}
 */
export function cmdPassthrough(command: string, args: string[]): void {
  log.message('');
  logRepo('main', `git ${command} ${args.join(' ')}`);
  git(MAIN_REPO, [command, ...args]);

  log.message('');
  logRepo('content', `git ${command} ${args.join(' ')}`);
  git(CONTENT_REPO, [command, ...args]);
  log.message('');
}
