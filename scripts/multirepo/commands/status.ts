/**
 * @fileoverview `ik status` — Short git status of both repos.
 * @module scripts/multirepo/commands/status
 */

import type { CommandMeta } from '../../utils/cli-loader';
import { CONTENT_REPO, MAIN_REPO } from '../constants';
import { git, logRepo } from '../git';

/** Command metadata for the fs-based loader. */
export const meta: CommandMeta = {
  name: 'status',
  aliases: ['st'],
  description: 'Short status of both repos',
};

/**
 * Prints short git status for both repos.
 * @param _args - Unused; present for the CliCommand contract.
 */
export function run(_args: string[]): void {
  console.log('');
  logRepo('main', 'status');
  git(MAIN_REPO, ['status', '--short']);
  console.log('');
  logRepo('content', 'status');
  git(CONTENT_REPO, ['status', '--short']);
  console.log('');
}
