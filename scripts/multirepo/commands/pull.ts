/**
 * @fileoverview `ik pull` — Pull content-first, update submodule ref.
 * @module scripts/multirepo/commands/pull
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import { log, spinner } from '@clack/prompts';
import { spawnSync } from 'child_process';

import type { CommandMeta } from '../../utils/cli-loader';
import { CHILD_ENV, CONTENT_REPO, MAIN_REPO } from '../constants';
import { attachContentToBranch } from '../git';

/** Command metadata for the fs-based loader. */
export const meta: CommandMeta = {
  name: 'pull',
  description: 'Pull both repos + submodule update',
};

/**
 * Pulls content repo first, then main repo. Then runs `submodule update`.
 * @param {string[]} args - Arguments forwarded verbatim to `git pull`.
 * @returns {Promise<void>}
 */
export async function run(args: string[]): Promise<void> {
  const s = spinner();

  s.start('Pulling content repo');
  const contentResult = spawnSync(
    'git',
    ['-C', CONTENT_REPO, 'pull', ...args],
    { stdio: 'pipe', env: CHILD_ENV },
  );
  if (contentResult.status !== 0) {
    s.stop('Content pull had issues — check git status');
  } else {
    s.stop('Content pulled');
  }

  s.start('Pulling main repo');
  const mainResult = spawnSync('git', ['-C', MAIN_REPO, 'pull', ...args], {
    stdio: 'pipe',
    env: CHILD_ENV,
  });
  if (mainResult.status !== 0) {
    s.stop('Failed');
    process.stderr.write(mainResult.stderr?.toString() ?? 'Unknown error\n');
    process.exit(1);
  }
  s.stop('Main pulled');

  s.start('Updating submodule ref');
  /**
   * --remote tracks the branch declared in `.gitmodules`; --merge merges
   * upstream changes into the local branch instead of detaching HEAD.
   */
  spawnSync(
    'git',
    [
      '-C',
      MAIN_REPO,
      'submodule',
      'update',
      '--init',
      '--recursive',
      '--remote',
      '--merge',
    ],
    { stdio: 'pipe', env: CHILD_ENV },
  );
  s.stop('Submodule updated');

  attachContentToBranch();

  log.success('Both repos pulled');
}
