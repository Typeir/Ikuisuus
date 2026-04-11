/**
 * Duplicate CSS Check
 *
 * @fileoverview Detects duplicate CSS selectors and property blocks across SCSS/CSS
 * files. Reports exact duplicates as critical findings.
 *
 * Excluded from duplicate detection:
 * - `@keyframes` stop selectors (`from`, `to`, `0%`, `100%` etc.) — identical stops
 *   legitimately appear across unrelated animations
 * - Selectors that contain semicolons — these are parsing artefacts produced by the
 *   naive regex when encountering deeply-nested SCSS blocks (the text before an inner
 *   `{` includes partial CSS properties from the parent rule)
 *
 * @module .github/scripts/check-duplicate-css
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  CheckFailure,
  CheckOptions,
  CheckResult,
} from './health-check-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

const SCAN_DIRS = ['src'];

const EXCLUDED_PATTERNS = [
  /node_modules/,
  /\.next/,
  /globals\.scss$/,
  /\/_mixins/,
];

/**
 * Recursively find SCSS/CSS files under a directory.
 *
 * @param {string} dir Directory to scan
 * @param {string} rootDir Root for relative path calculation
 * @param {string[]} results Accumulator
 * @returns Relative file paths
 */
async function findStyleFiles(
  dir: string,
  rootDir?: string,
  results: string[] = [],
): Promise<string[]> {
  const root = rootDir ?? ROOT;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await findStyleFiles(full, root, results);
    } else if (/\.(scss|css)$/.test(entry.name)) {
      const rel = path.relative(root, full);
      if (!EXCLUDED_PATTERNS.some((pattern) => pattern.test(rel))) {
        results.push(rel);
      }
    }
  }
  return results;
}

/**
 * Patterns that identify selectors which should be excluded from duplicate detection.
 *
 * Keyframe stop selectors (`from`, `to`, `0%`, `50%`, `100%` etc.) legitimately
 * appear identical across unrelated `@keyframes` blocks — they are not true
 * duplicates. Selectors containing semicolons are parsing artefacts produced by
 * the naive regex when it encounters deeply-nested SCSS blocks; they represent
 * partial property text, not real CSS selectors. CSS-module-scoped class
 * selectors (starting with `.`) that are simple (no nesting indicators) are
 * excluded from cross-file comparison because `.module.scss` files are locally
 * scoped by the build tool.
 */
const KEYFRAME_STOP_RE = /^(from|to|\d+(\.\d+)?%)$/;

/**
 * Return true when a parsed selector should be skipped for duplicate detection.
 *
 * @param selector Trimmed, whitespace-collapsed selector string
 * @returns Whether the selector should be excluded
 */
function isExcludedSelector(selector: string): boolean {
  if (KEYFRAME_STOP_RE.test(selector)) {
    return true;
  }
  if (selector.includes(';')) {
    return true;
  }
  return false;
}

/**
 * Extract a selector-to-property-bodies map from CSS/SCSS source.
 *
 * @param content File content
 * @returns Map of CSS selector to list of property block strings
 */
function extractSelectors(content: string): Map<string, string[]> {
  const selectorMap = new Map<string, string[]>();
  const ruleRegex = /([^{}]+)\{([^{}]+)\}/g;
  let match: RegExpExecArray | null;
  while ((match = ruleRegex.exec(content)) !== null) {
    const selector = match[1].trim().replace(/\s+/g, ' ');
    const body = match[2].trim();
    if (isExcludedSelector(selector)) {
      continue;
    }
    if (!selectorMap.has(selector)) {
      selectorMap.set(selector, []);
    }
    selectorMap.get(selector)!.push(body);
  }
  return selectorMap;
}

/**
 * Normalize a CSS property block string for stable comparison.
 *
 * @param body Raw property block text
 * @returns Sorted, trimmed property string
 */
function normalizeProperties(body: string): string {
  return body
    .split(';')
    .map((prop) => prop.trim())
    .filter(Boolean)
    .sort()
    .join('; ');
}

/**
 * Execute the duplicate-css check and return a structured result.
 * When options.files is provided, uses those instead of self-discovering.
 * When options.readFile is provided, uses that instead of fs.readFile.
 *
 * @param {CheckOptions} [options] - Optional execution context from PAW gates
 * @returns Check result with any violations
 */
export async function runCheck(options?: CheckOptions): Promise<CheckResult> {
  const rootDir = options?.rootDir ?? ROOT;
  const readFile =
    options?.readFile ??
    ((rel: string) => fs.readFile(path.join(rootDir, rel), 'utf-8'));
  const seenRules = new Map<string, string>();
  const violations: CheckFailure[] = [];

  let files: string[];
  if (options?.files) {
    files = options.files;
  } else {
    files = [];
    for (const dir of SCAN_DIRS) {
      files.push(...(await findStyleFiles(path.join(rootDir, dir), rootDir)));
    }
  }

  for (const rel of files) {
    const content = await readFile(rel);
    const normalizedRel = rel.replace(/\\/g, '/');
    const selectors = extractSelectors(content);
    for (const [selector, bodies] of selectors) {
      for (const body of bodies) {
        const normalized = normalizeProperties(body);
        const key = `${selector} { ${normalized} }`;
        if (seenRules.has(key)) {
          violations.push({
            file: normalizedRel,
            rule: 'duplicate-css',
            message: `Duplicate rule "${selector}" also found in ${seenRules.get(key)}`,
            suggestion:
              'Extract shared styles to a common mixin or shared class',
            severity: 'critical',
          });
        } else {
          seenRules.set(key, normalizedRel);
        }
      }
    }
  }

  return {
    check: 'duplicate-css',
    severity: violations.length > 0 ? 'critical' : 'info',
    passed: violations.length === 0,
    failures: violations,
    stats: {
      total_selectors_checked: seenRules.size,
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

if (
  path.normalize(process.argv[1] ?? '') ===
  path.normalize(fileURLToPath(import.meta.url))
) {
  main().catch((err: Error) => {
    console.error('\u274c Fatal:', err.message);
    process.exit(1);
  });
}
