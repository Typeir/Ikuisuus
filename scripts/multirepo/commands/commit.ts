/**
 * @fileoverview `ik commit` — Commit content repo first, then main.
 * @module multirepo/commands/commit
 */

import { log, spinner } from '@clack/prompts';
import { spawnSync } from 'child_process';

import type { CommandMeta } from '../../utils/cli-loader';
import { CHILD_ENV, CONTENT_REPO, MAIN_REPO } from '../constants';
import { ensureContentOnBranch } from '../git';

/** Command metadata for the fs-based loader. */
export const meta: CommandMeta = {
  name: 'commit',
  description: 'Commit content-first, sync submodule ref',
};

/**
 * Commits content repo first so its SHA exists before main records it.
 * Re-stages the submodule ref in main after a successful content commit.
 * @param args - Arguments forwarded verbatim to `git commit`.
 */
export async function run(args: string[]): Promise<void> {
  ensureContentOnBranch();
  const s = spinner();

  s.start('Committing content repo');
  const contentResult = spawnSync(
    'git',
    ['-C', CONTENT_REPO, 'commit', ...args],
    { stdio: 'pipe', env: CHILD_ENV },
  );
  const contentCommitted = contentResult.status === 0;

  if (!contentCommitted) {
    s.stop('Content: nothing to commit');
  } else {
    s.stop('Content committed');
    spawnSync('git', ['-C', MAIN_REPO, 'add', 'src/content'], {
      stdio: 'pipe',
      env: CHILD_ENV,
    });
  }

  s.start('Committing main repo');
  const mainResult = spawnSync('git', ['-C', MAIN_REPO, 'commit', ...args], {
    stdio: 'pipe',
    env: CHILD_ENV,
  });

  if (mainResult.status !== 0) {
    s.stop('Failed');
    process.stderr.write(mainResult.stderr?.toString() ?? 'Unknown error\n');
    process.exit(1);
  }

  s.stop('Main committed');
  log.success('Both repos committed');
}
