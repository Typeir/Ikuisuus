/**
 * User Prompt Submitted Hook
 *
 * @fileoverview Logs deterministic hook activity when a user prompt is submitted.
 *
 * @module .github/scripts/hooks/user-prompt-submitted
 */

import { appendFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { readHookInput, writeHookOutput } from './hook-runtime';

/**
 * Append a prompt hook line into the hooks log file.
 *
 * @param event Hook payload object
 */
function appendPromptLog(event: Record<string, unknown>): void {
  const rootDir = process.cwd();
  const logDir = path.join(rootDir, '.github', 'hooks');
  const logFile = path.join(logDir, 'hooks.log');
  const sessionId = typeof event.sessionId === 'string' ? event.sessionId : 'unknown-session';
  const timestamp = new Date().toISOString();
  mkdirSync(logDir, { recursive: true });
  appendFileSync(logFile, `${timestamp} userPromptSubmitted ${sessionId}\n`, 'utf-8');
}

/**
 * Main hook entrypoint.
 */
async function main(): Promise<void> {
  const hookInput = await readHookInput();
  appendPromptLog(hookInput);
  writeHookOutput({ continue: true });
}

main().catch(() => {
  writeHookOutput({ continue: true });
});
