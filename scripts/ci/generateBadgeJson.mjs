/**
 * Generate Shields endpoint JSON for test count badge
 * 
 * @fileoverview Reads vitest-report.json and generates a Shields-compatible
 * endpoint JSON file (vitest-tests.json) for dynamic test count badges.
 * 
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires fs
 * @requires path
 * 
 * @description
 * Parses Vitest JSON report to extract test counts and generates a badge JSON
 * that follows the Shields endpoint schema. Badge color and message depend on
 * test pass/fail status.
 * 
 * Output format:
 * ```json
 * {
 *   "schemaVersion": 1,
 *   "label": "tests",
 *   "message": "X passing" or "N failing",
 *   "color": "brightgreen" or "red"
 * }
 * ```
 * 
 * @example
 * node scripts/ci/generateBadgeJson.mjs
 * // Reads: vitest-report.json
 * // Writes: vitest-tests.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORT_FILE = path.join(process.cwd(), 'vitest-report.json');
const BADGE_FILE = path.join(process.cwd(), 'vitest-tests.json');

/**
 * Extract test counts from Vitest JSON report
 * 
 * @param {object} report - Parsed vitest-report.json content
 * @returns {object} Object with passed, failed, total counts
 * 
 * @example
 * extractCounts(report)
 * // Returns: { passed: 1000, failed: 5, total: 1005 }
 */
function extractCounts(report) {
  let passed = 0;
  let failed = 0;

  if (report.testResults && Array.isArray(report.testResults)) {
    report.testResults.forEach((file) => {
      if (file.assertionResults && Array.isArray(file.assertionResults)) {
        file.assertionResults.forEach((test) => {
          if (test.status === 'passed') {
            passed++;
          } else if (test.status === 'failed') {
            failed++;
          }
        });
      }
    });
  }

  const total = passed + failed;

  return { passed, failed, total };
}

/**
 * Generate Shields endpoint JSON badge
 * 
 * @param {number} passed - Number of passing tests
 * @param {number} failed - Number of failing tests
 * @returns {object} Shields-compatible endpoint JSON
 */
function generateBadgeJson(passed, failed) {
  const total = passed + failed;

  if (failed > 0) {
    return {
      schemaVersion: 1,
      label: 'tests',
      message: `${failed} failing`,
      color: 'red'
    };
  }

  if (total === 0) {
    return {
      schemaVersion: 1,
      label: 'tests',
      message: 'passing',
      color: 'brightgreen'
    };
  }

  return {
    schemaVersion: 1,
    label: 'tests',
    message: `${passed}/${total} passing`,
    color: 'brightgreen'
  };
}

/**
 * Main function - read report, generate badge, write JSON
 */
async function main() {
  try {
    if (!fs.existsSync(REPORT_FILE)) {
      console.error(`❌ vitest-report.json not found at ${REPORT_FILE}`);
      process.exit(1);
    }

    const reportContent = fs.readFileSync(REPORT_FILE, 'utf-8');
    const report = JSON.parse(reportContent);

    const { passed, failed, total } = extractCounts(report);
    const badge = generateBadgeJson(passed, failed);

    fs.writeFileSync(BADGE_FILE, JSON.stringify(badge, null, 2), 'utf-8');

    console.log(`✅ Generated badge JSON at ${BADGE_FILE}`);
    console.log(`   Tests: ${passed} passed, ${failed} failed, ${total} total`);
    console.log(`   Badge message: "${badge.message}"`);
  } catch (error) {
    console.error('❌ Error generating badge JSON:', error.message);
    process.exit(1);
  }
}

main();
