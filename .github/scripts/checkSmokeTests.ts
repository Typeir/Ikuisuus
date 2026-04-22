/**
 * Smoke Test Detection Check
 *
 * @fileoverview Scans test files for placeholder/dummy tests that need real
 * implementations. Reports as non-blocking warnings so existing smoke tests
 * do not block completion.
 *
 * @module .github/scripts/check-smoke-tests
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CheckFailure, CheckResult } from './health-check-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');
const TEST_ROOT = path.join(ROOT, 'tests');

/**
 * Patterns that indicate a test file is a smoke/placeholder test.
 *
 * @property pattern - Regex to match against file content
 * @property rule - Rule identifier for the violation
 * @property message - Human-readable violation description
 */
const SMOKE_PATTERNS: {
  pattern: RegExp;
  rule: string;
  message: string;
}[] = [
  {
    pattern: /\[DUMMY TEST\]/,
    rule: 'smoke-test-dummy',
    message:
      'Contains [DUMMY TEST] placeholder — needs real test implementation',
  },
  {
    pattern: /@smoke-test/,
    rule: 'smoke-test-tag',
    message: 'Tagged with @smoke-test — needs real test implementation',
  },
  {
    pattern: /TODO: Add comprehensive tests/,
    rule: 'smoke-test-todo',
    message: 'Contains TODO marker for comprehensive tests',
  },
  {
    pattern: /Dummy test always passes/,
    rule: 'smoke-test-dummy-pass',
    message: 'Contains "Dummy test always passes" — needs real assertions',
  },
];

/**
 * Recursively collect all test files under a directory.
 *
 * @param dir - Directory to scan
 * @returns Array of absolute paths to test files
 */
async function collectTestFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  let entries: import('node:fs').Dirent[];

  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      results.push(...(await collectTestFiles(fullPath)));
    } else if (entry.isFile() && /\.test\.(ts|tsx)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Scan a single test file for smoke test patterns.
 *
 * @param filePath - Absolute path to the test file
 * @returns Array of failures found in this file
 */
async function scanFile(filePath: string): Promise<CheckFailure[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  const relativePath = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const failures: CheckFailure[] = [];
  const lines = content.split('\n');

  for (const { pattern, rule, message } of SMOKE_PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        failures.push({
          file: relativePath,
          line: i + 1,
          rule,
          message,
          suggestion:
            'Replace placeholder test with real assertions covering the module API',
          severity: 'warning',
        });
        break;
      }
    }
  }

  return failures;
}

/**
 * Run the smoke test detection check.
 *
 * @returns Check result with warning-level severity
 */
export async function runCheck(): Promise<CheckResult> {
  const testFiles = await collectTestFiles(TEST_ROOT);
  const allFailures: CheckFailure[] = [];

  const results = await Promise.allSettled(
    testFiles.map((file) => scanFile(file)),
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allFailures.push(...result.value);
    }
  }

  return {
    check: 'smoke-tests',
    severity: 'warning',
    passed: allFailures.length === 0,
    failures: allFailures,
    stats: {
      total_files_checked: testFiles.length,
      violations_found: allFailures.length,
    },
  };
}
