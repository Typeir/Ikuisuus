/**
 * On-Stop Health Hook
 *
 * @fileoverview Runs the composite health check when a Copilot agent session ends.
 * If critical failures are found, blocks the session stop and provides context
 * for the model to self-correct.
 *
 * @module scripts/ci/hooks/on-stop-health
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../../..');

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
  let healthOutput = '';
  let hasCritical = false;

  try {
    healthOutput = execSync('node scripts/ci/health-check.mjs', {
      cwd: ROOT,
      encoding: 'utf-8',
      timeout: 120000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
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

  const result = {};

  if (hasCritical) {
    result.continue = false;
    result.stopReason =
      'Health check found critical issues. Fix them before completing.';
    if (report) {
      const criticalChecks =
        report.checks?.filter((c) => c.severity === 'critical' && !c.passed) ||
        [];
      const details = criticalChecks
        .flatMap((c) =>
          c.failures.slice(0, 5).map((f) => `${f.file}: ${f.message}`),
        )
        .join('\n');
      result.additionalContext = `🚫 CRITICAL health check failures:\n${details}`;
    }
  } else {
    result.continue = true;
    if (report?.summary?.total_violations > 0) {
      result.additionalContext = `⚠️ Health check passed with ${report.summary.total_violations} warning(s). See task file for details.`;
    }
  }

  console.log(JSON.stringify(result));
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
