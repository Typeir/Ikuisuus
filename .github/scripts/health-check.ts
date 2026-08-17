/**
 * Composite Health Check
 *
 * @fileoverview Runs all code health sub-checks and aggregates results.
 * Supports --changed-only flag to post-filter failures to uncommitted changed files.
 *
 * @module .github/scripts/health-check
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCheck as checkAnchors } from './checkAnchors';
import { runCheck as checkAntipatterns } from './checkAntipatterns';
import { runCheck as checkDuplicateCss } from './checkDuplicateCss';
import { runCheck as checkFileLength } from './checkFileLength';
import { runCheck as checkJsdocQuality } from './checkJsdocQuality';
import { runCheck as checkMdxFormat } from './checkMdxFormat';
import { runCheck as checkOrphanedMdxLinks } from './checkOrphanedMdxLinks';
import { runCheck as checkSmokeTests } from './checkSmokeTests';
import { runCheck as checkTestGaps } from './checkTestGaps';
import { runCheck as checkTsCompilation } from './checkTsCompilation';
import type { CheckResult, HealthReport } from './health-check-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');
const CONTENT_SUBMODULE = path.join(ROOT, 'src', 'content');
const changedOnlyMode = process.argv.includes('--changed-only');
const IGNORE_DIRECTIVE_PATTERN =
  /health:check-ignore-(file|nextline)\s+([a-z0-9*_,\s-]+)/gi;
const WILDCARD_RULE = '*';
const COMMENT_PATTERN =
  /<!--([\s\S]*?)-->|\{\/\*([\s\S]*?)\*\/\}|\/\*([\s\S]*?)\*\/|\/\/([^\n]*)/g;
const FUZZY_IGNORE_PATTERN = /([a-z][a-z0-9-]*)\s+ignore\b/gi;

/**
 * Parsed ignore directives for a single source file.
 */
interface IgnoreDirectives {
  /** Rule names ignored for the whole file */
  fileRules: Set<string>;
  /** Map of target line number -> ignored rule names */
  nextLineRules: Map<number, Set<string>>;
}

/**
 * Entry for a single check step in the composite run.
 */
interface CheckEntry {
  /** Display name */
  name: string;
  /** Async function that runs the check and returns a result */
  run: () => Promise<CheckResult>;
}

const CHECKS: CheckEntry[] = [
  { name: 'file-length', run: checkFileLength },
  { name: 'duplicate-css', run: checkDuplicateCss },
  { name: 'jsdoc-quality', run: checkJsdocQuality },
  { name: 'antipatterns', run: checkAntipatterns },
  { name: 'test-gaps', run: checkTestGaps },
  { name: 'mdx-format', run: checkMdxFormat },
  { name: 'orphaned-mdx-links', run: checkOrphanedMdxLinks },
  { name: 'smoke-tests', run: checkSmokeTests },
  { name: 'type-script-check', run: checkTsCompilation },
  { name: 'anchors', run: checkAnchors },
];

/**
 * Normalize a failure rule token for matching.
 *
 * @param token Raw token text
 * @returns Canonical lowercase token
 */
function normalizeRuleToken(token: string): string {
  const normalized = token.trim().toLowerCase();
  if (normalized === 'all') {
    return WILDCARD_RULE;
  }
  return normalized;
}

/**
 * Parse a directive payload into a set of rule tokens.
 *
 * @param rawRules Raw directive payload text
 * @returns Set of normalized rules
 */
function parseRuleList(rawRules: string): Set<string> {
  const rules = new Set<string>();
  const sanitizedRawRules = rawRules.replace(/\s+\*+$/g, '');
  const tokens = sanitizedRawRules
    .split(/[\s,]+/)
    .map(normalizeRuleToken)
    .filter(Boolean);

  if (tokens.length === 0) {
    rules.add(WILDCARD_RULE);
    return rules;
  }

  for (const token of tokens) {
    rules.add(token);
  }

  return rules;
}

