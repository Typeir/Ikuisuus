#!/usr/bin/env node

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

const fs = require('fs');
const path = require('path');

/**
 * Validates commit message format
 * @param {string} message - The commit message to validate
 * @returns {boolean} True if message matches format, false otherwise
 */
function isValidCommitMessage(message) {
  // Trim the message and remove any trailing newlines
  const cleanMessage = message.trim();

  // Match format: [action]: some text
  // Action can contain letters, numbers, hyphens, underscores
  // Text can be anything (imperative, random, etc.)
  const pattern = /^\[[\w\-]+\]:\s+.+$/;

  return pattern.test(cleanMessage);
}

/**
 * Gets the commit message from the commit message file
 * @returns {string} The commit message
 */
function getCommitMessage() {
  try {
    const commitMsgFile = process.argv[2];
    if (!commitMsgFile) {
      console.error('❌ No commit message file provided');
      process.exit(1);
    }

    const message = fs.readFileSync(commitMsgFile, 'utf-8');

    // Filter out comments (lines starting with #)
    const lines = message
      .split('\n')
      .filter((line) => !line.startsWith('#'))
      .join('\n');

    return lines;
  } catch (error) {
    console.error('❌ Error reading commit message:', error.message);
    process.exit(1);
  }
}

/**
 * Main validation logic
 */
function validateCommitMessage() {
  const message = getCommitMessage();

  if (!isValidCommitMessage(message)) {
    console.error('\n❌ INVALID COMMIT MESSAGE FORMAT\n');
    console.error('Expected format: [action]: imperative text');
    console.error('\nExamples:');
    console.error('  [fix]: resolve authentication issue');
    console.error('  [feat]: add new export modal');
    console.error('  [TICKET-123]: implement feature request');
    console.error('  [dirty]: quick test commit\n');
    console.error('Your message: ' + message.split('\n')[0] + '\n');
    process.exit(1);
  }

  process.exit(0);
}

validateCommitMessage();
