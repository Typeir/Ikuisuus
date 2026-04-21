/**
 * @fileoverview Interactive TUI for the ik multirepo CLI.
 *
 * Exports `guardCancel` (Ctrl-C handler) and `runInteractive` (arrow-key menu).
 * Handlers live in `tui-handlers.ts` to keep this file focused on orchestration.
 *
 * @module multirepo/tui
 * @author Typeir
 * @version 2.0.0
 * @since 3.0.0
 */

import { cancel, intro, isCancel, note, outro, select } from '@clack/prompts';

import { C, LOGO, type MenuOption } from './constants';
import { repoSummaryLine } from './git';
import { TUI_HANDLERS } from './tui-handlers';

/**
 * Exits with a friendly cancellation message when the user presses Ctrl-C.
 * @param {unknown} value - Value returned by a clack prompt (may be a cancel symbol).
 * @returns {void}
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
 * Menu definition for the top-level selector.
 *
 * @interface MenuEntry
 * @property {MenuOption} value - Dispatch key for `TUI_HANDLERS`.
 * @property {string} label - Human-readable label with emoji.
 */
interface MenuEntry {
  value: MenuOption;
  label: string;
}

/** Ordered list of menu entries shown to the user. */
const MENU_ENTRIES: MenuEntry[] = [
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
  { value: 'passthrough', label: '⚙️   passthrough  — run any git command' },
  { value: 'quit', label: '🚪  quit         — exit ik' },
];

/**
 * Builds and runs the full interactive TUI when `ik` is called with no arguments.
 * Uses arrow-key selectors, spinners, and confirmation prompts.
 * @returns {Promise<void>} Resolves when the user chooses `quit`.
 */
export async function runInteractive(): Promise<void> {
  process.stdout.write(`${C.cyan}${LOGO}${C.reset}\n`);
  intro(`${C.cyan}ik${C.reset}  — multirepo workspace CLI`);

  while (true) {
    note(repoSummaryLine(), 'repo state');

    const action = await select<MenuOption>({
      message: 'What do you want to do?',
      options: MENU_ENTRIES,
    });
    guardCancel(action);

    if (action === 'quit') {
      break;
    }

    await TUI_HANDLERS[action as Exclude<MenuOption, 'quit'>]();
  }

  outro('Bye');
}
