/**
 * @fileoverview Handlers for the ik multirepo TUI.
 *
 * Each handler corresponds to one menu option and composes clack prompts with
 * the git primitives in `./git.ts` and the command runners in `./commands/`.
 *
 * @module multirepo/tui-handlers
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import {
    cancel,
    confirm,
    log,
    multiselect,
    select,
    text,
} from '@clack/prompts';

import { run as cmdAdd } from './commands/add';
import { run as cmdCleanBranches } from './commands/clean-branches';
import { run as cmdCommit } from './commands/commit';
import { run as cmdPull } from './commands/pull';
import { run as cmdPush } from './commands/push';
import { CONTENT_REPO, MAIN_REPO, type MenuOption } from './constants';
import { cmdPassthrough, git, listDirtyFiles, logRepo } from './git';
import { guardCancel } from './tui';

/**
 * Handles the `status` TUI action — short status for both repos.
 * @returns {Promise<void>}
 */
async function tuiStatus(): Promise<void> {
  log.message('');
  logRepo('main', 'status');
  git(MAIN_REPO, ['status', '--short']);
  log.message('');
  logRepo('content', 'status');
  git(CONTENT_REPO, ['status', '--short']);
  log.message('');
}

/**
 * Handles the `add` TUI action — file picker then stage.
 * @returns {Promise<void>}
 */
async function tuiAdd(): Promise<void> {
  const dirty = listDirtyFiles();
  if (dirty.length === 0) {
    log.info('Nothing to stage — both repos are clean');
    return;
  }
  const choice = await select({
    message: 'Stage what?',
    options: [
      { value: 'all', label: '. (everything)' },
      { value: 'pick', label: 'Pick individual files' },
      { value: 'custom', label: 'Type a path manually' },
    ],
  });
  guardCancel(choice);

  let targets: string[] = [];
  if (choice === 'all') {
    targets = ['.'];
  } else if (choice === 'pick') {
    const picked = await multiselect({
      message: 'Select files (space to toggle, enter to confirm)',
      options: dirty.map((f) => ({ value: f.split(': ')[1]!, label: f })),
    });
    guardCancel(picked);
    targets = picked as string[];
  } else {
    const raw = await text({ message: 'Path(s) to stage (space-separated):' });
    guardCancel(raw);
    targets = (raw as string).split(/\s+/).filter(Boolean);
  }
  await cmdAdd(targets);
}

/**
 * Handles the `commit` TUI action — message prompt then commit.
 * @returns {Promise<void>}
 */
async function tuiCommit(): Promise<void> {
  const message = await text({
    message: 'Commit message:',
    validate: (v) => ((v ?? '').trim().length < 3 ? 'Too short' : undefined),
  });
  guardCancel(message);
  await cmdCommit(['-m', message as string]);
}

/**
 * Handles the `push` TUI action — confirm + optional flags then push.
 * @returns {Promise<void>}
 */
async function tuiPush(): Promise<void> {
  const ok = await confirm({ message: 'Push both repos to origin?' });
  guardCancel(ok);
  if (!ok) {
    cancel('Aborted');
    return;
  }
  const extraArg = await text({
    message: 'Extra push flags (leave blank for none):',
    placeholder: '--force-with-lease  /  origin main',
  });
  guardCancel(extraArg);
  await cmdPush((extraArg as string).trim().split(/\s+/).filter(Boolean));
}

/**
 * Handles the `pull` TUI action — strategy picker then pull.
 * @returns {Promise<void>}
 */
async function tuiPull(): Promise<void> {
  const strategy = await select({
    message: 'Pull strategy:',
    options: [
      { value: '', label: 'Default merge' },
      { value: '--rebase', label: 'Rebase (--rebase)' },
      { value: '--ff-only', label: 'Fast-forward only (--ff-only)' },
    ],
  });
  guardCancel(strategy);
  await cmdPull((strategy as string) ? [strategy as string] : []);
}

/**
 * Handles the `fetch` TUI action — remote scope picker then fetch.
 * @returns {Promise<void>}
 */
async function tuiFetch(): Promise<void> {
  const opts = await select({
    message: 'Fetch options:',
    options: [
      { value: '', label: 'origin (default)' },
      { value: '--all', label: 'All remotes (--all)' },
      { value: '--all --prune', label: 'All remotes + prune (--all --prune)' },
    ],
  });
  guardCancel(opts);
  cmdPassthrough('fetch', (opts as string).trim().split(/\s+/).filter(Boolean));
}

/**
 * Handles the `log` TUI action — format picker then log.
 * @returns {Promise<void>}
 */
