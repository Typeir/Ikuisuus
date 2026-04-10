/**
 * @fileoverview `ik pull` — Pull content-first, update submodule ref.
 * @module multirepo/commands/pull
 */

import { log, spinner } from '@clack/prompts';
import { spawnSync } from 'child_process';

import type { CommandMeta } from '../../utils/cli-loader';
import { CHILD_ENV, CONTENT_REPO, MAIN_REPO } from '../constants';

/** Command metadata for the fs-based loader. */
export const meta: CommandMeta = {
  name: 'pull',
  description: 'Pull both repos + submodule update',
};

/**
 * Pulls content first, then main. Runs `submodule update` afterwards to
 * reconcile the pointer when main received a new submodule ref from upstream.
 * @param args - Arguments forwarded verbatim to `git pull`.
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
   * Use --rebase so the content submodule stays on its branch rather than
   * landing in a detached-HEAD state, which is the default for submodule update.
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
      '--rebase',
    ],
    { stdio: 'pipe', env: CHILD_ENV },
  );
  s.stop('Submodule updated');

  log.success('Both repos pulled');
}
