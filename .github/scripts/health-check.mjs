/**
 * Composite Health Check
 *
 * @fileoverview Orchestrates all code health sub-checks and aggregates results.
 * Runs file-length, duplicate-css, jsdoc-quality, antipatterns, test-gaps, and
 * mdx-format checks. Returns a unified JSON report and exits with code 1 if any
 * critical check fails.
 *
 * Supports --changed-only flag: when set, gets the list of uncommitted changed
 * files from git and post-filters each check's failures to only include violations
 * in those files. This prevents pre-existing tech debt from blocking sessions.
 *
 * @module .github/scripts/health-check
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');
const changedOnlyMode = process.argv.includes('--changed-only');

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
  { name: 'mdx-format', script: 'check-mdx-format.mjs' },
];

/**
 * Get the list of uncommitted changed files (staged + unstaged) relative to ROOT.
 * Normalizes to forward slashes for cross-platform matching.
 *
 * @returns {Set<string>} Set of changed file paths relative to ROOT
 */
function getChangedFiles() {
  const run = (cmd) => {
    try {
      return execSync(cmd, {
        cwd: ROOT,
        encoding: 'utf-8',
        timeout: 10000,
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
    } catch {
      return '';
    }
  };
  const unstaged = run('git diff --name-only HEAD');
  const staged = run('git diff --cached --name-only');
  const untracked = run('git ls-files --others --exclude-standard');
  const all = [unstaged, staged, untracked]
    .filter(Boolean)
    .join('\n')
    .split('\n')
    .filter(Boolean)
    .map((f) => f.replace(/\\/g, '/'));
  return new Set(all);
}

/**
 * Filter a check result to only include failures from changed files.
 * Returns a new result object; the original is not mutated.
 *
 * @param {CheckResult} result - Original check result
 * @param {Set<string>} changedFiles - Set of changed file paths
 * @returns {CheckResult} Filtered result
 */
function filterResultToChangedFiles(result, changedFiles) {
  const filtered = result.failures.filter((f) => {
    const normalized = (f.file || '').replace(/\\/g, '/');
    return changedFiles.has(normalized);
  });
  const passed = filtered.length === 0;
  return {
    ...result,
    passed,
    severity: passed ? 'info' : result.severity,
    failures: filtered,
    stats: {
      ...result.stats,
      violations_found: filtered.length,
      total_before_filter: result.failures.length,
    },
  };
}

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
  const changedFiles = changedOnlyMode ? getChangedFiles() : null;
  const modeLabel = changedOnlyMode
    ? `(diff-scoped: ${changedFiles.size} file(s))`
    : '(full codebase)';
  console.log(`🏥 Running Composite Health Check ${modeLabel}...\n`);

  const results = [];
  let hasCritical = false;
  let totalViolations = 0;

  for (const check of CHECKS) {
    process.stdout.write(`  ⏳ ${check.name}... `);
    let result = runCheck(check.script);

    if (changedFiles) {
      result = filterResultToChangedFiles(result, changedFiles);
    }

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
    mode: changedOnlyMode ? 'changed-only' : 'full',
    changed_files: changedFiles ? [...changedFiles] : null,
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
