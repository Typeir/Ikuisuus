/**
 * @fileoverview Interactive TUI for the ik multirepo CLI.
 *
 * Exports `guardCancel` (Ctrl-C handler), `printHelp` (static help text),
 * and `runInteractive` (full arrow-key menu session). All UI logic lives
 * here; no git operations are performed directly.
 *
 * @module multirepo/tui
 */

import {
  cancel,
  confirm,
  intro,
  isCancel,
  log,
  multiselect,
  note,
  outro,
  select,
  text,
} from '@clack/prompts';

import {
  cmdAdd,
  cmdCommit,
  cmdPassthrough,
  cmdPull,
  cmdPush,
} from './commands';
import { C, CONTENT_REPO, LOGO, MAIN_REPO, type MenuOption } from './constants';
import { git, listDirtyFiles, logRepo, repoSummaryLine } from './git';

/**
 * Exits with a friendly cancellation message when the user presses Ctrl-C.
 * @param value - Value returned by a clack prompt (may be a cancel symbol).
 */
export function guardCancel(
  value: unknown,
): asserts value is NonNullable<typeof value> {
  if (isCancel(value)) {
    cancel('Cancelled.');
    process.exit(0);
  }
}

/**
 * Prints the full help text to stdout.
 */
export function printHelp(): void {
  console.log(`${C.cyan}${LOGO}${C.reset}`);
  console.log(`
${C.cyan}ik${C.reset} — Multirepo sync CLI (main + content submodule)

${C.yellow}INTERACTIVE (no args):${C.reset}
  ik                Arrow-key menu for all operations

${C.yellow}SHORTHAND (direct):${C.reset}
  ik add [files]    Stage in both repos              (default: .)
  ik commit -m …    Commit content-first, sync ref
  ik push [args]    Push content-first, amend if stale
                    (pass --force-main to override content failures — use with caution)
  ik pull [args]    Pull + submodule update
  ik fetch [args]   Fetch both repos
  ik status         Short status of both repos
  ik validate       Check for drift between repos
  ik nuke external spell:<slug>
                    Delete an external spell from JSON + Postgres
  ik log [args]     Log both repos (default: --oneline -10)
  ik diff [args]    Diff both repos
  ik stash …        Stash both repos
  ik <any> [args]   Passthrough to git in both repos
  ik help           Show this message
`);
}

/**
 * Handles the `status` TUI action — short status for both repos.
 */
async function tuiStatus(): Promise<void> {
  console.log('');
  logRepo('main', 'status');
  git(MAIN_REPO, ['status', '--short']);
  console.log('');
  logRepo('content', 'status');
  git(CONTENT_REPO, ['status', '--short']);
  console.log('');
}

/**
 * Handles the `add` TUI action — file picker then stage.
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
  const extra = (extraArg as string).trim().split(/\s+/).filter(Boolean);
  await cmdPush(extra);
}

/**
 * Handles the `pull` TUI action — strategy picker then pull.
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
  const pullArgs = (strategy as string) ? [strategy as string] : [];
  await cmdPull(pullArgs);
}

/**
 * Handles the `fetch` TUI action — remote scope picker then fetch.
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
    ],
  });
  guardCancel(sub);

  if (sub === 'list') {
    cmdPassthrough('branch', []);
  } else if (sub === 'list-all') {
    cmdPassthrough('branch', ['-a']);
  } else if (sub === 'new') {
    const name = await text({
      message: 'New branch name:',
      validate: (v) => ((v ?? '').trim() ? undefined : 'Required'),
    });
    guardCancel(name);
    cmdPassthrough('checkout', ['-b', (name as string).trim()]);
  } else if (sub === 'delete') {
    const name = await text({
      message: 'Branch to delete:',
      validate: (v) => ((v ?? '').trim() ? undefined : 'Required'),
    });
    guardCancel(name);
    const force = await confirm({ message: 'Force delete? (-D)' });
    guardCancel(force);
    cmdPassthrough('branch', [force ? '-D' : '-d', (name as string).trim()]);
  } else {
    const name = await text({
      message: 'Branch to switch to:',
      validate: (v) => ((v ?? '').trim() ? undefined : 'Required'),
    });
    guardCancel(name);
    cmdPassthrough('checkout', [(name as string).trim()]);
  }
}

/**
 * Handles the free-form `passthrough` TUI action.
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

/** Dispatch table mapping each `MenuOption` to its TUI handler. */
const TUI_HANDLERS: Record<MenuOption, () => Promise<void>> = {
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

/**
 * Builds and runs the full interactive TUI when `ik` is called with no arguments.
 * Uses arrow-key selectors, spinners, and confirmation prompts.
 */
export async function runInteractive(): Promise<void> {
  console.log(`${C.cyan}${LOGO}${C.reset}`);
  intro(`${C.cyan}ik${C.reset}  — multirepo workspace CLI`);

  note(repoSummaryLine(), 'repo state');

  const action = await select<MenuOption>({
    message: 'What do you want to do?',
    options: [
      {
        value: 'status',
        label: '📋  status       — show dirty files in both repos',
      },
      { value: 'add', label: '➕  add          — stage files' },
      { value: 'commit', label: '✅  commit       — commit both repos' },
      { value: 'push', label: '🚀  push         — push both repos' },
      { value: 'pull', label: '⬇️   pull         — pull both repos' },
      { value: 'fetch', label: '🔄  fetch        — fetch remotes' },
      { value: 'log', label: '📜  log          — recent commits' },
      { value: 'diff', label: '🔍  diff         — show changes' },
      { value: 'stash', label: '📦  stash        — stash / pop' },
      { value: 'branch', label: '🌿  branch       — list / manage branches' },
      {
        value: 'passthrough',
        label: '⚙️   passthrough  — run any git command',
      },
    ],
  });
  guardCancel(action);

  await TUI_HANDLERS[action as MenuOption]();

  outro('Done');
}
