/**
 * Task Reconciliation Script
 *
 * @fileoverview Reads the latest task file in .ignore/tasks/ and verifies that all
 * checklist items, milestones, and DoD items are checked. Also validates that health
 * check results are populated. Outputs a structured JSON result.
 *
 * @module .github/scripts/reconcile-task
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

/**
 * @typedef {Object} ReconcileResult
 * @property {boolean} complete - Whether all items are resolved
 * @property {string} taskFile - Path to the task file
 * @property {string} status - Task status
 * @property {Object} sections - Per-section completion data
 * @property {string[]} incomplete - List of incomplete item descriptions
 */

/**
 * Find the latest task file by filename timestamp sort
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
 * Parse checklist items from a markdown section
 *
 * @param {string} content - Full file content
 * @param {string} sectionHeader - Header to search for
 * @returns {{ checked: number, unchecked: number, items: Array<{text: string, done: boolean}> }}
 */
function parseChecklistSection(content, sectionHeader) {
  const sectionRegex = new RegExp(`## ${sectionHeader}[\\s\\S]*?(?=\\n## |$)`);
  const match = content.match(sectionRegex);
  if (!match) return { checked: 0, unchecked: 0, items: [] };

  const sectionContent = match[0];
  const items = [];
  const lines = sectionContent.split('\n');

  for (const line of lines) {
    const checkedMatch = line.match(/^- \[x\]\s+(.+)/i);
    const uncheckedMatch = line.match(/^- \[ \]\s+(.+)/);
    if (checkedMatch) {
      items.push({ text: checkedMatch[1], done: true });
    } else if (uncheckedMatch) {
      items.push({ text: uncheckedMatch[1], done: false });
    }
  }

  return {
    checked: items.filter((i) => i.done).length,
    unchecked: items.filter((i) => !i.done).length,
    items,
  };
}

/**
 * Extract the Status field value from the task file
 *
 * @param {string} content - Full file content
 * @returns {string} Status value or 'UNKNOWN'
 */
function extractStatus(content) {
  const match = content.match(/\*\*Status\*\*:\s*(.+)/);
  return match ? match[1].trim() : 'UNKNOWN';
}

/**
 * Check if health results section has content
 *
 * @param {string} content - Full file content
 * @returns {boolean} Whether health results are populated
 */
function hasHealthResults(content) {
  const match = content.match(/## Health Check Results[\s\S]*?(?=\n## |$)/);
  if (!match) return false;
  const section = match[0].replace(/## Health Check Results/, '').trim();
  return section.length > 10;
}

async function main() {
  const taskFile = await findLatestTaskFile();

  if (!taskFile) {
    const noTaskResult = {
      complete: false,
      taskFile: null,
      status: 'NO_TASK_FILE',
      sections: {},
      incomplete: ['No task file found in .ignore/tasks/'],
    };
    console.log(JSON.stringify(noTaskResult, null, 2));
    process.exit(1);
  }

  const content = await fs.readFile(taskFile, 'utf-8');
  const status = extractStatus(content);
  const relPath = path.relative(ROOT, taskFile).replace(/\\/g, '/');

  const sections = {
    dod: parseChecklistSection(content, 'Definition of Done \\(DoD\\)'),
    milestones: parseChecklistSection(content, 'Milestones'),
    checklist: parseChecklistSection(content, 'Checklist'),
  };

  const healthPopulated = hasHealthResults(content);
  const incomplete = [];

  for (const [name, data] of Object.entries(sections)) {
    for (const item of data.items) {
      if (!item.done) {
        incomplete.push(`[${name}] ${item.text}`);
      }
    }
  }

  if (!healthPopulated) {
    incomplete.push(
      '[health] Health Check Results section is empty — run health check',
    );
  }

  const isComplete =
    incomplete.length === 0 && status !== 'BLOCKED' && status !== 'FAILED';

  const result = {
    complete: isComplete,
    taskFile: relPath,
    status,
    sections: {
      dod: { checked: sections.dod.checked, unchecked: sections.dod.unchecked },
      milestones: {
        checked: sections.milestones.checked,
        unchecked: sections.milestones.unchecked,
      },
      checklist: {
        checked: sections.checklist.checked,
        unchecked: sections.checklist.unchecked,
      },
      healthResults: healthPopulated,
    },
    incomplete,
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(isComplete ? 0 : 1);
}

main().catch((err) => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
