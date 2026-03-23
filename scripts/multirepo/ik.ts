#!/usr/bin/env tsx
/**
 * @fileoverview ik — Interactive multirepo sync CLI.
 *
 * When called with no arguments: launches an arrow-key TUI that walks the user
 * through all common git operations with spinners and confirmations.
 *
 * When called with arguments: behaves as a transparent shorthand (non-interactive),
 * so `ik push`, `ik add .`, `ik commit -m "msg"` all work without the menu.
 *
 * Smart commands (add, commit, push, pull) run repos in the correct dependency
 * order and keep the submodule ref in sync. Everything else is passed through
 * to both repos verbatim.
 *
 * @module ik
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
  spinner,
  text,
} from '@clack/prompts';
import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

/** Absolute path to the directory containing this script. */
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

/** Absolute path to the main (wiki) repository root. */
const MAIN_REPO = resolve(SCRIPT_DIR, '../..');

/** Absolute path to the content submodule root. */
const CONTENT_REPO = resolve(MAIN_REPO, 'src/content');

/**
 * ANSI colour codes used for passthrough repo-label output.
 * @property reset  - Resets all attributes.
 * @property cyan   - Repo-label prefixes.
 */
const C = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
} as const;

/**
 * Shared environment forwarded to every child git process.
 * Sets `IK_RUNNING=1` so hook scripts suppress cross-repo warnings.
 */
const CHILD_ENV = { ...process.env, IK_RUNNING: '1' };

/**
 * ASCII logo displayed when the interactive TUI or help is launched.
 * Rendered in cyan for the main glyph.
 */
const LOGO = `   
  |==========================================================================================================================|
 |============================================================================================================================|
  |==========================================================================================================================|       
   ██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████                                                                                                                  
   ██████████████████████████████████████████████       █████████████████████████████████████████████████████████████████████ 
   █████████████████████████████████████████████   ███    ███████████████████████████████████████████████████████████████████ 
   ███████████████████████████████████████████    ██ ███   ██████████████████████████████████████████████████████████████████ 
   █████████████████████████████████████████     ████  ██  ██████████████████████████████████████████████████████████████████ 
   ████████████████████████           ████     ██████████   ███████      ████████████████████████████████████████████████████ 
   ████████████████████████  ██████          ████████   ██  ████              ███████████████████████████████████████████████ 
   ████████████████████████ █████  ███     ███  ███     ██  ████ █████ █        █████████████████████████████████████████████ 
   ████████████████████████      ██   ██████  ████     ███  ████   █   ███ ███  █████████████████████████████████████████████ 
   ████████████████████████████    ███ █████████        ██  ████  ██   █ █ ██   █████████████████████████████████████████████ 
   ████████████████████████████   ██ ███ █  ██         ███  █████              ██████████████████████████████████████████████ 
   ████████████████████████████  ███  █  █ █ ██        ███  █████████████████████████████████████████████████████████████████ 
   ███████████████████████████   █████████ █ ███            █████████████████████████████████████████████████████████████████ 
   ██████████████████████████   ████  █  █  ██  ██         ███████              ██████████████████████████████████      █████ 
   ████████████████████████    ██  ████████████  ██   ███████████  ██   ██ ██                                      ████ █████ 
   ███████████████████████   ██  ██  ██        ████  ████████████  ██      ███                                    ███   █████ 
   █████████████████████   ██  ██  ██           ████ ████████████ ███   ██ ██████ ███ █████   ████ ██ ██     ███ █████  █████ 
   ██████████████        ███     ████           ███  ███████████  ██    ██ ██ ███ ██  ██ ██   ██   ████     ██ ██  ██   █████ 
   █████████            ██     ███   ████            ███████████ ██████ ██ ████  ███  ██████ ███    ██   █   ███  ██  ███████
   ██████     ██████████     ███        ████       █████████████                                   █   █████    ███  ████████ 
   █████   ████     ██     ███             █████      ████████████████████████████████████████████   ██████████      ████████ 
   █████  ████  ███████████████                ████    ██████████████████████████████████████████████████████████████████████ 
   █████ ███  ██              ███          █████ ████   ██████████        ████████     ██████████████████████████████████████ 
   █████    ██  ███              ███    ██████      ██   ████████  ██ ███          ███                        ███████████████ 
   ██████     ██  ███         ███ ██████      █████████  ████████ ███ ██                                         ████████████ 
   ██████   ██  ██  ███   █████████     █████████        ████████ ███ █████ ██ ███ ██  ████ ██ ███ ██ ███  █████   ██████████
   ████    ██  █████  ████████    █████████          ███████████  ██ █████  ██ ██  ██  ███  ██ ██  ██ ██   ███    ███████████
   ███   ██  ███    ███       █████████        █████████████████ ███ ██ ███ █████  ██ ████  █████  █████ █████    ███████████
   ██   █████         ████████            ██████████████████████                                               ██████████████ 
   ██ ████     █████            █████████████████████████████████████████████████████████████████████████████████████████████ 
   ██        ████████████████████████████████████████████████████████████████████████████████████████████████████████████████ 
   ██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████ 
  |==========================================================================================================================|
 |============================================================================================================================|
  |==========================================================================================================================|
 `;

