/**
 * @fileoverview `ik diff` — Show changes in both repos.
 * @module scripts/multirepo/commands/diff
 */

import type { CommandMeta } from '../../utils/cli-loader';
import { cmdPassthrough } from '../git';

/** Command metadata for the fs-based loader. */
export const meta: CommandMeta = {
  name: 'diff',
  description: 'Diff both repos',
};

/**
 * Runs `git diff` in both repos.
 * @param args - Arguments forwarded verbatim to `git diff`.
 */
export function run(args: string[]): void {
  cmdPassthrough('diff', args);
}
