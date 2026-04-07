/**
 * @fileoverview Smart sync commands for the ik multirepo CLI.
 *
 * Each exported function runs the corresponding git operation across both
 * repos in the correct dependency order (content-first) and keeps the
 * submodule ref in the main repo in sync.
 *
 * @module multirepo/commands
 */

import { log, spinner } from '@clack/prompts';
import { spawnSync } from 'child_process';

import { CHILD_ENV, CONTENT_REPO, MAIN_REPO } from './constants';
import {
  ensureContentOnBranch,
  git,
  gitCapture,
  isDirty,
  isSubmoduleRefDirty,
  logRepo,
} from './git';

/**
 * Stages files in both repos with a spinner.
 * Content failures are soft-warned; main failures abort for real errors only.
 * @param files - Paths to stage; defaults to `['.']` when empty.
 */
export async function cmdAdd(files: string[]): Promise<void> {
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

/**
 * Commits content repo first so its SHA exists before main records it.
 * Re-stages the submodule ref in main after a successful content commit.
 * @param args - Arguments forwarded verbatim to `git commit`.
 */
export async function cmdCommit(args: string[]): Promise<void> {
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

/**
 * Pushes content first (remote must have that SHA before main references it).
 * Detects a stale submodule ref and amends the last main commit before pushing.
 * @param args - Arguments forwarded verbatim to `git push`.
 */
export async function cmdPush(args: string[]): Promise<void> {
  ensureContentOnBranch();
  const s = spinner();
  // Allow an explicit override flag to force pushing main even if content
  // push fails. This is purposely a CLI-only sentinel and removed from the
  // arguments forwarded to `git push` so it won't be passed to Git.
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
    // Provide actionable diagnostics to avoid silent failures.
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

/**
 * Pulls content first, then main. Runs `submodule update` afterwards to
 * reconcile the pointer when main received a new submodule ref from upstream.
 * @param args - Arguments forwarded verbatim to `git pull`.
 */
export async function cmdPull(args: string[]): Promise<void> {
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
  // Use --rebase so the content submodule stays on its branch rather than
  // landing in a detached-HEAD state, which is the default for submodule update.
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

/**
 * Prints short git status for both repos.
 */
export function cmdStatus(): void {
  console.log('');
  logRepo('main', 'status');
  git(MAIN_REPO, ['status', '--short']);
  console.log('');
  logRepo('content', 'status');
  git(CONTENT_REPO, ['status', '--short']);
  console.log('');
}

/**
 * Warns when both repos are dirty at diverged HEADs (forgot to use `ik commit`).
 */
export function cmdValidate(): void {
  const mainDirty = isDirty(MAIN_REPO);
  const contentDirty = isDirty(CONTENT_REPO);

  if (!mainDirty || !contentDirty) {
    log.success('Repos are in sync');
    return;
  }

  const mainHead = gitCapture(MAIN_REPO, ['rev-parse', 'HEAD']);
  const contentHead = gitCapture(CONTENT_REPO, ['rev-parse', 'HEAD']);

  if (mainHead !== contentHead) {
    log.warn(
      'Both repos are dirty but at different commits — run: ik commit -m "msg"',
    );
  } else {
    log.success('Both repos dirty but at the same commit (OK)');
  }
}

/**
 * Runs an arbitrary git command in both repos sequentially, inheriting stdio
 * so interactive output (diff colours, log pager, progress) works as expected.
 * @param command - Git subcommand name.
 * @param args    - Additional flags and arguments forwarded verbatim.
 */
export function cmdPassthrough(command: string, args: string[]): void {
  console.log('');
  logRepo('main', `git ${command} ${args.join(' ')}`);
  git(MAIN_REPO, [command, ...args]);

  console.log('');
  logRepo('content', `git ${command} ${args.join(' ')}`);
  git(CONTENT_REPO, [command, ...args]);
  console.log('');
}
