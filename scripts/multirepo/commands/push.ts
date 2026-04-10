/**
 * @fileoverview `ik push` — Push content-first, amend stale submodule ref.
 * @module multirepo/commands/push
 */

import { log, spinner } from '@clack/prompts';
import { spawnSync } from 'child_process';

import type { CommandMeta } from '../../utils/cli-loader';
import { CHILD_ENV, CONTENT_REPO, MAIN_REPO } from '../constants';
import { ensureContentOnBranch, isSubmoduleRefDirty } from '../git';

/** Command metadata for the fs-based loader. */
export const meta: CommandMeta = {
  name: 'push',
  description: 'Push content-first, amend if stale (--force-main to override)',
};

/**
 * Pushes content first (remote must have that SHA before main references it).
 * Detects a stale submodule ref and amends the last main commit before pushing.
 * @param args - Arguments forwarded verbatim to `git push`.
 */
export async function run(args: string[]): Promise<void> {
  ensureContentOnBranch();
  const s = spinner();
  /**
   * Allow an explicit override flag to force pushing main even if content
   * push fails. This is purposely a CLI-only sentinel and removed from the
   * arguments forwarded to `git push` so it won't be passed to Git.
   */
  const safeArgs = args.filter((a) => a !== '--force-main');
  const forceMain = safeArgs.length !== args.length;

  s.start('Pushing content repo');
  const contentResult = spawnSync(
    'git',
    ['-C', CONTENT_REPO, 'push', ...safeArgs],
    {
      stdio: 'pipe',
      env: CHILD_ENV,
    },
  );
  const contentStdout = contentResult.stdout?.toString() ?? '';
  const contentStderr = contentResult.stderr?.toString() ?? '';

  if (contentResult.status !== 0) {
    s.stop('Content push failed');
    /** Provide actionable diagnostics to avoid silent failures. */
    const details = (contentStderr + '\n' + contentStdout).trim();
    if (details.length > 0) {
      log.error(`Content push error:\n${details}`);
    } else {
      log.error(
        'Content push exited with non-zero status but produced no output.',
      );
    }
    log.warn(
      'Tip: run `ik status` and `git -C src/content status` to inspect the content repo.',
    );
    log.warn(
      'If this is an auth issue, ensure your PAT or SSH credentials are configured for the content remote.',
    );
    if (!forceMain) {
      log.error(
        'Aborting main push to avoid pushing a main commit that references an absent content SHA.',
      );
      process.exit(1);
    } else {
      log.warn(
        'Proceeding with main push due to `--force-main` override. This may leave the remote main referencing a missing content commit.',
      );
    }
  } else {
    s.stop('Content pushed');
  }

  if (isSubmoduleRefDirty()) {
    s.start('Amending stale submodule ref');
    spawnSync('git', ['-C', MAIN_REPO, 'add', 'src/content'], {
      stdio: 'pipe',
      env: CHILD_ENV,
    });
    spawnSync('git', ['-C', MAIN_REPO, 'commit', '--amend', '--no-edit'], {
      stdio: 'pipe',
      env: CHILD_ENV,
    });
    s.stop('Submodule ref amended');
  }

  s.start('Pushing main repo');
  const mainResult = spawnSync('git', ['-C', MAIN_REPO, 'push', ...args], {
    stdio: 'pipe',
    env: CHILD_ENV,
  });
  if (mainResult.status !== 0) {
    s.stop('Failed');
    process.stderr.write(mainResult.stderr?.toString() ?? 'Unknown error\n');
    process.exit(1);
  }

  s.stop('Main pushed');
  log.success('Both repos pushed');
}
