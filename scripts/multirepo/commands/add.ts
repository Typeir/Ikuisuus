/**
 * @fileoverview `ik add` — Stage files in both repos.
 * @module multirepo/commands/add
 */

import { log, spinner } from '@clack/prompts';
import { spawnSync } from 'child_process';

import type { CommandMeta } from '../../utils/cli-loader';
import { CHILD_ENV, CONTENT_REPO, MAIN_REPO } from '../constants';
import { ensureContentOnBranch } from '../git';

/** Command metadata for the fs-based loader. */
export const meta: CommandMeta = {
  name: 'add',
  description: 'Stage files in both repos (default: .)',
};

/**
 * Stages files in both repos with a spinner.
 * Content failures are soft-warned; main failures abort for real errors only.
 * @param files - Paths to stage; defaults to `['.']` when empty.
 */
export async function run(files: string[]): Promise<void> {
  ensureContentOnBranch();
  const targets = files.length > 0 ? files : ['.'];
  const s = spinner();

  s.start(`Staging ${targets.join(' ')} in both repos`);

  const contentResult = spawnSync(
    'git',
    ['-C', CONTENT_REPO, 'add', ...targets],
    { stdio: 'pipe', env: CHILD_ENV },
  );
  if (contentResult.status !== 0) {
    s.stop('Content add had no effect (OK)');
  }

  const mainResult = spawnSync('git', ['-C', MAIN_REPO, 'add', ...targets], {
    stdio: 'pipe',
    env: CHILD_ENV,
  });
  const mainStderr = mainResult.stderr?.toString() ?? '';
  const hasRealError =
    mainResult.status !== 0 &&
    mainStderr.replace(/short read/g, '').trim().length > 0;

  if (hasRealError) {
    s.stop('Failed');
    log.error(`Main repo add failed:\n${mainStderr}`);
    process.exit(1);
  }

  s.stop(`Staged: ${targets.join(', ')}`);
}
