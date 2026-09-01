/**
 * @fileoverview `ik validate` — Check for drift between repos.
 * @module scripts/multirepo/commands/validate
 */

import { log } from '@clack/prompts';

import type { CommandMeta } from '../../utils/cli-loader';
import { CONTENT_REPO, MAIN_REPO } from '../constants';
import { gitCapture, isDirty } from '../git';

/** Command metadata for the fs-based loader. */
export const meta: CommandMeta = {
  name: 'validate',
  description: 'Check for drift between repos',
};

/**
 * Warns when both repos are dirty at diverged HEADs.
 * @param _args - Unused; present for the CliCommand contract.
 */
export function run(_args: string[]): void {
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
