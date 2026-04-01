/**
 * JSDoc Quality Check
 *
 * @fileoverview Validates JSDoc compliance against project hard rules:
 * inline comments in function bodies, color literals in TSX, and alert() calls.
 *
 * @module .github/scripts/check-jsdoc-quality
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CheckFailure, CheckResult } from './health-check-types';

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
 * Recursively find TypeScript source files under a directory.
 *
 * @param dir Directory to scan
 * @param results Accumulator
 * @returns Relative file paths
 */
async function findSourceFiles(dir: string, results: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await findSourceFiles(full, results);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      const rel = path.relative(ROOT, full);
      if (!EXCLUDED_PATTERNS.some((pattern) => pattern.test(rel))) {
        results.push(rel);
      }
    }
  }
  return results;
}

/**
 * Determine if a comment line is an allowed exemption.
 *
 * @param comment Trimmed source line
 * @returns True when the comment is exempt from the no-inline-comments rule
 */
function isAllowedComment(comment: string): boolean {
  return [
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
  ].some((pattern) => pattern.test(comment));
}

/**
 * Find inline logic comments in a source file.
 *
 * @param content File content
 * @returns Violations with line numbers
 */
function findInlineComments(content: string): Array<{ line: number; text: string }> {
  const violations: Array<{ line: number; text: string }> = [];
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
 * Find hex color literals in a TSX file.
 *
 * @param content File content
 * @param filePath Relative file path
 * @returns Violations with line numbers
 */
function findColorLiterals(content: string, filePath: string): Array<{ line: number; text: string }> {
  if (!filePath.endsWith('.tsx')) return [];
  const colorRegex = /#[0-9a-fA-F]{3,8}\b/;
  return content
    .split('\n')
    .map((lineText, i) => ({ lineText, i }))
    .filter(({ lineText }) => colorRegex.test(lineText))
    .map(({ lineText, i }) => ({ line: i + 1, text: lineText.trim() }));
}

/**
 * Find alert() calls in a source file.
 *
 * @param content File content
 * @returns Violations with line numbers
 */
function findAlertCalls(content: string): Array<{ line: number; text: string }> {
  return content
    .split('\n')
    .map((lineText, i) => ({ lineText, i }))
    .filter(({ lineText }) => {
      const trimmed = lineText.trim();
      return /\balert\s*\(/.test(lineText) && !trimmed.startsWith('*') && !trimmed.startsWith('//');
    })
    .map(({ lineText, i }) => ({ line: i + 1, text: lineText.trim() }));
}

/**
 * Execute the jsdoc-quality check and return a structured result.
 *
 * @returns Check result with any violations
 */
export async function runCheck(): Promise<CheckResult> {
  const files = await findSourceFiles(path.join(ROOT, 'src'));
  const failures: CheckFailure[] = [];

  for (const rel of files) {
    const content = await fs.readFile(path.join(ROOT, rel), 'utf-8');
    const normalizedPath = rel.replace(/\\/g, '/');

    for (const v of findInlineComments(content)) {
      failures.push({
        file: normalizedPath,
        line: v.line,
        rule: 'no-inline-comments',
        message: `Inline comment: ${v.text}`,
        suggestion: 'Extract logic to a helper function with JSDoc',
      });
    }

    for (const v of findColorLiterals(content, normalizedPath)) {
      failures.push({
        file: normalizedPath,
        line: v.line,
        rule: 'no-color-literals',
        message: `Color literal: ${v.text}`,
        suggestion: 'Use CSS variable from globals.scss: var(--color-*)',
      });
    }

    for (const v of findAlertCalls(content)) {
      failures.push({
        file: normalizedPath,
        line: v.line,
        rule: 'no-alert-calls',
        message: `alert() call: ${v.text}`,
        suggestion: 'Use NotificationProvider instead',
      });
    }
  }

  return {
    check: 'jsdoc-quality',
    severity: failures.length > 0 ? 'critical' : 'info',
    passed: failures.length === 0,
    failures,
    stats: {
      total_files_checked: files.length,
      violations_found: failures.length,
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
