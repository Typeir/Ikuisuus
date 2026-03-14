/**
 * Composite Health Check
 *
 * @fileoverview Orchestrates all code health sub-checks and aggregates results.
 * Runs file-length, duplicate-css, jsdoc-quality, antipatterns, and test-gaps checks.
 * Returns a unified JSON report and exits with code 1 if any critical check fails.
 *
 * @module scripts/ci/health-check
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @typedef {Object} CheckResult
 * @property {string} check - Check name
 * @property {string} severity - critical, warning, or info
 * @property {boolean} passed - Whether the check passed
 * @property {Array} failures - List of failures
 * @property {Object} stats - Statistics
 */

const CHECKS = [
  { name: 'file-length', script: 'check-file-length.mjs' },
  { name: 'duplicate-css', script: 'check-duplicate-css.mjs' },
  { name: 'jsdoc-quality', script: 'check-jsdoc-quality.mjs' },
  { name: 'antipatterns', script: 'check-antipatterns.mjs' },
  { name: 'test-gaps', script: 'check-test-gaps.mjs' },
];

/**
 * Run a single check script and capture its JSON output
 *
 * @param {string} scriptName - Script filename
 * @returns {CheckResult} Parsed result or error placeholder
 */
function runCheck(scriptName) {
  const scriptPath = path.join(__dirname, scriptName);
  try {
    const output = execSync(`node "${scriptPath}"`, {
      encoding: 'utf-8',
      timeout: 60000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return JSON.parse(output);
  } catch (err) {
    if (err.stdout) {
      try {
        return JSON.parse(err.stdout);
      } catch {
        /* parse failed, fall through */
      }
    }
    return {
      check: scriptName.replace('.mjs', ''),
      severity: 'critical',
      passed: false,
      failures: [
        {
          file: scriptName,
          rule: 'script-error',
          message: err.message?.substring(0, 200) || 'Unknown error',
          suggestion: 'Check script execution manually',
        },
      ],
      stats: { total_files_checked: 0, violations_found: 1 },
    };
  }
}

async function main() {
  console.log('🏥 Running Composite Health Check...\n');

  const results = [];
  let hasCritical = false;
  let totalViolations = 0;

  for (const check of CHECKS) {
    process.stdout.write(`  ⏳ ${check.name}... `);
    const result = runCheck(check.script);
    results.push(result);

    if (!result.passed && result.severity === 'critical') {
      hasCritical = true;
      console.log(`❌ FAIL (${result.failures.length} issue(s))`);
    } else if (!result.passed) {
      console.log(`⚠️  WARN (${result.failures.length} issue(s))`);
    } else {
      console.log('✅ PASS');
    }

    totalViolations += result.failures?.length || 0;
  }

  const report = {
    timestamp: new Date().toISOString(),
    overall: hasCritical ? 'FAIL' : 'PASS',
    summary: {
      total_checks: CHECKS.length,
      passed: results.filter((r) => r.passed).length,
      failed: results.filter((r) => !r.passed).length,
      total_violations: totalViolations,
      has_critical: hasCritical,
    },
    checks: results,
  };

  console.log('\n' + '─'.repeat(60));
  console.log(`\n📊 Overall: ${report.overall}`);
  console.log(
    `   Checks: ${report.summary.passed}/${report.summary.total_checks} passed`,
  );
  console.log(`   Violations: ${report.summary.total_violations}`);

  if (hasCritical) {
    console.log('\n🚫 CRITICAL issues found — completion is BLOCKED.\n');
    const criticalResults = results.filter(
      (r) => r.severity === 'critical' && !r.passed,
    );
    for (const cr of criticalResults) {
      console.log(`  ❌ ${cr.check}:`);
      for (const f of cr.failures.slice(0, 10)) {
        console.log(
          `     ${f.file}${f.line ? ':' + f.line : ''} — ${f.message}`,
        );
      }
      if (cr.failures.length > 10) {
        console.log(`     ... and ${cr.failures.length - 10} more`);
      }
    }
  }

  console.log('\n---JSON_REPORT_START---');
  console.log(JSON.stringify(report, null, 2));
  console.log('---JSON_REPORT_END---');

  process.exit(hasCritical ? 1 : 0);
}

main().catch((err) => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