/**
 * Parse file-level and next-line health-check ignore directives from source.
 *
 * @param content Source file text
 * @returns Parsed directive sets
 */
function parseIgnoreDirectives(content: string): IgnoreDirectives {
  const directives: IgnoreDirectives = {
    fileRules: new Set<string>(),
    nextLineRules: new Map<number, Set<string>>(),
  };

  COMMENT_PATTERN.lastIndex = 0;
  for (const commentMatch of content.matchAll(COMMENT_PATTERN)) {
    const body =
      commentMatch[1] ?? commentMatch[2] ?? commentMatch[3] ?? commentMatch[4];
    if (!body) {
      continue;
    }
    FUZZY_IGNORE_PATTERN.lastIndex = 0;
    for (const fuzzyMatch of body.matchAll(FUZZY_IGNORE_PATTERN)) {
      const rawRule = fuzzyMatch[1];
      if (!rawRule) {
        continue;
      }
      const normalized = normalizeRuleToken(rawRule);
      if (!normalized || normalized === 'ignore') {
        continue;
      }
      directives.fileRules.add(normalized);
    }
  }

  const lines = content.split('\n');

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    IGNORE_DIRECTIVE_PATTERN.lastIndex = 0;
    for (const match of line.matchAll(IGNORE_DIRECTIVE_PATTERN)) {
      const mode = match[1]?.toLowerCase();
      const rawRules = match[2] ?? '';
      const parsedRules = parseRuleList(rawRules);

      if (mode === 'file') {
        for (const rule of parsedRules) {
          directives.fileRules.add(rule);
        }
        continue;
      }

      const targetLine = index + 2;
      if (!directives.nextLineRules.has(targetLine)) {
        directives.nextLineRules.set(targetLine, new Set<string>());
      }
      const targetRules = directives.nextLineRules.get(targetLine)!;
      for (const rule of parsedRules) {
        targetRules.add(rule);
      }
    }
  }

  return directives;
}

/**
 * Load and cache ignore directives for a relative file path.
 *
 * @param relativePath Project-relative path from failure payload
 * @param cache Per-run directive cache
 * @returns Parsed directives for the file
 */
async function getIgnoreDirectivesForFile(
  relativePath: string,
  cache: Map<string, IgnoreDirectives>,
): Promise<IgnoreDirectives> {
  const normalizedPath = relativePath.replace(/\\/g, '/');
  if (cache.has(normalizedPath)) {
    return cache.get(normalizedPath)!;
  }

  const empty: IgnoreDirectives = {
    fileRules: new Set<string>(),
    nextLineRules: new Map<number, Set<string>>(),
  };

  try {
    const content = await fs.readFile(path.join(ROOT, normalizedPath), 'utf-8');
    const parsed = parseIgnoreDirectives(content);
    cache.set(normalizedPath, parsed);
    return parsed;
  } catch {
    cache.set(normalizedPath, empty);
    return empty;
  }
}

/**
 * Test whether a rule matches a directive set.
 *
 * @param rules Set of directive rules
 * @param rule Failure rule name
 * @returns True when the rule is ignored
 */
function rulesMatch(rules: Set<string>, rule: string): boolean {
  const normalizedRule = normalizeRuleToken(rule);
  return rules.has(WILDCARD_RULE) || rules.has(normalizedRule);
}

/**
 * Recompute check severity from filtered failures.
 *
 * @param result Original check result
 * @param failures Filtered failures
 * @returns Aggregate check severity
 */
function getSeverityForFailures(
  result: CheckResult,
  failures: CheckResult['failures'],
): CheckResult['severity'] {
  if (failures.length === 0) {
    return 'info';
  }

  let hasCritical = false;
  let hasWarning = false;

  for (const failure of failures) {
    const failureSeverity =
      failure.severity ??
      (result.severity === 'info' ? 'warning' : result.severity);
    if (failureSeverity === 'critical') {
      hasCritical = true;
    }
    if (failureSeverity === 'warning') {
      hasWarning = true;
    }
  }

  if (hasCritical) {
    return 'critical';
  }
  if (hasWarning) {
    return 'warning';
  }
  return result.severity;
}

