/**
 * Task Reconciliation Script
 *
 * @fileoverview Reads the latest task file in .ignore/tasks/ and verifies that all
 * checklist items, milestones, and DoD items have been checked off. Validates
 * that health check results are populated.
 *
 * @module .github/scripts/reconcile-task
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

/**
 * Structured result of task reconciliation.
 */
interface ReconcileResult {
  /** Whether all items are resolved and task is complete */
  complete: boolean;
  /** Path to the task file, or null if not found */
  taskFile: string | null;
  /** Status field extracted from the task file */
  status: string;
  /** Per-section completion counts */
  sections: {
    dod: { checked: number; unchecked: number };
    milestones: { checked: number; unchecked: number };
    checklist: { checked: number; unchecked: number };
    healthResults: boolean;
  };
  /** List of incomplete item descriptions */
  incomplete: string[];
}

/**
 * Single checklist item parsed from a markdown section.
 */
interface ChecklistItem {
  /** Item text */
  text: string;
  /** Whether the checkbox is checked */
  done: boolean;
}

/**
 * Parsed section state.
 */
interface SectionState {
  checked: number;
  unchecked: number;
  items: ChecklistItem[];
}

/**
 * Find the latest task file in .ignore/tasks/ by filename sort.
 *
 * @returns Absolute path to latest task file or null
 */
async function findLatestTaskFile(): Promise<string | null> {
  const tasksDir = path.join(ROOT, '.ignore', 'tasks');
  try {
    const files = await fs.readdir(tasksDir);
    const mdFiles = files.filter((f) => f.endsWith('.md')).sort().reverse();
    return mdFiles.length > 0 ? path.join(tasksDir, mdFiles[0]) : null;
  } catch {
    return null;
  }
}

/**
 * Parse checklist items from a named markdown section.
 *
 * @param content Full file content
 * @param sectionHeader Escaped header string to search for
 * @returns Section state with item counts and list
 */
function parseChecklistSection(content: string, sectionHeader: string): SectionState {
  const sectionRegex = new RegExp(`## ${sectionHeader}[\\s\\S]*?(?=\\n## |$)`);
  const match = content.match(sectionRegex);
  if (!match) return { checked: 0, unchecked: 0, items: [] };

  const items: ChecklistItem[] = [];
  for (const line of match[0].split('\n')) {
    const checkedMatch = line.match(/^- \[x\]\s+(.+)/i);
    const uncheckedMatch = line.match(/^- \[ \]\s+(.+)/);
    if (checkedMatch) items.push({ text: checkedMatch[1], done: true });
    else if (uncheckedMatch) items.push({ text: uncheckedMatch[1], done: false });
  }

  return {
    checked: items.filter((item) => item.done).length,
    unchecked: items.filter((item) => !item.done).length,
    items,
  };
}

/**
 * Extract the Status field value from task file content.
 *
 * @param content Full file content
 * @returns Status string
 */
function extractStatus(content: string): string {
  const match = content.match(/\*\*Status\*\*:\s*(.+)/);
  return match ? match[1].trim() : 'UNKNOWN';
}

/**
 * Determine whether the health check results section has been populated.
 *
 * @param content Full file content
 * @returns True when the section contains meaningful content
 */
function hasHealthResults(content: string): boolean {
  const match = content.match(/## Health Check Results[\s\S]*?(?=\n## |$)/);
  if (!match) return false;
  return match[0].replace(/## Health Check Results/, '').trim().length > 10;
}

async function main(): Promise<void> {
  const taskFile = await findLatestTaskFile();

  if (!taskFile) {
    const noTask: ReconcileResult = {
      complete: false,
      taskFile: null,
      status: 'NO_TASK_FILE',
      sections: {
        dod: { checked: 0, unchecked: 0 },
        milestones: { checked: 0, unchecked: 0 },
        checklist: { checked: 0, unchecked: 0 },
        healthResults: false,
      },
      incomplete: ['No task file found in .ignore/tasks/'],
    };
    console.log(JSON.stringify(noTask, null, 2));
    process.exit(1);
    return;
  }

  const content = await fs.readFile(taskFile, 'utf-8');
  const status = extractStatus(content);
  const relPath = path.relative(ROOT, taskFile).replace(/\\/g, '/');

  const dod = parseChecklistSection(content, 'Definition of Done \\(DoD\\)');
  const milestones = parseChecklistSection(content, 'Milestones');
  const checklist = parseChecklistSection(content, 'Checklist');
  const healthPopulated = hasHealthResults(content);
  const incomplete: string[] = [];

  for (const [sectionName, sectionData] of Object.entries({ dod, milestones, checklist })) {
    for (const item of sectionData.items) {
      if (!item.done) incomplete.push(`[${sectionName}] ${item.text}`);
    }
  }

  if (!healthPopulated) {
    incomplete.push('[health] Health Check Results section is empty — run health check');
  }

  const isComplete = incomplete.length === 0 && status !== 'BLOCKED' && status !== 'FAILED';

  const result: ReconcileResult = {
    complete: isComplete,
    taskFile: relPath,
    status,
    sections: {
      dod: { checked: dod.checked, unchecked: dod.unchecked },
      milestones: { checked: milestones.checked, unchecked: milestones.unchecked },
      checklist: { checked: checklist.checked, unchecked: checklist.unchecked },
      healthResults: healthPopulated,
    },
    incomplete,
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(isComplete ? 0 : 1);
}

main().catch((err: Error) => {
  console.error('\u274c Fatal:', err.message);
  process.exit(1);
});
