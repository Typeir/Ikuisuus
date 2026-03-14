/**
 * JSDoc Quality Check
 *
 * @fileoverview Validates JSDoc compliance against project hard rules:
 * - No inline comments (// ) in function bodies of src/ files
 * - No color literals in TSX files
 * - No alert() calls
 *
 * @module scripts/ci/check-jsdoc-quality
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

const EXCLUDED_PATTERNS = [
  /\.d\.ts$/,
  /\.test\.(ts|tsx)$/,
  /\.stories\.(ts|tsx)$/,
  /node_modules/,
  /\.next/,
  /\.config\.(ts|js)$/,
];

/**
 * Recursively find TypeScript source files
 *
 * @param {string} dir - Directory to scan
 * @param {string[]} results - Accumulator
 * @returns {Promise<string[]>} File paths
 */
async function findSourceFiles(dir, results = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await findSourceFiles(full, results);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      const rel = path.relative(ROOT, full);
      if (!EXCLUDED_PATTERNS.some((p) => p.test(rel))) {
        results.push(rel);
      }
    }
  }
  return results;
}

/**
 * Check a file for inline comments that are logic comments (not URLs, not eslint directives)
 *
 * @param {string} content - File content
 * @param {string} filePath - Relative file path
 * @returns {Array<{line: number, text: string}>} Violations
 */
function findInlineComments(content, filePath) {
  const violations = [];
  const lines = content.split('\n');
  let inJSDoc = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('/**')) inJSDoc = true;
    if (line.includes('*/')) {
      inJSDoc = false;
      continue;
    }
    if (inJSDoc) continue;

    const trimmed = line.trim();
    if (trimmed.startsWith('//') && !isAllowedComment(trimmed)) {
      violations.push({ line: i + 1, text: trimmed });
    }
  }
  return violations;
}

/**
 * Determine if a comment is an allowed exception (eslint directive, type annotation, URL)
 *
 * @param {string} comment - Trimmed comment line
 * @returns {boolean} Whether the comment is exempt
 */
function isAllowedComment(comment) {
  const exemptPatterns = [
    /^\/\/\s*eslint/,
    /^\/\/\s*@ts-/,
    /^\/\/\s*istanbul/,
    /^\/\/\s*vitest/,
    /^\/\/\s*TODO:/,
    /^\/\/\s*FIXME:/,
    /^\/\/\s*HACK:/,
    /^\/\/\s*https?:\/\//,
    /^\/\/\s*noinspection/,
    /^\/\/\s*prettier-ignore/,
    /^\/\/\s*region/,
    /^\/\/\s*endregion/,
  ];
  return exemptPatterns.some((p) => p.test(comment));
}

/**
 * Check for color literals in TSX files
 *
 * @param {string} content - File content
 * @param {string} filePath - Relative file path
 * @returns {Array<{line: number, text: string}>} Violations
 */
function findColorLiterals(content, filePath) {
  if (!filePath.endsWith('.tsx')) return [];
  const violations = [];
  const lines = content.split('\n');
  const colorRegex = /#[0-9a-fA-F]{3,8}\b/;

  for (let i = 0; i < lines.length; i++) {
    if (colorRegex.test(lines[i])) {
      violations.push({ line: i + 1, text: lines[i].trim() });
    }
  }
  return violations;
}

/**
 * Check for alert() calls
 *
 * @param {string} content - File content
 * @returns {Array<{line: number, text: string}>} Violations
 */
function findAlertCalls(content) {
  const violations = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    if (
      /\balert\s*\(/.test(lines[i]) &&
      !lines[i].trim().startsWith('*') &&
      !lines[i].trim().startsWith('//')
    ) {
      violations.push({ line: i + 1, text: lines[i].trim() });
    }
  }
  return violations;
}

async function main() {
  const files = await findSourceFiles(path.join(ROOT, 'src'));
  const failures = [];

  for (const rel of files) {
    const content = await fs.readFile(path.join(ROOT, rel), 'utf-8');
    const normalizedPath = rel.replace(/\\/g, '/');

    const inlineComments = findInlineComments(content, normalizedPath);
    for (const v of inlineComments) {
      failures.push({
        file: normalizedPath,
        line: v.line,
        rule: 'no-inline-comments',
        message: `Inline comment: ${v.text}`,
        suggestion: 'Extract logic to a helper function with JSDoc',
      });
    }

    const colorLiterals = findColorLiterals(content, normalizedPath);
    for (const v of colorLiterals) {
      failures.push({
        file: normalizedPath,
        line: v.line,
        rule: 'no-color-literals',
        message: `Color literal: ${v.text}`,
        suggestion: 'Use CSS variable from globals.scss: var(--color-*)',
      });
    }

    const alertCalls = findAlertCalls(content);
    for (const v of alertCalls) {
      failures.push({
        file: normalizedPath,
        line: v.line,
        rule: 'no-alert-calls',
        message: `alert() call: ${v.text}`,
        suggestion: 'Use NotificationProvider instead',
      });
    }
  }

  const result = {
    check: 'jsdoc-quality',
    severity: failures.length > 0 ? 'critical' : 'info',
    passed: failures.length === 0,
    failures,
    stats: {
      total_files_checked: files.length,
      violations_found: failures.length,
    },
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(failures.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