/** Top-level menu option descriptors shown in the arrow-key selector. */
type MenuOption =
  | 'status'
  | 'add'
  | 'commit'
  | 'push'
  | 'pull'
  | 'fetch'
  | 'log'
  | 'diff'
  | 'stash'
  | 'branch'
  | 'passthrough';

/**
 * Emits a cyan repo-label prefix followed by a message to stdout.
 * @param label - Short repo name (e.g. `main` or `content`).
 * @param msg   - Descriptive message.
 */
function logRepo(label: string, msg: string): void {
  console.log(`${C.cyan}[${label}]${C.reset} ${msg}`);
}

/**
 * Exits with a friendly cancellation message when the user presses Ctrl-C.
 * @param value - Value returned by a clack prompt (may be a cancel symbol).
 */
function guardCancel(
  value: unknown,
): asserts value is NonNullable<typeof value> {
  if (isCancel(value)) {
    cancel('Cancelled.');
    process.exit(0);
  }
}

/**
 * Runs a git command in a repository, inheriting all stdio handles so that
 * interactive output (colours, pager, progress bars) works correctly.
 * @param repo - Absolute path to the repository root.
 * @param args - Git arguments (subcommand + flags).
 * @returns Exit code of the git process (0 = success).
 */
function git(repo: string, args: string[]): number {
  const result = spawnSync('git', ['-C', repo, ...args], {
    stdio: 'inherit',
    env: CHILD_ENV,
  });
  return result.status ?? 1;
}

/**
 * Runs a git command silently and captures stdout as a trimmed string.
 * @param repo - Absolute path to the repository root.
 * @param args - Git arguments (subcommand + flags).
 * @returns Trimmed stdout string, or empty string on failure.
 */
function gitCapture(repo: string, args: string[]): string {
  const result = spawnSync('git', ['-C', repo, ...args], {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: CHILD_ENV,
  });
  return (result.stdout?.toString() ?? '').trim();
}

/**
 * Checks whether a repository has any uncommitted changes (staged or unstaged).
 * @param repo - Absolute path to the repository root.
 * @returns `true` when the working tree or index contains changes.
 */
function isDirty(repo: string): boolean {
  const unstaged = spawnSync('git', ['-C', repo, 'diff', '--quiet'], {
    stdio: 'pipe',
    env: CHILD_ENV,
  });
  const staged = spawnSync('git', ['-C', repo, 'diff', '--cached', '--quiet'], {
    stdio: 'pipe',
    env: CHILD_ENV,
  });
  return unstaged.status !== 0 || staged.status !== 0;
}

/**
 * Returns `true` when the content submodule ref recorded in main is
 * out of sync with what is currently staged or committed in the working tree.
 */
function isSubmoduleRefDirty(): boolean {
  const unstaged = spawnSync(
    'git',
    ['-C', MAIN_REPO, 'diff', '--quiet', '--', 'src/content'],
    { stdio: 'pipe', env: CHILD_ENV },
  );
  const staged = spawnSync(
    'git',
    ['-C', MAIN_REPO, 'diff', '--cached', '--quiet', '--', 'src/content'],
    { stdio: 'pipe', env: CHILD_ENV },
  );
  return unstaged.status !== 0 || staged.status !== 0;
}

