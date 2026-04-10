/**
 * @fileoverview `ik help` — Print CLI help text.
 * @module multirepo/commands/help
 */

import type { CommandMeta } from '../../utils/cli-loader';
import { printHelp } from '../tui';

/** Command metadata for the fs-based loader. */
export const meta: CommandMeta = {
  name: 'help',
  aliases: ['-h', '--help'],
  description: 'Show this help message',
};

/**
 * Prints the full help text to stdout.
 * @param _args - Unused; present for the CliCommand contract.
 */
export function run(_args: string[]): void {
  printHelp();
}
