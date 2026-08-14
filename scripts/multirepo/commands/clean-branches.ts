/**
 * @fileoverview `ik clean-branches` — Delete all non-main branches.
 * @module multirepo/commands/clean-branches
 */

import { log, spinner } from '@clack/prompts';
import { spawnSync } from 'child_process';

import type { CommandMeta } from '../../utils/cli-loader';
import { CHILD_ENV, CONTENT_REPO, MAIN_REPO } from '../constants';
import { ensureContentOnBranch, gitCapture } from '../git';

/** Command metadata for the fs-based loader. */
export const meta: CommandMeta = {
  name: 'clean-branches',
  description: 'Delete all branches except main (local + origin)',
};

/**
 * Deletes all non-`main` local and `origin/*` remote branches in a repo.
 * @param repoPath - Absolute repository path.
 * @param label - Human-readable repo label for logs.
 * @returns Counts of deleted local and remote branches.
 */
function cleanRepoBranches(
  repoPath: string,
  label: 'main' | 'content',
): { localDeleted: number; remoteDeleted: number } {
  const checkoutResult = spawnSync(
    'git',
    ['-C', repoPath, 'checkout', 'main'],
    {
      stdio: 'pipe',
      env: CHILD_ENV,
    },
  );

  if (checkoutResult.status !== 0) {
    const stderr = checkoutResult.stderr?.toString() ?? 'Unknown error';
    log.error(`Failed to checkout main in ${label} repo:\n${stderr}`);
    process.exit(1);
  }

  const localOutput = gitCapture(repoPath, [
    'for-each-ref',
    '--format=%(refname:short)',
    'refs/heads',
  ]);
  const localBranches = localOutput
    .split('\n')
    .map((v) => v.trim())
    .filter((v) => v.length > 0 && v !== 'main');

  let localDeleted = 0;
  for (const branch of localBranches) {
    const deleteResult = spawnSync(
      'git',
      ['-C', repoPath, 'branch', '-D', branch],
      {
        stdio: 'pipe',
        env: CHILD_ENV,
      },
    );
    if (deleteResult.status === 0) {
      localDeleted += 1;
    } else {
      const stderr = deleteResult.stderr?.toString() ?? 'Unknown error';
      log.warn(
        `Could not delete local branch ${label}:${branch} — ${stderr.trim()}`,
      );
    }
  }

  const remoteRefsResult = spawnSync(
    'git',
    ['-C', repoPath, 'ls-remote', '--heads', 'origin'],
    {
      stdio: 'pipe',
      env: CHILD_ENV,
    },
  );

  if (remoteRefsResult.status !== 0) {
    const stderr = remoteRefsResult.stderr?.toString() ?? 'Unknown error';
    log.error(`Failed to list origin branches for ${label} repo:\n${stderr}`);
    process.exit(1);
  }

  const remoteBranches = Array.from(
    new Set(
      (remoteRefsResult.stdout?.toString() ?? '')
        .split('\n')
        .map((v) => v.trim())
        .filter((v) => v.length > 0)
        .map((v) => v.split(/\s+/)[1] ?? '')
        .filter((v) => v.startsWith('refs/heads/'))
        .map((v) => v.replace(/^refs\/heads\//, ''))
        .filter((v) => v.length > 0 && v !== 'main'),
    ),
  );

  let remoteDeleted = 0;
  for (const branch of remoteBranches) {
    const deleteResult = spawnSync(
      'git',
      ['-C', repoPath, 'push', 'origin', '--delete', branch],
      {
        stdio: 'pipe',
        env: CHILD_ENV,
      },
    );
    if (deleteResult.status === 0) {
      remoteDeleted += 1;
    } else {
      const stderr = deleteResult.stderr?.toString() ?? 'Unknown error';
      log.warn(
        `Could not delete remote branch ${label}:origin/${branch} — ${stderr.trim()}`,
      );
    }
  }

  return { localDeleted, remoteDeleted };
}

/**
 * Deletes all branches except `main` in both repos, locally and on origin, content first.
 * @param _args - Unused; present for the CliCommand contract.
 */
export async function run(_args: string[]): Promise<void> {
  ensureContentOnBranch();
  const s = spinner();

  s.start('Cleaning non-main branches in content repo');
  const contentResult = cleanRepoBranches(CONTENT_REPO, 'content');
  s.stop(
    `Content cleaned: deleted ${contentResult.localDeleted} local and ${contentResult.remoteDeleted} remote branches`,
  );

  s.start('Cleaning non-main branches in main repo');
  const mainResult = cleanRepoBranches(MAIN_REPO, 'main');
  s.stop(
    `Main cleaned: deleted ${mainResult.localDeleted} local and ${mainResult.remoteDeleted} remote branches`,
  );

  log.success('Branch cleanup completed for both repos');
}
