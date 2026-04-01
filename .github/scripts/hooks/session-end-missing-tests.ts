/**
 * Session End Missing Tests Hook
 *
 * @fileoverview Blocks completion when newly added source files under src/
 * do not have corresponding test files.
 *
 * @module .github/scripts/hooks/session-end-missing-tests
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isNestedHookRun, readHookInput, writeHookOutput } from './hook-runtime';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../../..');

const EXCLUDED_PATTERNS = [
  /\.d\.ts$/,
  /\.config\.(ts|js)$/,
  /\/index\.(ts|tsx)$/,
  /\.module\.(scss|css)$/,
  /\.stories\.(ts|tsx)$/,
  /\.test\.(ts|tsx)$/,
];

/**
 * Execute a git command in repo root.
 *
 * @param command Command text
 * @returns stdout or empty string
 */
function runGitCommand(command: string): string {
  try {
    return execSync(command, {
      cwd: ROOT,
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return '';
  }
}

/**
 * List newly added source files requiring tests.
 *
 * @returns Relative source file paths
 */
function getNewSourceFiles(): string[] {
  const stagedAdded = runGitCommand('git diff --cached --name-status -- src/');
  const untracked = runGitCommand('git ls-files --others --exclude-standard -- src/');

  const stagedFiles = stagedAdded
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/\s+/))
    .filter((parts) => parts[0] === 'A' && Boolean(parts[1]))
    .map((parts) => parts[1]);

  const untrackedFiles = untracked
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const combined = new Set([...stagedFiles, ...untrackedFiles]);
  return [...combined]
    .map((filePath) => filePath.replace(/\\/g, '/'))
    .filter((filePath) => /\.(ts|tsx)$/.test(filePath))
    .filter((filePath) => !EXCLUDED_PATTERNS.some((pattern) => pattern.test(filePath)));
}

/**
 * Check for an associated unit or integration test file.
 *
 * @param sourcePath Relative source file path
 * @returns True if test file exists
 */
function hasTestFile(sourcePath: string): boolean {
  const ext = sourcePath.endsWith('.tsx') ? '.tsx' : '.ts';
  const baseName = sourcePath.replace(/\.(ts|tsx)$/, '');
  const unitPath = path.join(ROOT, 'tests', 'unit', `${baseName}.test${ext}`);
  const integrationPath = path.join(ROOT, 'tests', 'integration', `${baseName}.test${ext}`);
  return existsSync(unitPath) || existsSync(integrationPath);
}

/**
 * Build user-facing blocking reason for missing tests.
 *
 * @param missingFiles Source files missing tests
 * @returns Multi-line block reason text
 */
function buildBlockReason(missingFiles: string[]): string {
  const details = missingFiles
    .map((sourcePath) => {
      const ext = sourcePath.endsWith('.tsx') ? '.tsx' : '.ts';
      const baseName = sourcePath.replace(/\.(ts|tsx)$/, '');
      return [
        `📄 ${sourcePath}`,
        `   → tests/unit/${baseName}.test${ext}`,
        `   → tests/integration/${baseName}.test${ext}`,
      ].join('\n');
    })
    .join('\n\n');

  return [
    `🚫 Missing tests for ${missingFiles.length} newly added source file(s):`,
    '',
    details,
    '',
    'Create at least one matching test file for each entry before stopping.',
  ].join('\n');
}

/**
 * Main hook entrypoint.
 */
async function main(): Promise<void> {
  const hookInput = await readHookInput();
  if (isNestedHookRun(hookInput)) {
    writeHookOutput({ continue: true });
    return;
  }

  const newSourceFiles = getNewSourceFiles();
  if (newSourceFiles.length === 0) {
    writeHookOutput({ continue: true });
    return;
  }

  const missing = newSourceFiles.filter((sourcePath) => !hasTestFile(sourcePath));
  if (missing.length === 0) {
    writeHookOutput({ continue: true });
    return;
  }

  writeHookOutput({
    continue: true,
    hookSpecificOutput: {
      hookEventName: 'sessionEnd',
      decision: 'block',
      reason: buildBlockReason(missing),
    },
  });
}

main().catch(() => {
  writeHookOutput({ continue: true });
});
