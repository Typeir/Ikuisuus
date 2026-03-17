#!/usr/bin/env npx tsx --tsconfig tsconfig.scripts.json

/**
 * Commit Message Format Validator
 *
 * @fileoverview Validates commit message format
 * Requires format: [action]: imperative text
 * Examples:
 *   [fix]: resolve authentication issue
 *   [feat]: add new export modal
 *   [TICKET-123]: implement feature request
 *   [dirty]: quick test commit
 *
 * @module scripts/hooks/commit-msg
 * @version 1.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import { readFileSync } from 'fs';

const log = createLogger({ script: 'commit-msg' });

/**
 * Validates commit message format
 *
 * @param message - The commit message to validate
 * @returns True if message matches format, false otherwise
 */
function isValidCommitMessage(message: string): boolean {
  const cleanMessage = message.trim();
  const pattern = /^\[[\w\-]+\]:\s+.+$/;
  return pattern.test(cleanMessage);
}

/**
 * Gets the commit message from the commit message file
 *
 * @returns The commit message
 */
function getCommitMessage(): string {
  try {
    const commitMsgFile = process.argv[2];
    if (!commitMsgFile) {
      log.error('❌ No commit message file provided');
      process.exit(1);
    }

    const message = readFileSync(commitMsgFile, 'utf-8');

    const lines = message
      .split('\n')
      .filter((line) => !line.startsWith('#'))
      .join('\n');

    return lines;
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    log.error('❌ Error reading commit message', { error: errorMessage });
    process.exit(1);
  }
}

/**
 * Main validation logic
 */
function validateCommitMessage(): void {
  const message = getCommitMessage();

  if (!isValidCommitMessage(message)) {
    log.error(
      [
        '\n❌ INVALID COMMIT MESSAGE FORMAT\n',
        'Expected format: [action]: imperative text',
        '\nExamples:',
        '  [fix]: resolve authentication issue',
        '  [feat]: add new export modal',
        '  [TICKET-123]: implement feature request',
        '  [dirty]: quick test commit\n',
        'Your message: ' + message.split('\n')[0] + '\n',
      ].join('\n'),
    );
    process.exit(1);
  }

  process.exit(0);
}

validateCommitMessage();
