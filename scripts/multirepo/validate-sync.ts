#!/usr/bin/env tsx
/**
 * @fileoverview Post-commit hook that warns when the other repo is dirty.
 * @module multirepo/validate-sync
 */

import { spawnSync } from 'child_process';
import { existsSync, statSync } from 'fs';
import { resolve } from 'path';

/**
 * Runs a git command in a repo directory with git env-vars unset.
 * Returns the process exit status.
 * @param repo - Absolute path to the repository root.
 * @param args - Git subcommand and flags.
 */
function gitStatus(repo: string, args: string[]): number {
  const result = spawnSync('git', ['-C', repo, ...args], {
    stdio: 'pipe',
    env: {
      ...process.env,
      GIT_DIR: undefined,
      GIT_WORK_TREE: undefined,
      GIT_INDEX_FILE: undefined,
    },
  });
  return result.status ?? 1;
}

/**
 * Returns whether the repository has any staged or unstaged changes.
 * @param repo - Absolute path to the repository root.
 */
function isDirty(repo: string): boolean {
  return (
    gitStatus(repo, ['diff', '--quiet']) !== 0 ||
    gitStatus(repo, ['diff', '--cached', '--quiet']) !== 0
  );
}

/**
 * Entry point. Exits 0 in all cases; the hook only warns, never blocks.
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

  if (isDirty(otherRepo)) {
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  MULTIREPO OUT OF SYNC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Commit recorded here, but the ${otherLabel} repo still has uncommitted changes.

SOLUTION:
  ik commit -m "sync: <your message>"

Or check status:
  ik status

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
  }

  process.exit(0);
}

main();
