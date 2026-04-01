#!/usr/bin/env tsx
/**
 * @fileoverview Pre-commit warning hook for the multirepo setup.
 *
 * Detects which repo it's running in, then checks the OTHER repo for
 * uncommitted changes. Only warns when the other repo is dirty.
 *
 *   Committing on main repo    → warns if content repo has changes
 *   Committing on content repo → warns if main repo has changes
 *
 * Installed as `.git/hooks/pre-commit` in the content submodule by
 * `setup-hooks.ts`. Main repo hooks are managed by husky.
 *
 * @module multirepo/pre-commit-warn
 */

import { spawnSync } from 'child_process';
import { existsSync, statSync } from 'fs';
import { resolve } from 'path';

/**
 * Runs `git` with the given arguments inside a repo directory.
 * Returns the process exit status (0 = clean / success).
 * @param repo - Absolute path to the repository root.
 * @param args - Git subcommand and flags.
 */
function gitStatus(repo: string, args: string[]): number {
  const result = spawnSync('git', ['-C', repo, ...args], {
    stdio: 'pipe',
    env: { ...process.env, GIT_DIR: undefined, GIT_WORK_TREE: undefined, GIT_INDEX_FILE: undefined },
  });
  return result.status ?? 1;
}

/**
 * Returns `true` if the given repository has any staged or unstaged changes.
 * @param repo - Absolute path to the repository root.
 */
function isDirty(repo: string): boolean {
  return (
    gitStatus(repo, ['diff', '--quiet']) !== 0 ||
    gitStatus(repo, ['diff', '--cached', '--quiet']) !== 0
  );
}

/**
 * Returns `true` if the working tree has staged changes (i.e., a commit is
 * being made).
 * @param repo - Absolute path to the repository root.
 */
function hasStaged(repo: string): boolean {
  return gitStatus(repo, ['diff', '--cached', '--quiet']) !== 0;
}

/**
 * Entry point. Exits 0 in all cases — this hook only warns, never blocks.
 */
function main(): void {
  if (process.env['IK_RUNNING'] === '1') {
    process.exit(0);
  }

  const currentRepoResult = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    stdio: 'pipe',
  });
  if (currentRepoResult.status !== 0) process.exit(0);

  const currentRepo = currentRepoResult.stdout.toString().trim();
  const gitPath = resolve(currentRepo, '.git');

  let otherRepo: string;
  let otherLabel: string;

  try {
    const stat = statSync(gitPath);
    if (stat.isDirectory()) {
      otherRepo = resolve(currentRepo, 'src/content');
      otherLabel = 'content';
    } else {
      otherRepo = resolve(currentRepo, '../..');
      otherLabel = 'main';
    }
  } catch {
    process.exit(0);
  }

  if (!existsSync(otherRepo)) process.exit(0);

  if (!hasStaged(currentRepo)) process.exit(0);

  if (isDirty(otherRepo)) {
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 MULTIREPO TIP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You're committing here, but the ${otherLabel} repo also has uncommitted changes.

Use \`ik\` to commit both repos together:

  ik commit -m "your message"

To disable this warning, edit: .git/hooks/pre-commit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  }

  process.exit(0);
}

main();
