/**
 * @fileoverview `ik log` — Show recent commits in both repos.
 * @module multirepo/commands/log
 */

import type { CommandMeta } from '../../utils/cli-loader';
import { cmdPassthrough } from '../git';

/** Command metadata for the fs-based loader. */
export const meta: CommandMeta = {
  name: 'log',
  description: 'Recent commits in both repos (default: --oneline -10)',
};

/**
 * Runs `git log` in both repos. Defaults to `--oneline -10` when no args given.
 * @param args - Arguments forwarded verbatim to `git log`.
 */
export function run(args: string[]): void {
  cmdPassthrough('log', args.length > 0 ? args : ['--oneline', '-10']);
}