/**
 * Aborts with a descriptive error when the content submodule is not initialised.
 */
function checkSubmodule(): void {
  if (!existsSync(`${CONTENT_REPO}/.git`)) {
    log.error(`Content submodule not found at '${CONTENT_REPO}'`);
    log.error(
      'Run: bash scripts/migration/toggle-content-submodule.sh restore',
    );
    process.exit(1);
  }
}

/**
 * Returns a two-part status line for both repos using colour coding.
 */
function repoSummaryLine(): string {
  const mainDirty = isDirty(MAIN_REPO);
  const contentDirty = isDirty(CONTENT_REPO);
  const m = mainDirty ? `${C.yellow}main: dirty${C.reset}` : 'main: clean';
  const c = contentDirty
    ? `${C.yellow}content: dirty${C.reset}`
    : 'content: clean';
  return `${m}   ${c}`;
}

/**
 * Lists all untracked and modified files across both repos.
 * @returns File path strings prefixed with `main:` or `content:`.
 */
function listDirtyFiles(): string[] {
  const mainFiles = gitCapture(MAIN_REPO, ['status', '--short', '--porcelain'])
    .split('\n')
    .filter(Boolean)
    .map((l) => `main: ${l.slice(3)}`);
  const contentFiles = gitCapture(CONTENT_REPO, [
    'status',
    '--short',
    '--porcelain',
  ])
    .split('\n')
    .filter(Boolean)
    .map((l) => `content: ${l.slice(3)}`);
  return [...mainFiles, ...contentFiles];
}

/**
 * Stages files in both repos with a spinner.
 * Content failures are soft-warned; main failures abort for real errors only.
 * @param files - Paths to stage; defaults to `['.']` when empty.
 */
