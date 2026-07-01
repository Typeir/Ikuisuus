#!/usr/bin/env node

/**
 * @fileoverview TDD test for the tier bonus rename script.
 * Loads each fixture file, applies rename rules, and asserts output
 * matches the corresponding .expected file byte-for-byte.
 *
 * Usage: node tests/scripts/rename-tier-bonus.test.mjs
 *
 * @module tests/scripts/rename-tier-bonus.test
 * @version 1.0.0
 */

import { readFile, readdir } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyRules } from '../../scripts/wip/rename-tier-bonus.mjs';

// ─── Configuration ───────────────────────────────────────────────────────────

const FIXTURES_DIR = resolve(
  fileURLToPath(import.meta.url),
  '..',
  'rename-tier-bonus.fixtures',
);

const EXPECTED_EXT = '.expected';

// ─── Test Runner ─────────────────────────────────────────────────────────────

/**
 * Discover all fixture files (files without .expected extension).
 */
async function discoverFixtures() {
  const entries = await readdir(FIXTURES_DIR);
  return entries
    .filter((f) => !f.endsWith(EXPECTED_EXT))
    .map((f) => join(FIXTURES_DIR, f));
}

/**
 * Get the corresponding .expected file path for a fixture.
 */
function expectedPath(fixturePath) {
  return fixturePath + EXPECTED_EXT;
}

/**
 * Run all fixture tests. Exits with code 1 on any failure.
 */
async function runTests() {
  const fixtures = await discoverFixtures();

  if (fixtures.length === 0) {
    console.error('ERROR: No fixture files found in', FIXTURES_DIR);
    process.exit(1);
  }

  console.log(`Found ${fixtures.length} fixture(s)\n`);

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const fixturePath of fixtures) {
    const name = basename(fixturePath);
    const expectedFile = expectedPath(fixturePath);

    try {
      const input = await readFile(fixturePath, 'utf-8');
      const result = applyRules(input, name);

      let expected;
      try {
        expected = await readFile(expectedFile, 'utf-8');
      } catch {
        // No .expected file yet — write the actual output so we can review it
        await import('node:fs/promises').then((fs) =>
          fs.writeFile(expectedFile, result.content, 'utf-8'),
        );
        console.log(
          `  CREATE: ${name}${EXPECTED_EXT} (${result.changes.length} change(s))`,
        );
        // Still count as "needs review" — don't pass/fail yet
        continue;
      }

      if (result.content === expected) {
        console.log(`  PASS: ${name} (${result.changes.length} change(s))`);
        passed++;
      } else {
        console.log(`  FAIL: ${name}`);
        // Find first differing line
        const actualLines = result.content.split('\n');
        const expectedLines = expected.split('\n');
        const maxLen = Math.max(actualLines.length, expectedLines.length);
        let firstDiff = -1;
        for (let i = 0; i < maxLen; i++) {
          if (actualLines[i] !== expectedLines[i]) {
            firstDiff = i + 1; // 1-indexed
            break;
          }
        }
        console.log(`    First diff at line ${firstDiff}`);
        if (firstDiff > 0) {
          console.log(
            `    Expected: ${expectedLines[firstDiff - 1]?.substring(0, 100)}`,
          );
          console.log(
            `    Actual:   ${actualLines[firstDiff - 1]?.substring(0, 100)}`,
          );
        }
        failures.push(name);
        failed++;
      }
    } catch (err) {
      console.error(`  ERROR: ${name}: ${err.message}`);
      failures.push(name);
      failed++;
    }
  }

  // Summary
  const created = fixtures.length - passed - failed;
  console.log(`\n─── Results ───`);
  console.log(`  Passed:  ${passed}`);
  console.log(`  Failed:  ${failed}`);
  console.log(`  Created: ${created} (new .expected files — review required)`);

  if (failures.length > 0) {
    console.log(`\n  Failures: ${failures.join(', ')}`);
    process.exit(1);
  }

  if (created > 0) {
    console.log(
      `\n⚠ New .expected files were created. Review them, then re-run tests.`,
    );
    process.exit(0);
  }

  console.log(`\n✓ All fixtures pass.`);
}

runTests().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