async function tuiLog(): Promise<void> {
  const fmt = await select({
    message: 'Log format:',
    options: [
      { value: 'short', label: 'Oneline  (-10)' },
      { value: 'medium', label: 'Oneline  (-25)' },
      { value: 'graph', label: 'Graph + oneline  (-20)' },
      { value: 'full', label: 'Full format  (-5)' },
    ],
  });
  guardCancel(fmt);
  const logArgs: Record<string, string[]> = {
    short: ['--oneline', '-10'],
    medium: ['--oneline', '-25'],
    graph: ['--graph', '--oneline', '-20'],
    full: ['-5'],
  };
  cmdPassthrough('log', logArgs[fmt as string]!);
}

/**
 * Handles the `diff` TUI action — scope picker then diff.
 * @returns {Promise<void>}
 */
async function tuiDiff(): Promise<void> {
  const scope = await select({
    message: 'Diff scope:',
    options: [
      { value: '', label: 'Unstaged changes' },
      { value: '--cached', label: 'Staged changes (--cached)' },
      { value: 'HEAD', label: 'Since last commit (HEAD)' },
    ],
  });
  guardCancel(scope);
  cmdPassthrough('diff', scope ? [scope as string] : []);
}

/**
 * Handles the `stash` TUI action — sub-command picker then stash.
 * @returns {Promise<void>}
 */
async function tuiStash(): Promise<void> {
  const sub = await select({
    message: 'Stash operation:',
    options: [
      { value: 'push', label: 'stash push (save current changes)' },
      { value: 'pop', label: 'stash pop  (restore last stash)' },
      { value: 'list', label: 'stash list (see all stashes)' },
      { value: 'drop', label: 'stash drop (discard last stash)' },
    ],
  });
  guardCancel(sub);
  if (sub === 'push') {
    const msg = await text({ message: 'Stash message (optional):' });
    guardCancel(msg);
    const label = (msg as string).trim();
    cmdPassthrough('stash', label ? ['push', '-m', label] : ['push']);
  } else {
    cmdPassthrough('stash', [sub as string]);
  }
}

/**
 * Handles the `branch` TUI action — operation picker then branch management.
 * @returns {Promise<void>}
 */
async function tuiBranch(): Promise<void> {
  const sub = await select({
    message: 'Branch operation:',
    options: [
      { value: 'list', label: 'List branches' },
      { value: 'list-all', label: 'List all branches (including remotes)' },
      { value: 'new', label: 'Create new branch' },
      { value: 'delete', label: 'Delete a branch' },
      { value: 'switch', label: 'Switch to a branch' },
      {
        value: 'clean',
        label: 'Delete all non-main branches (local + origin)',
      },
    ],
  });
  guardCancel(sub);

  /**
   * Prompts for a non-empty branch name.
   * @param {string} msg - Prompt message shown to the user.
   * @returns {Promise<string>} Trimmed branch name.
   */
  const promptName = async (msg: string): Promise<string> => {
    const name = await text({
      message: msg,
      validate: (v) => ((v ?? '').trim() ? undefined : 'Required'),
    });
    guardCancel(name);
    return (name as string).trim();
  };

  if (sub === 'list') cmdPassthrough('branch', []);
  else if (sub === 'list-all') cmdPassthrough('branch', ['-a']);
  else if (sub === 'new')
    cmdPassthrough('checkout', ['-b', await promptName('New branch name:')]);
  else if (sub === 'delete') {
    const name = await promptName('Branch to delete:');
    const force = await confirm({ message: 'Force delete? (-D)' });
    guardCancel(force);
    cmdPassthrough('branch', [force ? '-D' : '-d', name]);
  } else if (sub === 'clean') {
    const ok = await confirm({
      message:
        'Delete all non-main branches in both repos, locally and on origin?',
    });
    guardCancel(ok);
    if (!ok) {
      cancel('Aborted');
      return;
    }
    await cmdCleanBranches([]);
  } else {
    cmdPassthrough('checkout', [await promptName('Branch to switch to:')]);
  }
}

/**
 * Handles the free-form `passthrough` TUI action.
 * @returns {Promise<void>}
 */
async function tuiPassthrough(): Promise<void> {
  const raw = await text({
    message: 'git command (without "git"):',
    placeholder: 'fetch --all --prune',
    validate: (v) => ((v ?? '').trim() ? undefined : 'Required'),
  });
  guardCancel(raw);
  const parts = (raw as string).trim().split(/\s+/);
  cmdPassthrough(parts[0]!, parts.slice(1));
}

/** Dispatch table mapping each non-quit `MenuOption` to its TUI handler. */
export const TUI_HANDLERS: Record<
  Exclude<MenuOption, 'quit'>,
  () => Promise<void>
> = {
  status: tuiStatus,
  add: tuiAdd,
  commit: tuiCommit,
  push: tuiPush,
  pull: tuiPull,
  fetch: tuiFetch,
  log: tuiLog,
  diff: tuiDiff,
  stash: tuiStash,
  branch: tuiBranch,
  passthrough: tuiPassthrough,
};
