/**
 * File Length Check
 *
 * @fileoverview Scans source files for those exceeding 250 lines and reports them
 * as critical findings. Outputs JSON-structured results to stdout.
 *
 * @module .github/scripts/check-file-length
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CheckResult } from './health-check-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

const MAX_LINES = 250;
const SCAN_DIRS = ['src'];

const EXCLUDED_PATTERNS = [
  /\.d\.ts$/,
  /\.test\.(ts|tsx)$/,
  /\.stories\.(ts|tsx)$/,
  /node_modules/,
  /\.next/,
  /globals\.scss$/,
];

const ALLOWLIST_PATH = path.join(ROOT, '.github', 'file-length-allowlist.json');

/**
 * A single allowlist entry that grants an individual file a custom line-count cap.
 *
 * @interface AllowlistEntry
 * @property {string} file - Relative file path (forward-slash separated)
 * @property {number} maxLines - Custom maximum comment-pruned line count for this file
 * @property {string} justification - Human-readable reason the file is allowlisted
 */
interface AllowlistEntry {
  file: string;
  maxLines: number;
  justification: string;
}

/**
 * Load the optional allowlist of files permitted to exceed the threshold.
 *
 * @returns Map of relative path → custom max lines for each allowlisted file
 */
async function loadAllowlist(): Promise<Map<string, number>> {
  try {
    const raw = await fs.readFile(ALLOWLIST_PATH, 'utf-8');
    const entries = JSON.parse(raw) as AllowlistEntry[];
    return new Map(entries.map((e) => [e.file, e.maxLines]));
  } catch {
    return new Map();
  }
}

/**
 * Recursively find source files matching allowed extensions.
 *
 * @param dir Directory to scan
 * @param results Accumulator
 * @returns Matching relative file paths
 */
async function findFiles(dir: string, results: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await findFiles(full, results);
    } else if (/\.(ts|tsx|mjs|js|jsx|scss|css)$/.test(entry.name)) {
      const rel = path.relative(ROOT, full);
      if (!EXCLUDED_PATTERNS.some((pattern) => pattern.test(rel))) {
        results.push(rel);
      }
    }
  }
  return results;
}

/**
 * Count effective (non-blank, non-comment) lines in a file.
 *
 * @param filePath Absolute file path
 * @returns Effective line count
 */
async function countLines(filePath: string): Promise<number> {
  const content = await fs.readFile(filePath, 'utf-8');
  const withoutBlockComments = content.replace(/\/\*[\s\S]*?\*\//g, '');
  const lines = withoutBlockComments.split('\n');
  let count = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    if (trimmed.startsWith('//')) continue;
    count += 1;
  }
  return count;
}

/**
 * Execute the file-length check and return a structured result.
 *
 * @returns Check result with any violations
 */
export async function runCheck(): Promise<CheckResult> {
  const allowlist = await loadAllowlist();
  const violations: Array<{ file: string; lines: number; threshold: number }> = [];
  let totalFilesChecked = 0;

  for (const dir of SCAN_DIRS) {
    const files = await findFiles(path.join(ROOT, dir));
    for (const rel of files) {
      const normalized = rel.replace(/\\/g, '/');
      const threshold = allowlist.get(normalized) ?? MAX_LINES;
      totalFilesChecked += 1;
      const lines = await countLines(path.join(ROOT, rel));
      if (lines > threshold) {
        violations.push({ file: rel, lines, threshold });
      }
    }
  }

  return {
    check: 'file-length',
    severity: violations.length > 0 ? 'critical' : 'info',
    passed: violations.length === 0,
    failures: violations.map((v) => ({
      file: v.file.replace(/\\/g, '/'),
      line: v.lines,
      rule: 'max-file-length',
      message: `File has ${v.lines} comment-pruned lines (max ${v.threshold})`,
      suggestion: 'Split into smaller modules or add to .github/file-length-allowlist.json with justification',
    })),
    stats: {
      total_files_checked: totalFilesChecked,
      violations_found: violations.length,
    },
  };
}

/**
 * Standalone entry point.
 */
async function main(): Promise<void> {
  const result = await runCheck();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.passed ? 0 : 1);
}

if (path.normalize(process.argv[1] ?? '') === path.normalize(fileURLToPath(import.meta.url))) {
  main().catch((err: Error) => {
    console.error('\u274c Fatal:', err.message);
    process.exit(1);
  });
}
