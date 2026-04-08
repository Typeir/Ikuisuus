/**
 * Test Gaps Check
 *
 * @fileoverview Verifies that changed source files (compared to git HEAD) have
 * corresponding test files. Falls back to full src/ scan if git is unavailable.
 *
 * @module .github/scripts/check-test-gaps
 */

import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CheckResult } from './health-check-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

const EXCLUDED_PATTERNS = [
  /\.d\.ts$/,
  /\.config\.(ts|js)$/,
  /\/index\.(ts|tsx)$/,
  /\.module\.(scss|css)$/,
  /\.stories\.(ts|tsx)$/,
  /\.test\.(ts|tsx)$/,
];

/**
 * Run a git command and return stdout, or empty string on failure.
 *
 * @param command Git command to run
 * @returns Trimmed stdout
 */
function safeGitOutput(command: string): string {
  try {
    return execSync(command, { cwd: ROOT, encoding: 'utf-8' }).trim();
  } catch {
    return '';
  }
}

/**
 * Retrieve changed TypeScript source files from git.
 *
 * @returns Relative paths of changed files under src/
 */
function getChangedFiles(): string[] {
  const unstaged = safeGitOutput('git diff --name-only HEAD -- src/');
  const staged = safeGitOutput('git diff --cached --name-only -- src/');
  const untracked = safeGitOutput(
    'git ls-files --others --exclude-standard -- src/',
  );

  const combined = new Set([
    ...unstaged.split('\n').filter(Boolean),
    ...staged.split('\n').filter(Boolean),
    ...untracked.split('\n').filter(Boolean),
  ]);
  return [...combined].filter((f) => /\.(ts|tsx)$/.test(f));
}

/**
 * Recursively find all TypeScript source files under a directory.
 *
 * @param dir Directory to scan
 * @param results Accumulator
 * @returns Relative file paths
 */
async function findAllSourceFiles(
  dir: string,
  results: string[] = [],
): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await findAllSourceFiles(full, results);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      results.push(path.relative(ROOT, full));
    }
  }
  return results;
}

/**
 * Check whether a corresponding test file exists for a source file.
 *
 * @param sourcePath Relative source file path
 * @returns True when at least one matching test file exists
 */
async function hasTestFile(sourcePath: string): Promise<boolean> {
  const ext = path.extname(sourcePath);
  const baseName = sourcePath.replace(/\.(ts|tsx)$/, '');
  const candidates = [
    path.join(ROOT, 'tests', 'unit', `${baseName}.test${ext}`),
    path.join(ROOT, 'tests', 'integration', `${baseName}.test${ext}`),
  ];
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return true;
    } catch {
      continue;
    }
  }
  return false;
}

/**
 * Execute the test-gaps check and return a structured result.
 *
 * @returns Check result with any violations
 */
export async function runCheck(): Promise<CheckResult> {
  let filesToCheck = getChangedFiles();
  if (filesToCheck.length === 0) {
    filesToCheck = await findAllSourceFiles(path.join(ROOT, 'src'));
  }

  filesToCheck = filesToCheck.filter(
    (f) => !EXCLUDED_PATTERNS.some((pattern) => pattern.test(f)),
  );

  const failures = [];
  for (const file of filesToCheck) {
    const absPath = path.join(ROOT, file);
    try {
      await fs.access(absPath);
    } catch {
      continue;
    }
    const hasTest = await hasTestFile(file);
    if (!hasTest) {
      const normalizedPath = file.replace(/\\/g, '/');
      const ext = path.extname(normalizedPath);
      const base = normalizedPath.replace(/\.(ts|tsx)$/, '');
      failures.push({
        file: normalizedPath,
        rule: 'missing-test',
        message: `No test file found for ${normalizedPath}`,
        suggestion: `Create tests/unit/${base}.test${ext}`,
      });
    }
  }

  return {
    check: 'test-gaps',
    severity: failures.length > 0 ? 'critical' : 'info',
    passed: failures.length === 0,
    failures,
    stats: {
      total_files_checked: filesToCheck.length,
      violations_found: failures.length,
    },
  };
}

/**
 * Standalone entry point.
 */
async function main(): Promise<void> {
  const result = await runCheck();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}

if (
  path.normalize(process.argv[1] ?? '') ===
  path.normalize(fileURLToPath(import.meta.url))
) {
  main().catch((err: Error) => {
    console.error('\u274c Fatal:', err.message);
    process.exit(1);
  });
}
