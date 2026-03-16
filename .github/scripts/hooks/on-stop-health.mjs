/**
 * On-Stop Health Hook
 *
 * @fileoverview Runs the composite health check in diff-scoped mode when a Copilot
 * agent session ends. Only checks files with uncommitted changes so pre-existing
 * tech debt does not block the session. Provides actionable context grouped by
 * file and check type to help the model self-correct.
 *
 * Uses VS Code hook protocol: reads JSON from stdin (including stop_hook_active
 * to prevent infinite loops), outputs hookSpecificOutput with decision: "block"
 * when critical issues are found so the agent continues to fix them.
 *
 * @module .github/scripts/hooks/on-stop-health
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../../..');

/**
 * Read and parse JSON input from stdin (provided by VS Code hook system).
 *
 * @returns {Promise<Object>} Parsed hook input with stop_hook_active, sessionId, etc.
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
 * Check if any source files have uncommitted changes (staged or unstaged).
 *
 * @returns {boolean} True if src/ or scripts/ have modifications
 */
function hasSourceChanges() {
  try {
    const diff = execSync('git diff --name-only HEAD -- src/ scripts/', {
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

    return diff.length > 0 || staged.length > 0;
  } catch {
    return false;
  }
}

/**
 * Find the latest task file in .ignore/tasks/
 *
 * @returns {Promise<string|null>} Path to latest task file or null
 */
async function findLatestTaskFile() {
  const tasksDir = path.join(ROOT, '.ignore', 'tasks');
  try {
    const files = await fs.readdir(tasksDir);
    const mdFiles = files
      .filter((f) => f.endsWith('.md'))
      .sort()
      .reverse();
    return mdFiles.length > 0 ? path.join(tasksDir, mdFiles[0]) : null;
  } catch {
    return null;
  }
}

async function main() {
  const hookInput = await readStdin();

  if (hookInput.stop_hook_active) {
    console.log(JSON.stringify({ continue: true }));
    return;
  }

  if (!hasSourceChanges()) {
    console.log(JSON.stringify({ continue: true }));
    return;
  }

  let healthOutput = '';
  let hasCritical = false;

  try {
    healthOutput = execSync(
      'node .github/scripts/health-check.mjs --changed-only',
      {
        cwd: ROOT,
        encoding: 'utf-8',
        timeout: 120000,
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );
  } catch (err) {
    hasCritical = true;
    healthOutput = err.stdout || '';
  }

  const jsonMatch = healthOutput.match(
    /---JSON_REPORT_START---\n([\s\S]*?)\n---JSON_REPORT_END---/,
  );
  let report = null;
  if (jsonMatch) {
    try {
      report = JSON.parse(jsonMatch[1]);
      hasCritical = report.summary?.has_critical || false;
    } catch {
      /* parse failed */
    }
  }

  const taskFile = await findLatestTaskFile();
  if (taskFile && report) {
    try {
      let taskContent = await fs.readFile(taskFile, 'utf-8');
      const healthSection = formatHealthResults(report);
      if (taskContent.includes('## Health Check Results')) {
        taskContent = taskContent.replace(
          /## Health Check Results[\s\S]*?(?=\n## |$)/,
          `## Health Check Results\n\n${healthSection}\n`,
        );
      } else {
        taskContent += `\n## Health Check Results\n\n${healthSection}\n`;
      }
      await fs.writeFile(taskFile, taskContent, 'utf-8');
    } catch {
      /* task file update failed — non-blocking */
    }
  }

  const result = { continue: true };

  if (hasCritical) {
    const context = report
      ? buildActionableContext(report)
      : 'Health check failed but could not parse results. Run npm run health:check manually.';
    result.hookSpecificOutput = {
      hookEventName: 'Stop',
      decision: 'block',
      reason: context,
    };
  } else if (report?.summary?.total_violations > 0) {
    result.systemMessage = `Health check passed with ${report.summary.total_violations} non-blocking warning(s) in your changed files. See task file for details.`;
  }

  console.log(JSON.stringify(result));
}

/**
 * Build actionable context from the health report, grouped by file with
 * specific instructions on what to fix.
 *
 * @param {Object} report - Health check report
 * @returns {string} Formatted context for the model
 */
function buildActionableContext(report) {
  const failedChecks =
    report.checks?.filter((c) => !c.passed && c.severity === 'critical') || [];

  if (failedChecks.length === 0) {
    return '🚫 Health check failed but no specific failures were captured.';
  }

  const byFile = new Map();
  for (const check of failedChecks) {
    for (const f of check.failures) {
      const file = f.file || 'unknown';
      if (!byFile.has(file)) byFile.set(file, []);
      byFile.get(file).push({
        check: check.check,
        line: f.line,
        rule: f.rule,
        message: f.message,
        suggestion: f.suggestion,
      });
    }
  }

  const lines = [
    `🚫 ${failedChecks.length} critical check(s) failed in your changed files:`,
    '',
  ];

  for (const [file, issues] of byFile) {
    lines.push(`📄 ${file}`);
    for (const issue of issues.slice(0, 8)) {
      const loc = issue.line ? `:${issue.line}` : '';
      lines.push(`   [${issue.check}] ${issue.message}${loc}`);
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
 * Format health report into a markdown section
 *
 * @param {Object} report - Health check report
 * @returns {string} Formatted markdown
 */
function formatHealthResults(report) {
  const lines = [
    `**Run at**: ${report.timestamp}`,
    `**Mode**: ${report.mode === 'changed-only' ? 'Diff-scoped (changed files only)' : 'Full codebase'}`,
    `**Overall**: ${report.overall}`,
    '',
    '| Check | Result | Violations |',
    '|-------|--------|------------|',
  ];

  for (const check of report.checks || []) {
    const status = check.passed
      ? '✅ PASS'
      : check.severity === 'critical'
        ? '❌ FAIL'
        : '⚠️ WARN';
    lines.push(
      `| ${check.check} | ${status} | ${check.failures?.length || 0} |`,
    );
  }

  return lines.join('\n');
}

main().catch(() => {
  console.log(JSON.stringify({ continue: true }));
});
