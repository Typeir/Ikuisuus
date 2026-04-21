/**
 * @fileoverview `ik help` — Print CLI help text.
 * @module multirepo/commands/help
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import { log } from '@clack/prompts';

import type { CommandMeta } from '../../utils/cli-loader';
import { C, LOGO } from '../constants';

/** Command metadata for the fs-based loader. */
export const meta: CommandMeta = {
  name: 'help',
  aliases: ['-h', '--help'],
  description: 'Show this help message',
};

/**
 * Prints the full help text to stdout.
 * @param {string[]} _args - Unused; present for the CliCommand contract.
 * @returns {void}
 */
export function run(_args: string[]): void {
  log.message(`${C.cyan}${LOGO}${C.reset}`);
  log.message(`
${C.cyan}ik${C.reset} — Multirepo sync CLI (main + content submodule)

${C.yellow}INTERACTIVE (no args):${C.reset}
  ik                 Arrow-key menu for all operations

${C.yellow}SHORTHAND (direct):${C.reset}
  ik setup           One-time install: PATH shim, git hooks, paw sync
  ik add [files]     Stage in both repos                (default: .)
  ik commit -m …     Commit content-first, sync ref
  ik push [args]     Push content-first, amend if stale
                     (pass --force-main to override content failures)
  ik pull [args]     Pull + submodule update (stays on main)
  ik fetch [args]    Fetch both repos
  ik status          Short status of both repos
  ik validate        Check for drift between repos
  ik clean-branches  Delete all branches except main (local + origin)
  ik util <sub>      Utility scripts (tree-size, precompile-mdx, …)
  ik auth <sub>      Auth helpers (generate-token, seed-admin, …)
  ik clean <sub>     Clean workspace (translations, metadata, fullsize)
  ik linkify [flags] Auto-link world content
  ik scaffold [dry]  Scaffold placeholder content from links
  ik migrate <sub>   Content-repo migration helpers
  ik features gen    Generate feature metadata
  ik log [args]      Log both repos (default: --oneline -10)
  ik diff [args]     Diff both repos
  ik stash …         Stash both repos
  ik <any> [args]    Passthrough to git in both repos
  ik help            Show this message
`);
}

/**
 * Re-export for the TUI footer, which prints help on demand.
 * @returns {void}
 */
export function printHelp(): void {
  run([]);
}
