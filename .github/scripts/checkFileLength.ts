/**
 * File Length Check
 *
 * @fileoverview Scans source files for those exceeding configured line-count
 * thresholds and reports them as critical findings. Thresholds are resolved
 * via a priority chain: per-file allowlist → per-extension default → hard
 * default (250). Outputs JSON-structured results to stdout.
 *
 * @module .github/scripts/check-file-length
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CheckOptions, CheckResult } from './health-check-types';

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

const ALLOWLIST_PATH = path.join(ROOT, '.paw', 'file-length-allowlist.json');
const FILE_SIZE_DEFAULTS_PATH = path.join(
  ROOT,
  '.paw',
  'file-size-defaults.json',
);

/**
 * One allowlisted file with a custom line-count cap.
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
 * One extension with a default line-count cap.
 *
 * @interface ExtensionDefault
 * @property {string} extension - File extension including leading dot (e.g. ".scss")
 * @property {number} maxLines - Custom maximum comment-pruned line count for this extension
 * @property {string} justification - Human-readable reason for the extension-specific cap
 */
interface ExtensionDefault {
  extension: string;
  maxLines: number;
  justification: string;
}

/**
 * Load the optional allowlist of files permitted to exceed the threshold.
 *
 * @param {string} [allowlistPath] - Path to the allowlist JSON file
 * @returns Map of relative path → custom max lines for each allowlisted file
 */
async function loadAllowlist(
  allowlistPath?: string,
): Promise<Map<string, number>> {
  try {
    const raw = await fs.readFile(allowlistPath ?? ALLOWLIST_PATH, 'utf-8');
    const entries = JSON.parse(raw) as AllowlistEntry[];
    return new Map(entries.map((e) => [e.file, e.maxLines]));
  } catch {
    return new Map();
  }
}

/**
 * Load per-extension default line-count caps from the file-size-defaults
 * config. Falls back to an empty map if the file is missing or malformed.
 *
 * @param {string} [defaultsPath] - Path to the file-size-defaults JSON file
 * @returns Map of extension (with leading dot) → custom max lines
 */
async function loadExtensionDefaults(
  defaultsPath?: string,
): Promise<Map<string, number>> {
  try {
    const raw = await fs.readFile(
      defaultsPath ?? FILE_SIZE_DEFAULTS_PATH,
      'utf-8',
    );
    const entries = JSON.parse(raw) as ExtensionDefault[];
    return new Map(entries.map((e) => [e.extension, e.maxLines]));
  } catch {
    return new Map();
  }
}

/**
 * Resolve the line-count threshold for a single file using the priority
 * chain: per-file allowlist → per-extension default → hard default.
 *
 * @param {string} filePath - Normalized relative file path
 * @param {Map<string, number>} allowlist - Per-file overrides
 * @param {Map<string, number>} extensionDefaults - Per-extension overrides
 * @returns Effective max line count for this file
 */
function resolveThreshold(
  filePath: string,
  allowlist: Map<string, number>,
  extensionDefaults: Map<string, number>,
): number {
  const allowlisted = allowlist.get(filePath);
  if (allowlisted !== undefined) return allowlisted;
  const ext = path.extname(filePath);
  if (ext) {
    const extDefault = extensionDefaults.get(ext);
    if (extDefault !== undefined) return extDefault;
  }
  return MAX_LINES;
}

/**
 * Recursively find source files matching allowed extensions.
 *
 * @param {string} dir Directory to scan
 * @param {string} rootDir Root directory for relative path calculation
 * @param {string[]} results Accumulator
 * @returns Matching relative file paths
 */
async function findFiles(
  dir: string,
  rootDir?: string,
  results: string[] = [],
): Promise<string[]> {
  const root = rootDir ?? ROOT;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await findFiles(full, root, results);
    } else if (/\.(ts|tsx|mjs|js|jsx|scss|css)$/.test(entry.name)) {
      const rel = path.relative(root, full);
      if (!EXCLUDED_PATTERNS.some((pattern) => pattern.test(rel))) {
        results.push(rel);
      }
    }
  }
  return results;
}

/**
 * Count effective (non-blank, non-comment) lines from file content.
 *
 * @param content File content string
 * @returns Effective line count
 */
function countLinesFromContent(content: string): number {
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
 * When options.files is provided, uses those instead of self-discovering.
 * When options.readFile is provided, uses that instead of fs.readFile.
 *
 * @param {CheckOptions} [options] - Optional execution context from PAW gates
 * @returns Check result with any violations
 */
export async function runCheck(options?: CheckOptions): Promise<CheckResult> {
  const rootDir = options?.rootDir ?? ROOT;
  const allowlistPath = path.join(
    rootDir,
    '.paw',
    'file-length-allowlist.json',
  );
  const readFile =
    options?.readFile ??
    ((rel: string) => fs.readFile(path.join(rootDir, rel), 'utf-8'));
  const allowlist = await loadAllowlist(allowlistPath);
  const extensionDefaults = await loadExtensionDefaults(
    path.join(rootDir, '.paw', 'file-size-defaults.json'),
  );
  const violations: Array<{ file: string; lines: number; threshold: number }> =
    [];
  let totalFilesChecked = 0;

  let files: string[];
  if (options?.files) {
    files = options.files;
  } else {
    files = [];
    for (const dir of SCAN_DIRS) {
      files.push(...(await findFiles(path.join(rootDir, dir), rootDir)));
    }
  }

  for (const rel of files) {
    const normalized = rel.replace(/\\/g, '/');
    if (!options?.files && EXCLUDED_PATTERNS.some((p) => p.test(normalized)))
      continue;
    const threshold = resolveThreshold(
      normalized,
      allowlist,
      extensionDefaults,
    );
    totalFilesChecked += 1;
    const content = await readFile(normalized);
    const lines = countLinesFromContent(content);
    if (lines > threshold) {
      violations.push({ file: normalized, lines, threshold });
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
      message: `File too long: ${v.lines} code lines (max ${v.threshold}, comments excluded). Extract code into new sibling module. Deleting comments WON'T help.`,
      suggestion: 'Move helpers/factories/math to new file. Import them back.',
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

if (
  path.normalize(process.argv[1] ?? '') ===
  path.normalize(fileURLToPath(import.meta.url))
) {
  main().catch((err: Error) => {
    console.error('\u274c Fatal:', err.message);
    process.exit(1);
  });
}
