/**
 * On-Stop Missing Tests Hook
 *
 * @fileoverview Blocks Copilot session completion when newly added source files
 * under src/ are missing corresponding tests. Uses the same hook protocol as
 * other Copilot hooks and returns a Stop block decision with actionable paths.
 *
 * @module .github/scripts/hooks/on-stop-missing-tests
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
 * Reads hook input payload from stdin.
 *
 * @returns {Promise<Object>} Parsed input object
 */
function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
    setTimeout(() => resolve({}), 3000);
  });
}

/**
 * Returns newly created source files (staged + untracked) that should have tests.
 *
 * @returns {string[]} Relative source file paths
 */
function getNewSourceFiles() {
  const stagedAdded = runGitCommand('git diff --cached --name-status -- src/');
  const untracked = runGitCommand(
    'git ls-files --others --exclude-standard -- src/',
  );

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
    .map((f) => f.replace(/\\/g, '/'))
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .filter((f) => !EXCLUDED_PATTERNS.some((pattern) => pattern.test(f)));
}

/**
 * Executes a git command and returns stdout, or empty string on failure.
 *
 * @param {string} command - Git command
 * @returns {string} Command output
 */
function runGitCommand(command) {
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
 * Checks whether any corresponding test file exists for a source file.
 *
 * @param {string} sourcePath - Relative source file path
 * @returns {boolean} True if a matching test exists
 */
function hasTestFile(sourcePath) {
  const ext = sourcePath.endsWith('.tsx') ? '.tsx' : '.ts';
  const baseName = sourcePath.replace(/\.(ts|tsx)$/, '');
  const unitPath = path.join(ROOT, 'tests', 'unit', `${baseName}.test${ext}`);
  const integrationPath = path.join(
    ROOT,
    'tests',
    'integration',
    `${baseName}.test${ext}`,
  );

  return fileExists(unitPath) || fileExists(integrationPath);
}

/**
 * Returns true if a path exists.
 *
 * @param {string} filePath - Absolute path
 * @returns {boolean} Existence flag
 */
function fileExists(filePath) {
  return existsSync(filePath);
}

/**
 * Builds a human-actionable block reason for the agent.
 *
 * @param {string[]} missingFiles - Source files missing tests
 * @returns {string} Hook block reason
 */
function buildBlockReason(missingFiles) {
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

async function main() {
  const hookInput = await readStdin();

  if (hookInput.stop_hook_active) {
    console.log(JSON.stringify({ continue: true }));
    return;
  }

  const newSourceFiles = getNewSourceFiles();
  if (newSourceFiles.length === 0) {
    console.log(JSON.stringify({ continue: true }));
    return;
  }

  const missing = newSourceFiles.filter(
    (sourcePath) => !hasTestFile(sourcePath),
  );
  if (missing.length === 0) {
    console.log(JSON.stringify({ continue: true }));
    return;
  }

  console.log(
    JSON.stringify({
      continue: true,
      hookSpecificOutput: {
        hookEventName: 'Stop',
        decision: 'block',
        reason: buildBlockReason(missing),
      },
    }),
  );
}

main().catch(() => {
  console.log(JSON.stringify({ continue: true }));
});
