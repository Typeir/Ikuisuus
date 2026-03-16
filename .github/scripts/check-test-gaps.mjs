/**
 * Test Gaps Check
 *
 * @fileoverview Verifies that changed source files (compared to git HEAD) have
 * corresponding test files. Falls back to full src/ scan if git is unavailable.
 *
 * @module .github/scripts/check-test-gaps
 */

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

const EXCLUDED_PATTERNS = [
  /\.d\.ts$/,
  /\.config\.(ts|js)$/,
  /\/index\.(ts|tsx)$/,
  /\.module\.(scss|css)$/,
  /\.stories\.(ts|tsx)$/,
  /\.test\.(ts|tsx)$/,
];

/**
 * Get list of changed source files from git diff
 *
 * @returns {string[]} Relative paths of changed files in src/
 */
function getChangedFiles() {
  try {
    const output = execSync('git diff --name-only HEAD -- src/', {
      cwd: ROOT,
      encoding: 'utf-8',
    });
    const staged = execSync('git diff --cached --name-only -- src/', {
      cwd: ROOT,
      encoding: 'utf-8',
    });
    const combined = new Set([
      ...output.split('\n').filter(Boolean),
      ...staged.split('\n').filter(Boolean),
    ]);
    return [...combined].filter((f) => /\.(ts|tsx)$/.test(f));
  } catch {
    return [];
  }
}

/**
 * Check if a test file exists for a source file
 *
 * @param {string} sourcePath - Relative source file path (e.g. src/lib/utils/foo.ts)
 * @returns {Promise<boolean>} Whether a test file exists
 */
async function hasTestFile(sourcePath) {
  const ext = path.extname(sourcePath);
  const baseName = sourcePath.replace(/\.(ts|tsx)$/, '');

  const possiblePaths = [
    path.join(ROOT, 'tests', 'unit', `${baseName}.test${ext}`),
    path.join(ROOT, 'tests', 'integration', `${baseName}.test${ext}`),
  ];

  for (const p of possiblePaths) {
    try {
      await fs.access(p);
      return true;
    } catch {
      continue;
    }
  }
  return false;
}

async function main() {
  let filesToCheck = getChangedFiles();

  if (filesToCheck.length === 0) {
    console.log(
      'No changed source files detected via git. Scanning all src/ files...',
    );
    filesToCheck = await findAllSourceFiles(path.join(ROOT, 'src'));
  }

  filesToCheck = filesToCheck.filter(
    (f) => !EXCLUDED_PATTERNS.some((p) => p.test(f)),
  );

  const failures = [];

  for (const file of filesToCheck) {
    const hasTest = await hasTestFile(file);
    if (!hasTest) {
      const normalizedPath = file.replace(/\\/g, '/');
      failures.push({
        file: normalizedPath,
        rule: 'missing-test',
        message: `No test file found for ${normalizedPath}`,
        suggestion: `Create tests/unit/${normalizedPath.replace(/\.(ts|tsx)$/, '.test.$1')}`,
      });
    }
  }

  const result = {
    check: 'test-gaps',
    severity: failures.length > 0 ? 'critical' : 'info',
    passed: failures.length === 0,
    failures,
    stats: {
      total_files_checked: filesToCheck.length,
      violations_found: failures.length,
    },
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(failures.length > 0 ? 1 : 0);
}

/**
 * Recursively find all source files in src/
 *
 * @param {string} dir - Directory to scan
 * @param {string[]} results - Accumulator
 * @returns {Promise<string[]>} Relative file paths
 */
async function findAllSourceFiles(dir, results = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await findAllSourceFiles(full, results);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      results.push(path.relative(ROOT, full));
    }
  }
  return results;
}

main().catch((err) => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