/**
 * Build a new check result after failure filtering.
 *
 * @param result Original check result
 * @param failures Filtered failures
 * @param totalBeforeFilter Failure count before filtering
 * @param beforeKey Stats key for the pre-filter count
 * @returns Updated check result
 */
function buildFilteredResult(
  result: CheckResult,
  failures: CheckResult['failures'],
  totalBeforeFilter: number,
  beforeKey: string,
): CheckResult {
  const severity = getSeverityForFailures(result, failures);
  const nextStats = {
    ...result.stats,
    violations_found: failures.length,
    [beforeKey]: totalBeforeFilter,
  };
  if (
    Object.prototype.hasOwnProperty.call(result.stats, 'critical_violations') ||
    Object.prototype.hasOwnProperty.call(result.stats, 'warning_violations')
  ) {
    const criticalCount = failures.filter(
      (failure) =>
        (failure.severity ??
          (result.severity === 'info' ? 'warning' : result.severity)) ===
        'critical',
    ).length;
    nextStats.critical_violations = criticalCount;
    nextStats.warning_violations = failures.length - criticalCount;
  }
  if (
    Object.prototype.hasOwnProperty.call(result.stats, 'critical') ||
    Object.prototype.hasOwnProperty.call(result.stats, 'warnings')
  ) {
    const criticalCount = failures.filter(
      (failure) =>
        (failure.severity ??
          (result.severity === 'info' ? 'warning' : result.severity)) ===
        'critical',
    ).length;
    nextStats.critical = criticalCount;
    nextStats.warnings = failures.length - criticalCount;
  }

  return {
    ...result,
    passed: failures.length === 0,
    severity,
    failures,
    stats: nextStats,
  };
}

/**
 * Get the set of uncommitted changed files relative to ROOT.
 * Normalises all separators to forward slashes.
 *
 * @returns Set of relative file paths
 */