async function cmdAdd(files: string[]): Promise<void> {
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
async function cmdCommit(args: string[]): Promise<void> {
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
async function cmdPush(args: string[]): Promise<void> {
  const s = spinner();

  s.start('Pushing content repo');
  const contentResult = spawnSync(
    'git',
    ['-C', CONTENT_REPO, 'push', ...args],
    { stdio: 'pipe', env: CHILD_ENV },
  );
  if (contentResult.status !== 0) {
    s.stop('Content push skipped (check status)');
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
async function cmdPull(args: string[]): Promise<void> {
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
  spawnSync(
    'git',
    ['-C', MAIN_REPO, 'submodule', 'update', '--init', '--recursive'],
    { stdio: 'pipe', env: CHILD_ENV },
  );
  s.stop('Submodule updated');

  log.success('Both repos pulled');
}

/**
 * Prints short git status for both repos.
 */
function cmdStatus(): void {
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
function cmdValidate(): void {
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
function cmdPassthrough(command: string, args: string[]): void {
  console.log('');
  logRepo('main', `git ${command} ${args.join(' ')}`);
  git(MAIN_REPO, [command, ...args]);

  console.log('');
  logRepo('content', `git ${command} ${args.join(' ')}`);
  git(CONTENT_REPO, [command, ...args]);
  console.log('');
}

/**
 * Prints the full help text.
 */
function printHelp(): void {
  console.log(`${C.cyan}${LOGO}${C.reset}`);
  console.log(`
${C.cyan}ik${C.reset} — Multirepo sync CLI (main + content submodule)

${C.yellow}INTERACTIVE (no args):${C.reset}
  ik                Arrow-key menu for all operations

${C.yellow}SHORTHAND (direct):${C.reset}
  ik add [files]    Stage in both repos              (default: .)
  ik commit -m …    Commit content-first, sync ref
  ik push [args]    Push content-first, amend if stale
  ik pull [args]    Pull + submodule update
  ik fetch [args]   Fetch both repos
  ik status         Short status of both repos
  ik validate       Check for drift between repos
  ik log [args]     Log both repos (default: --oneline -10)
  ik diff [args]    Diff both repos
  ik stash …        Stash both repos
  ik <any> [args]   Passthrough to git in both repos
  ik help           Show this message
`);
}

/**
 * Builds and runs the full interactive TUI when `ik` is called with no arguments.
 * Uses arrow-key selectors, spinners, and confirmation prompts.
 */
async function runInteractive(): Promise<void> {
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

  switch (action) {
    case 'status': {
      console.log('');
      logRepo('main', 'status');
      git(MAIN_REPO, ['status', '--short']);
      console.log('');
      logRepo('content', 'status');
      git(CONTENT_REPO, ['status', '--short']);
      console.log('');
      break;
    }

    case 'add': {
      const dirty = listDirtyFiles();

      if (dirty.length === 0) {
        log.info('Nothing to stage — both repos are clean');
        break;
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
        const raw = await text({
          message: 'Path(s) to stage (space-separated):',
        });
        guardCancel(raw);
        targets = (raw as string).split(/\s+/).filter(Boolean);
      }

      await cmdAdd(targets);
      break;
    }

    case 'commit': {
      const message = await text({
        message: 'Commit message:',
        validate: (v) =>
          (v ?? '').trim().length < 3 ? 'Too short' : undefined,
      });
      guardCancel(message);
      await cmdCommit(['-m', message as string]);
      break;
    }

    case 'push': {
      const ok = await confirm({ message: 'Push both repos to origin?' });
      guardCancel(ok);
      if (!ok) {
        cancel('Aborted');
        break;
      }

      const extraArg = await text({
        message: 'Extra push flags (leave blank for none):',
        placeholder: '--force-with-lease  /  origin main',
      });
      guardCancel(extraArg);
      const extra = (extraArg as string).trim().split(/\s+/).filter(Boolean);
      await cmdPush(extra);
      break;
    }

    case 'pull': {
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
      break;
    }

    case 'fetch': {
      const opts = await select({
        message: 'Fetch options:',
        options: [
          { value: '', label: 'origin (default)' },
          { value: '--all', label: 'All remotes (--all)' },
          {
            value: '--all --prune',
            label: 'All remotes + prune (--all --prune)',
          },
        ],
      });
      guardCancel(opts);
      cmdPassthrough(
        'fetch',
        (opts as string).trim().split(/\s+/).filter(Boolean),
      );
      break;
    }

    case 'log': {
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
      break;
    }

    case 'diff': {
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
      break;
    }

    case 'stash': {
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
      break;
    }

    case 'branch': {
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
        cmdPassthrough('branch', [
          force ? '-D' : '-d',
          (name as string).trim(),
        ]);
      } else {
        const name = await text({
          message: 'Branch to switch to:',
          validate: (v) => ((v ?? '').trim() ? undefined : 'Required'),
        });
        guardCancel(name);
        cmdPassthrough('checkout', [(name as string).trim()]);
      }
      break;
    }

    case 'passthrough': {
      const raw = await text({
        message: 'git command (without "git"):',
        placeholder: 'fetch --all --prune',
        validate: (v) => ((v ?? '').trim() ? undefined : 'Required'),
      });
      guardCancel(raw);
      const parts = (raw as string).trim().split(/\s+/);
      cmdPassthrough(parts[0]!, parts.slice(1));
      break;
    }
  }

  outro('Done');
}

/**
 * CLI entry point. Launches the interactive TUI when called with no arguments;
 * otherwise routes directly to the matching command handler.
 */
async function main(): Promise<void> {
  process.env['IK_RUNNING'] = '1';

  const argv = process.argv.slice(2);
  const command = argv[0];
  const rest = argv.slice(1);

  checkSubmodule();

  if (!command) {
    await runInteractive();
    return;
  }

  switch (command) {
    case 'add':
      await cmdAdd(rest);
      break;

    case 'commit':
      await cmdCommit(rest);
      break;

    case 'push':
      await cmdPush(rest);
      break;

    case 'pull':
      await cmdPull(rest);
      break;

    case 'status':
    case 'st':
      cmdStatus();
      break;

    case 'validate':
      cmdValidate();
      break;

    case 'log':
      cmdPassthrough('log', rest.length > 0 ? rest : ['--oneline', '-10']);
      break;

    case 'diff':
      cmdPassthrough('diff', rest);
      break;

    case 'help':
    case '-h':
    case '--help':
      printHelp();
      break;

    default:
      cmdPassthrough(command, rest);
  }
}

main().catch((err) => {
  log.error(String(err));
  process.exit(1);
});
