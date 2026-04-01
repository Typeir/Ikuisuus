/**
 * Session End Health Hook
 *
 * @fileoverview Executes diff-scoped health checks at session end and blocks
 * completion when critical violations are present.
 *
 * @module .github/scripts/hooks/session-end-health
 */

import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isNestedHookRun, readHookInput, writeHookOutput } from './hook-runtime';

interface HealthFailure {
  file?: string;
  line?: number;
  message: string;
  suggestion?: string;
}

interface HealthCheckResult {
  check: string;
  severity: 'critical' | 'warning' | 'info';
  passed: boolean;
  failures: HealthFailure[];
}

interface HealthReport {
  timestamp: string;
  mode?: string;
  overall?: string;
  checks?: HealthCheckResult[];
  summary?: {
    has_critical?: boolean;
    total_violations?: number;
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../../..');

/**
 * Check whether src/ or scripts/ files have local changes.
 *
 * @returns True when staged or unstaged source changes exist
 */
function hasSourceChanges(): boolean {
  try {
    const unstaged = execSync('git diff --name-only HEAD -- src/ scripts/', {
      cwd: ROOT,
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    const staged = execSync('git diff --cached --name-only -- src/ scripts/', {
      cwd: ROOT,
      encoding: 'utf-8',
      timeout: 10000,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
    return unstaged.length > 0 || staged.length > 0;
  } catch {
    return false;
  }
}

/**
 * Find latest task markdown file in .ignore/tasks.
 *
 * @returns Absolute file path or null
 */
async function findLatestTaskFile(): Promise<string | null> {
  const tasksDir = path.join(ROOT, '.ignore', 'tasks');
  try {
    const files = await fs.readdir(tasksDir);
    const taskFiles = files.filter((fileName) => fileName.endsWith('.md')).sort().reverse();
    return taskFiles.length > 0 ? path.join(tasksDir, taskFiles[0]) : null;
  } catch {
    return null;
  }
}

/**
 * Build actionable context message from critical check failures.
 *
 * @param report Health report object
 * @returns Context string for block reason
 */
function buildActionableContext(report: HealthReport): string {
  const failedChecks = (report.checks ?? []).filter((check) => !check.passed && check.severity === 'critical');
  if (failedChecks.length === 0) {
    return '🚫 Health check failed but no specific failures were captured.';
  }

  const issuesByFile = new Map<string, Array<{ check: string; message: string; line?: number; suggestion?: string }>>();

  for (const check of failedChecks) {
    for (const failure of check.failures) {
      const fileKey = failure.file ?? 'unknown';
      if (!issuesByFile.has(fileKey)) {
        issuesByFile.set(fileKey, []);
      }
      issuesByFile.get(fileKey)?.push({
        check: check.check,
        message: failure.message,
        line: failure.line,
        suggestion: failure.suggestion,
      });
    }
  }

  const lines: string[] = [`🚫 ${failedChecks.length} critical check(s) failed in your changed files:`, ''];

  for (const [filePath, issues] of issuesByFile) {
    lines.push(`📄 ${filePath}`);
    for (const issue of issues.slice(0, 8)) {
      const location = typeof issue.line === 'number' ? `:${issue.line}` : '';
      lines.push(`   [${issue.check}] ${issue.message}${location}`);
      if (issue.suggestion) {
        lines.push(`   → ${issue.suggestion}`);
      }
    }
    if (issues.length > 8) {
      lines.push(`   ... and ${issues.length - 8} more in this file`);
    }
    lines.push('');
  }

  lines.push('Fix these issues in your changed files, then try again.');
  return lines.join('\n');
}

/**
 * Format health report markdown for task file insertion.
 *
 * @param report Health report object
 * @returns Markdown block
 */
function formatHealthResults(report: HealthReport): string {
  const lines = [
    `**Run at**: ${report.timestamp}`,
    `**Mode**: ${report.mode === 'changed-only' ? 'Diff-scoped (changed files only)' : 'Full codebase'}`,
    `**Overall**: ${report.overall ?? 'unknown'}`,
    '',
    '| Check | Result | Violations |',
    '|-------|--------|------------|',
  ];

  for (const check of report.checks ?? []) {
    const status = check.passed ? '✅ PASS' : check.severity === 'critical' ? '❌ FAIL' : '⚠️ WARN';
    lines.push(`| ${check.check} | ${status} | ${check.failures.length} |`);
  }

  return lines.join('\n');
}

/**
 * Parse JSON report payload from health-check stdout.
 *
 * @param output Health check process output
 * @returns Parsed report or null
 */
function parseHealthReport(output: string): HealthReport | null {
  const jsonMatch = output.match(/---JSON_REPORT_START---\n([\s\S]*?)\n---JSON_REPORT_END---/);
  if (!jsonMatch) {
    return null;
  }

  try {
    return JSON.parse(jsonMatch[1]) as HealthReport;
  } catch {
    return null;
  }
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

  if (!hasSourceChanges()) {
    writeHookOutput({ continue: true });
    return;
  }

  let healthOutput = '';
  let hasCritical = false;

  try {
    healthOutput = execSync(
      'npx tsx --tsconfig tsconfig.scripts.json .github/scripts/health-check.ts --changed-only',
      {
      cwd: ROOT,
      encoding: 'utf-8',
      timeout: 120000,
      stdio: ['pipe', 'pipe', 'pipe'],
      },
    );
  } catch (error) {
    hasCritical = true;
    const failed = error as { stdout?: string };
    healthOutput = failed.stdout ?? '';
  }

  const report = parseHealthReport(healthOutput);
  if (report?.summary?.has_critical === true) {
    hasCritical = true;
  }

  const latestTaskFile = await findLatestTaskFile();
  if (latestTaskFile && report) {
    try {
      let taskContent = await fs.readFile(latestTaskFile, 'utf-8');
      const healthSection = formatHealthResults(report);
      if (taskContent.includes('## Health Check Results')) {
        taskContent = taskContent.replace(
          /## Health Check Results[\s\S]*?(?=\n## |$)/,
          `## Health Check Results\n\n${healthSection}\n`,
        );
      } else {
        taskContent += `\n## Health Check Results\n\n${healthSection}\n`;
      }
      await fs.writeFile(latestTaskFile, taskContent, 'utf-8');
    } catch {
      writeHookOutput({ continue: true });
      return;
    }
  }

  if (hasCritical) {
    const reason = report
      ? buildActionableContext(report)
      : 'Health check failed but could not parse results. Run npm run health:check manually.';
    writeHookOutput({
      continue: true,
      hookSpecificOutput: {
        hookEventName: 'sessionEnd',
        decision: 'block',
        reason,
      },
    });
    return;
  }

  if ((report?.summary?.total_violations ?? 0) > 0) {
    writeHookOutput({
      continue: true,
      systemMessage: `Health check passed with ${report?.summary?.total_violations ?? 0} non-blocking warning(s) in your changed files. See task file for details.`,
    });
    return;
  }

  writeHookOutput({ continue: true });
}

main().catch(() => {
  writeHookOutput({ continue: true });
});
