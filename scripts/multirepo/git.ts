/**
 * @fileoverview Git primitives for the ik multirepo CLI.
 *
 * Provides low-level wrappers around `git` child processes, dirty-state
 * checks, submodule validation, and human-readable summary helpers.
 * All functions operate on absolute repo paths; none contain UI logic.
 *
 * @module multirepo/git
 */

import { log } from '@clack/prompts';
import { spawnSync } from 'child_process';
import { existsSync } from 'fs';

import { C, CHILD_ENV, CONTENT_REPO, MAIN_REPO } from './constants';

/**
 * Emits a cyan repo-label prefix followed by a message to stdout.
 * @param label - Short repo name (e.g. `main` or `content`).
 * @param msg   - Descriptive message.
 */
export function logRepo(label: string, msg: string): void {
  console.log(`${C.cyan}[${label}]${C.reset} ${msg}`);
}

/**
 * Runs a git command in a repository, inheriting all stdio handles so that
 * interactive output (colours, pager, progress bars) works correctly.
 * @param repo - Absolute path to the repository root.
 * @param args - Git arguments (subcommand + flags).
 * @returns Exit code of the git process (0 = success).
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
 * @param repo - Absolute path to the repository root.
 * @param args - Git arguments (subcommand + flags).
 * @returns Trimmed stdout string, or empty string on failure.
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
 * @param repo - Absolute path to the repository root.
 * @returns `true` when the working tree or index contains changes.
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
