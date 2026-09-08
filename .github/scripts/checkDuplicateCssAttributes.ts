/**
 * Detects multi-line declaration values written more than once in SCSS/CSS;
 * reports each repeat as a warning finding.
 *
 * @module .github/scripts/checkDuplicateCssAttributes
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

const EXCLUDED_PATTERNS = [/node_modules/, /\.next/];

/**
 * Smallest value, in characters, worth reporting as a repeat.
 */
const MIN_VALUE_LENGTH = 40;

/**
 * Matches a declaration whose value runs past the end of its line.
 */
const MULTILINE_DECLARATION = /(^|[;{}\n])\s*([-\w]+)\s*:\s*([^;{}]*\n[^;{}]*);/g;

/**
 * A value already held in a variable, or built from one, is not a repeat
 */
const READS_A_VARIABLE = /^\s*[$@]/;

/**
 * One multi-line declaration found in a file.
 *
 * @interface Declaration
 * @property {string} property - Property name
 * @property {string} value - Value, whitespace collapsed
 * @property {number} line - 1-indexed line the declaration starts on
 */
interface Declaration {
  property: string;
  value: string;
  line: number;
}

/**
 * Recursively find SCSS/CSS files under a directory.
 *
 * @param {string} dir - Directory to scan
 * @param {string} [rootDir] - Root for relative path calculation
 * @param {string[]} [results] - Accumulator
 * @returns {Promise<string[]>} Relative file paths
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
 * Reads every multi-line declaration in a stylesheet.
 *
 * @param {string} content - File content
 * @returns {Declaration[]} Declarations, in source order
 */
export function extractMultilineDeclarations(content: string): Declaration[] {
  const found: Declaration[] = [];
  const pattern = new RegExp(MULTILINE_DECLARATION.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    const raw = match[3];
    if (READS_A_VARIABLE.test(raw)) continue;

    const value = raw.trim().replace(/\s+/g, ' ');
    if (value.length < MIN_VALUE_LENGTH) continue;

    found.push({
      property: match[2],
      value,
      line: content.slice(0, match.index).split('\n').length,
    });
  }

  return found;
}

/**
 * Execute the duplicate-css-attributes check and return a structured result.
 *
 * @param {CheckOptions} [options] - Optional execution context from PAW gates
 * @returns {Promise<CheckResult>} Check result with any violations
 */
export async function runCheck(options?: CheckOptions): Promise<CheckResult> {
  const rootDir = options?.rootDir ?? ROOT;
  const readFile =
    options?.readFile ??
    ((rel: string) => fs.readFile(path.join(rootDir, rel), 'utf-8'));
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

  let checked = 0;
  for (const rel of files) {
    const content = await readFile(rel);
    const normalizedRel = rel.replace(/\\/g, '/');
    const seen = new Map<string, number>();

    for (const declaration of extractMultilineDeclarations(content)) {
      checked += 1;
      const first = seen.get(declaration.value);
      if (first === undefined) {
        seen.set(declaration.value, declaration.line);
        continue;
      }
      violations.push({
        file: normalizedRel,
        line: declaration.line,
        rule: 'duplicate-css-attributes',
        message: `"${declaration.property}" repeats the multi-line value written on line ${first}`,
        suggestion:
          'Hold the value in one SCSS variable or mixin and read it from both places',
        severity: 'warning',
      });
    }
  }

  return {
    check: 'duplicate-css-attributes',
    severity: violations.length > 0 ? 'warning' : 'info',
    passed: violations.length === 0,
    failures: violations,
    stats: {
      total_declarations_checked: checked,
      violations_found: violations.length,
    },
  };
}

/**
 * Standalone entry point.
 *
 * @returns {Promise<void>} Resolves once the result is printed
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
    console.error('❌ Fatal:', err.message);
    process.exit(1);
  });
}
