/**
 * PAW Pre Tool Use Hook
 *
 * @fileoverview Enforces the violation feedback loop by denying tool execution
 * when an outstanding violation ledger exists at VIOLATIONS_PATH. Allows
 * re-edits of the violated file and read-only tools so the agent can diagnose
 * and fix the issue.
 *
 * Enforcement loop (manifest Part 1):
 *   1. postToolUse writes VIOLATIONS_PATH when violations are found
 *   2. preToolUse reads VIOLATIONS_PATH → denies non-exempt tools
 *   3. Agent fixes file → postToolUse deletes VIOLATIONS_PATH
 *   4. preToolUse sees no ledger → allows tools again
 *
 * VS Code contract: PreToolUse uses permissionDecision: 'deny' to block tools.
 * Exit code 2 = blocking error per chatHooks spec.
 *
 * @module .paw/hooks/pre-tool-use
 * @author PAW
 * @version 3.0.0
 * @since 3.0.0
 */

import { existsSync, readFileSync } from 'node:fs';
import {
    readHookInput,
    writeDenyOutput,
    writeHookOutput,
} from '../../.github/PAW/hook-runtime';
import { VIOLATIONS_PATH } from '../../.github/PAW/paw-paths';

/**
 * Tools that are always allowed, even during violation enforcement.
 * Read-only tools must not be blocked — the agent needs them to diagnose issues.
 */
const EXEMPT_TOOLS = new Set([
  'read_file',
  'view_image',
  'grep_search',
  'file_search',
  'semantic_search',
  'list_dir',
  'get_errors',
  'get_terminal_output',
  'memory',
  'manage_todo_list',
  'vscode_askQuestions',
  'tool_search_tool_regex',
  'fetch_webpage',
  'task_complete',
]);

/**
 * Violation ledger shape written by postToolUse to VIOLATIONS_PATH.
 *
 * @interface ViolationLedger
 * @property {string} file - File path that triggered violations
 * @property {Array<string>} violations - Violation descriptions
 * @property {string} hookEvent - Hook event that detected the violations
 * @property {string} timestamp - ISO timestamp of when violations were detected
 */
interface ViolationLedger {
  file: string;
  violations: string[];
  hookEvent: string;
  timestamp: string;
}

/**
 * Read the single violation ledger from VIOLATIONS_PATH.
 * Returns the ledger if present and non-empty, or null if no violations exist.
 *
 * @returns Parsed ledger or null
 */
function readViolationLedger(): ViolationLedger | null {
  if (!existsSync(VIOLATIONS_PATH)) return null;

  try {
    const raw = readFileSync(VIOLATIONS_PATH, 'utf-8');
    const ledger = JSON.parse(raw) as ViolationLedger;
    if (ledger.violations?.length) return ledger;
    return null;
  } catch {
    return null;
  }
}

/**
 * Check whether the tool is operating on the violated file (allowing fixes).
 *
 * @param hookInput - Hook payload
 * @param violatedFile - File path from violation ledger
 * @returns True if the tool targets the violated file
 */
function isFixingViolatedFile(
  hookInput: Record<string, unknown>,
  violatedFile: string,
): boolean {
  const toolArgs = hookInput.tool_input ?? hookInput.toolArgs;
  let argsStr = '';

  if (typeof toolArgs === 'string') {
    argsStr = toolArgs;
  } else if (typeof toolArgs === 'object' && toolArgs !== null) {
    argsStr = JSON.stringify(toolArgs);
  }

  const normalizedViolated = violatedFile.replace(/\\/g, '/').toLowerCase();
  const normalizedArgs = argsStr.replace(/\\/g, '/').toLowerCase();

  return (
    normalizedArgs.includes(normalizedViolated) ||
    normalizedArgs.includes(normalizedViolated.split('/').pop() ?? '')
  );
}

/**
 * Main hook entrypoint.
 */
async function main(): Promise<void> {
  const hookInput = await readHookInput();
  const toolName =
    typeof hookInput.tool_name === 'string'
      ? hookInput.tool_name
      : typeof hookInput.toolName === 'string'
        ? hookInput.toolName
        : '';

  if (EXEMPT_TOOLS.has(toolName)) {
    writeHookOutput({ continue: true });
    return;
  }

  const ledger = readViolationLedger();
  if (!ledger || ledger.violations.length === 0) {
    writeHookOutput({ continue: true });
    return;
  }

  if (isFixingViolatedFile(hookInput, ledger.file)) {
    writeHookOutput({ continue: true });
    return;
  }

  const reason = [
    `🚫 Outstanding violations must be fixed before using other tools.`,
    '',
    `File: ${ledger.file}`,
    ...ledger.violations.map((v) => `  - ${v}`),
    '',
    'Fix the violated file first, then this tool will be allowed.',
  ].join('\n');

  writeDenyOutput(reason);
}

main().catch(() => {
  writeHookOutput({ continue: true });
});
