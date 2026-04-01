/**
 * Generate Shields Endpoint Badge JSON
 *
 * @fileoverview Reads vitest-report.json and generates a Shields-compatible
 * endpoint JSON file (vitest-tests.json) for dynamic test count badges.
 *
 * @module .github/scripts/generateBadgeJson
 */

import fs from 'node:fs';
import path from 'node:path';

const REPORT_FILE = path.join(process.cwd(), 'vitest-report.json');
const BADGE_FILE = path.join(process.cwd(), 'vitest-tests.json');

/**
 * Raw assertion result shape from Vitest JSON report.
 */
interface AssertionResult {
  status: 'passed' | 'failed' | 'skipped';
}

/**
 * Raw file result shape from Vitest JSON report.
 */
interface TestFileResult {
  assertionResults?: AssertionResult[];
}

/**
 * Shields-compatible endpoint badge JSON.
 */
interface BadgeJson {
  schemaVersion: number;
  label: string;
  message: string;
  color: string;
}

/**
 * Extract pass and fail counts from a Vitest JSON report.
 *
 * @param report Parsed vitest-report.json content
 * @returns Object containing passed and failed counts
 */
function extractCounts(report: { testResults?: TestFileResult[] }): {
  passed: number;
  failed: number;
} {
  let passed = 0;
  let failed = 0;

  for (const file of report.testResults ?? []) {
    for (const test of file.assertionResults ?? []) {
      if (test.status === 'passed') passed++;
      else if (test.status === 'failed') failed++;
    }
  }

  return { passed, failed };
}

/**
 * Build a Shields endpoint badge JSON from test counts.
 *
 * @param passed Number of passing tests
 * @param failed Number of failing tests
 * @returns Shields-compatible badge descriptor
 */
function buildBadge(passed: number, failed: number): BadgeJson {
  const total = passed + failed;

  if (failed > 0) {
    return { schemaVersion: 1, label: 'tests', message: `${failed} failing`, color: 'red' };
  }
  if (total === 0) {
    return { schemaVersion: 1, label: 'tests', message: 'passing', color: 'brightgreen' };
  }
  return { schemaVersion: 1, label: 'tests', message: `${passed}/${total} passing`, color: 'brightgreen' };
}

async function main(): Promise<void> {
  if (!fs.existsSync(REPORT_FILE)) {
    console.error(`\u274c vitest-report.json not found at ${REPORT_FILE}`);
    process.exit(1);
    return;
  }

  const report = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf-8')) as { testResults?: TestFileResult[] };
  const { passed, failed } = extractCounts(report);
  const badge = buildBadge(passed, failed);

  fs.writeFileSync(BADGE_FILE, JSON.stringify(badge, null, 2), 'utf-8');
  console.log(`\u2705 Badge JSON written to ${BADGE_FILE}`);
  console.log(`   Tests: ${passed} passed, ${failed} failed (${passed + failed} total)`);
  console.log(`   Badge: "${badge.message}"`);
}

main().catch((err: Error) => {
  console.error('\u274c Fatal:', err.message);
  process.exit(1);
});