function getChangedFiles(): Set<string> {
  const run = (cmd: string, cwd: string = ROOT): string => {
    try {
      return execSync(cmd, {
        cwd,
        encoding: 'utf-8',
        timeout: 10000,
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
    } catch {
      return '';
    }
  };

  const all = [
    run('git diff --name-only HEAD'),
    run('git diff --cached --name-only'),
    run('git ls-files --others --exclude-standard'),
  ]
    .filter(Boolean)
    .join('\n')
    .split('\n')
    .filter(Boolean)
    .map((f) => f.replace(/\\/g, '/'));

  const submoduleChanged = [
    run('git diff --name-only HEAD', CONTENT_SUBMODULE),
    run('git diff --cached --name-only', CONTENT_SUBMODULE),
    run('git ls-files --others --exclude-standard', CONTENT_SUBMODULE),
  ]
    .filter(Boolean)
    .join('\n')
    .split('\n')
    .filter(Boolean)
    .map((f) => f.replace(/\\/g, '/'))
    .map((f) => `src/content/${f}`);

  return new Set([...all, ...submoduleChanged]);
}

/**
 * Post-filter a check result to only include failures from changed files.
 *
 * @param result Original check result
 * @param changedFiles Set of changed file paths
 * @returns Filtered check result (original not mutated)
 */
function filterToChangedFiles(
  result: CheckResult,
  changedFiles: Set<string>,
): CheckResult {
  const filtered = result.failures.filter((failure) =>
    changedFiles.has((failure.file ?? '').replace(/\\/g, '/')),
  );
  return buildFilteredResult(
    result,
    filtered,
    result.failures.length,
    'total_before_filter',
  );
}

/**
 * Apply source-level ignore directives to a check result.
 *
 * @param result Check result to filter
 * @param cache Per-run directive cache
 * @returns Filtered result
 */
async function filterIgnoredFailures(
  result: CheckResult,
  cache: Map<string, IgnoreDirectives>,
): Promise<CheckResult> {
  if (result.failures.length === 0) {
    return result;
  }

  const normalizedFailures = result.failures.map((failure) => ({
    ...failure,
    file: (failure.file ?? '').replace(/\\/g, '/'),
  }));
  const uniqueFiles = [
    ...new Set(normalizedFailures.map((failure) => failure.file)),
  ].filter(Boolean);
  const directivesByFile = new Map<string, IgnoreDirectives>();

  await Promise.all(
    uniqueFiles.map(async (file) => {
      directivesByFile.set(file, await getIgnoreDirectivesForFile(file, cache));
    }),
  );

  const filtered = normalizedFailures.filter((failure) => {
    const directives = directivesByFile.get(failure.file);
    if (!directives) {
      return true;
    }

    if (rulesMatch(directives.fileRules, failure.rule)) {
      return false;
    }

    if (typeof failure.line === 'number') {
      const nextLineRules = directives.nextLineRules.get(failure.line);
      if (nextLineRules && rulesMatch(nextLineRules, failure.rule)) {
        return false;
      }
    }

    return true;
  });

  return buildFilteredResult(
    result,
    filtered,
    result.failures.length,
    'total_before_ignore',
  );
}

/**
 * Run a single check entry, returning an error placeholder on failure.
 *
 * @param entry Check entry to run
 * @returns Check result
 */
async function runCheck(entry: CheckEntry): Promise<CheckResult> {
  try {
    return await entry.run();
  } catch (err) {
    const error = err as Error;
    return {
      check: entry.name,
      severity: 'critical',
      passed: false,
      failures: [
        {
          file: entry.name,
          rule: 'script-error',
          message: error.message?.substring(0, 200) ?? 'Unknown error',
          suggestion: 'Check script execution manually',
        },
      ],
      stats: { total_files_checked: 0, violations_found: 1 },
    };
  }
}

async function main(): Promise<void> {
  const changedFiles = changedOnlyMode ? getChangedFiles() : null;
  const ignoreDirectiveCache = new Map<string, IgnoreDirectives>();
  const modeLabel = changedOnlyMode
    ? `(diff-scoped: ${changedFiles!.size} file(s))`
    : '(full codebase)';
  console.log(`\u{1FA7A} Running Composite Health Check ${modeLabel}...\n`);

  const results: CheckResult[] = [];
  let hasCritical = false;
  let totalViolations = 0;

  for (const check of CHECKS) {
    process.stdout.write(`  \u23f3 ${check.name}... `);
    let result = await runCheck(check);
    if (changedFiles) result = filterToChangedFiles(result, changedFiles);
    result = await filterIgnoredFailures(result, ignoreDirectiveCache);

    results.push(result);
    totalViolations += result.failures.length;

    if (!result.passed && result.severity === 'critical') {
      hasCritical = true;
      console.log(`\u274c FAIL (${result.failures.length} issue(s))`);
    } else if (!result.passed) {
      console.log(`\u26a0\ufe0f  WARN (${result.failures.length} issue(s))`);
    } else {
      console.log('\u2705 PASS');
    }
  }

  const report: HealthReport = {
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

  console.log('\n' + '\u2500'.repeat(60));
  console.log(`\n\u{1F4CA} Overall: ${report.overall}`);
  console.log(
    `   Checks: ${report.summary.passed}/${report.summary.total_checks} passed`,
  );
  console.log(`   Violations: ${report.summary.total_violations}`);

  if (hasCritical) {
    console.log(
      '\n\u{1F6AB} CRITICAL issues found \u2014 completion is BLOCKED.\n',
    );
    for (const cr of results.filter(
      (r) => r.severity === 'critical' && !r.passed,
    )) {
      console.log(`  \u274c ${cr.check}:`);
      for (const f of cr.failures.slice(0, 10)) {
        console.log(
          `     ${f.file}${typeof f.line === 'number' ? ':' + f.line : ''} \u2014 ${f.message}`,
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

main().catch((err: Error) => {
  console.error('\u274c Fatal:', err.message);
  process.exit(1);
});
