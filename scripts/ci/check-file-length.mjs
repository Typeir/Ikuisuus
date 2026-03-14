/**
 * File Length Check
 *
 * @fileoverview Scans source files for those exceeding 250 lines and reports them
 * as critical findings. Outputs JSON-structured results to stdout.
 *
 * @module scripts/ci/check-file-length
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
 * Load the optional allowlist of files permitted to exceed the threshold
 *
 * @returns {Promise<string[]>} Array of relative paths that are exempt
 */
async function loadAllowlist() {
  try {
    const raw = await fs.readFile(ALLOWLIST_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Recursively find files matching extensions
 *
 * @param {string} dir - Directory to scan
 * @param {string[]} results - Accumulator
 * @returns {Promise<string[]>} Matching file paths
 */
async function findFiles(dir, results = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await findFiles(full, results);
    } else if (/\.(ts|tsx|mjs|js|jsx|scss|css)$/.test(entry.name)) {
      const rel = path.relative(ROOT, full);
      if (!EXCLUDED_PATTERNS.some((p) => p.test(rel))) {
        results.push(rel);
      }
    }
  }
  return results;
}

/**
 * Count lines in a file
 *
 * @param {string} filePath - Absolute path
 * @returns {Promise<number>} Line count
 */
async function countLines(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  return content.split('\n').length;
}

async function main() {
  const allowlist = await loadAllowlist();
  const violations = [];

  for (const dir of SCAN_DIRS) {
    const files = await findFiles(path.join(ROOT, dir));
    for (const rel of files) {
      if (allowlist.includes(rel.replace(/\\/g, '/'))) continue;
      const lines = await countLines(path.join(ROOT, rel));
      if (lines > MAX_LINES) {
        violations.push({
          file: rel.replace(/\\/g, '/'),
          lines,
          threshold: MAX_LINES,
        });
      }
    }
  }

  const result = {
    check: 'file-length',
    severity: violations.length > 0 ? 'critical' : 'info',
    passed: violations.length === 0,
    failures: violations.map((v) => ({
      file: v.file,
      line: v.lines,
      rule: 'max-file-length',
      message: `File has ${v.lines} lines (max ${v.threshold})`,
      suggestion:
        'Split into smaller modules or add to .github/file-length-allowlist.json with justification',
    })),
    stats: { total_files_checked: 0, violations_found: violations.length },
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(violations.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
