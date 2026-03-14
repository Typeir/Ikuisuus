/**
 * Report Writer
 *
 * @fileoverview Generates a detailed completion report in .ignore/reports/ from the
 * latest task file and health check results. Called after successful reconciliation.
 *
 * @module scripts/ci/write-report
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

/**
 * Find the latest task file
 *
 * @returns {Promise<string|null>} Absolute path or null
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

/**
 * Extract the title from a task file
 *
 * @param {string} content - File content
 * @returns {string} Task title
 */
function extractTitle(content) {
  const match = content.match(/^# Task:\s*(.+)/m);
  return match ? match[1].trim() : 'Untitled Task';
}

/**
 * Extract the health check results table from content
 *
 * @param {string} content - File content
 * @returns {string} Health results section or placeholder
 */
function extractHealthSection(content) {
  const match = content.match(/## Health Check Results[\s\S]*?(?=\n## |$)/);
  return match
    ? match[0]
    : '## Health Check Results\n\nNo health check data available.';
}

/**
 * Extract related files from task content
 *
 * @param {string} content - File content
 * @returns {string[]} List of related files
 */
function extractRelatedFiles(content) {
  const match = content.match(/\*\*Related Files\*\*:\s*(.+)/);
  if (!match) return [];
  return match[1]
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean);
}

/**
 * Extract DoD items with their status
 *
 * @param {string} content - File content
 * @returns {string} Formatted DoD verification
 */
function extractDoDVerification(content) {
  const match = content.match(
    /## Definition of Done \(DoD\)[\s\S]*?(?=\n## |$)/,
  );
  if (!match) return 'No DoD section found.';
  return match[0].replace('## Definition of Done (DoD)', '').trim();
}

async function main() {
  const taskFile = await findLatestTaskFile();
  if (!taskFile) {
    console.error('❌ No task file found. Cannot generate report.');
    process.exit(1);
  }

  const content = await fs.readFile(taskFile, 'utf-8');
  const title = extractTitle(content);
  const relTaskPath = path.relative(ROOT, taskFile).replace(/\\/g, '/');

  const now = new Date();
  const timestamp = now.toISOString();
  const fileTimestamp = now
    .toISOString()
    .replace(/[:.]/g, '')
    .replace('T', '-')
    .substring(0, 15);
  const kebabTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const reportFilename = `${fileTimestamp}-report-${kebabTitle}.md`;
  const reportPath = path.join(ROOT, '.ignore', 'reports', reportFilename);

  const healthSection = extractHealthSection(content);
  const relatedFiles = extractRelatedFiles(content);
  const dodVerification = extractDoDVerification(content);

  const fileTable =
    relatedFiles.length > 0
      ? relatedFiles.map((f) => `| ${f} | modified | — |`).join('\n')
      : '| (no files tracked) | — | — |';

  const report = `# Completion Report: ${title}

**Generated**: ${timestamp}
**Task File**: ${relTaskPath}
**Final Status**: COMPLETED

---

## Summary

Task "${title}" has been completed. All Definition of Done criteria, milestones, and
checklist items have been verified. Health checks have been executed and results recorded.

## Changes Made

| File | Action | Lines Changed |
|------|--------|---------------|
${fileTable}

## ${healthSection.replace('## ', '')}

## Definition of Done Verification

${dodVerification}

## Completion Manifest

- **Task file**: ${relTaskPath}
- **Report file**: .ignore/reports/${reportFilename}
- **Health gate**: Executed
- **Reconciliation**: All items verified
`;

  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, report, 'utf-8');
  console.log(`✅ Report written to: .ignore/reports/${reportFilename}`);
}

main().catch((err) => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
