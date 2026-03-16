/**
 * Anti-Pattern Check
 *
 * @fileoverview Scans source code for common anti-patterns: console.log usage,
 * hardcoded setTimeout without constants, and other problematic patterns.
 *
 * @module .github/scripts/check-antipatterns
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
  /node_modules/,
  /\.next/,
  /scripts\/ci\//,
  /scripts\/core\/logger/,
  /vitest\.config/,
  /vitest\.setup/,
];

/**
 * @typedef {Object} PatternRule
 * @property {string} name - Rule identifier
 * @property {RegExp} pattern - Regex to match
 * @property {string} message - Violation message
 * @property {string} suggestion - Fix suggestion
 * @property {string} severity - critical or warning
 */

/** @type {PatternRule[]} */
const RULES = [
  {
    name: 'console-log',
    pattern: /\bconsole\.log\s*\(/,
    message: 'console.log() found — use logger or remove',
    suggestion:
      'Replace with project logger or remove. console.warn/error are acceptable.',
    severity: 'critical',
  },
  {
    name: 'hardcoded-timeout',
    pattern: /setTimeout\s*\([^,]+,\s*\d{2,}/,
    message: 'Hardcoded setTimeout delay — use named constant',
    suggestion: 'Extract delay to a named constant in a constants file',
    severity: 'warning',
  },
  {
    name: 'any-type',
    pattern: /:\s*any\b/,
    message: 'Explicit `any` type — prefer specific types',
    suggestion: 'Replace with a specific type, generic, or `unknown`',
    severity: 'warning',
  },
  {
    name: 'force-cast',
    pattern: /as\s+any\b/,
    message: 'Force cast to `any` — unsafe type assertion',
    suggestion: 'Use proper type narrowing or type guards instead',
    severity: 'warning',
  },
];

/**
 * Recursively find source files
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

async function main() {
  const files = await findSourceFiles(path.join(ROOT, 'src'));
  const failures = [];
  let criticalCount = 0;

  for (const rel of files) {
    const content = await fs.readFile(path.join(ROOT, rel), 'utf-8');
    const lines = content.split('\n');
    const normalizedPath = rel.replace(/\\/g, '/');

    for (const rule of RULES) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith('*') || line.trim().startsWith('//'))
          continue;
        if (rule.pattern.test(line)) {
          failures.push({
            file: normalizedPath,
            line: i + 1,
            rule: rule.name,
            message: rule.message,
            suggestion: rule.suggestion,
            severity: rule.severity,
          });
          if (rule.severity === 'critical') criticalCount++;
        }
      }
    }
  }

  const result = {
    check: 'antipatterns',
    severity:
      criticalCount > 0 ? 'critical' : failures.length > 0 ? 'warning' : 'info',
    passed: criticalCount === 0,
    failures,
    stats: {
      total_files_checked: files.length,
      violations_found: failures.length,
      critical: criticalCount,
      warnings: failures.length - criticalCount,
    },
  };

  console.log(JSON.stringify(result, null, 2));
  process.exit(criticalCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
