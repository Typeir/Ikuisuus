/**
 * Anti-Pattern Check
 *
 * @fileoverview Scans source code for common anti-patterns: console.log usage,
 * hardcoded setTimeout delays, explicit any types, and unsafe any casts.
 *
 * @module .github/scripts/check-antipatterns
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
  /node_modules/,
  /\.next/,
  /scripts\/ci\//,
  /scripts\/core\/logger/,
  /vitest\.config/,
  /vitest\.setup/,
];

/**
 * A single anti-pattern rule definition.
 */
interface PatternRule {
  /** Rule identifier */
  name: string;
  /** Pattern to search for per line */
  pattern: RegExp;
  /** Violation message */
  message: string;
  /** Fix suggestion */
  suggestion: string;
  /** Rule severity level */
  severity: 'critical' | 'warning';
}

const RULES: PatternRule[] = [
  {
    name: 'console-log',
    pattern: /\bconsole\.log\s*\(/,
    message: 'console.log() found — use logger or remove',
    suggestion: 'Replace with project logger or remove. console.warn/error are acceptable.',
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
 * Execute the antipatterns check and return a structured result.
 *
 * @returns Check result with any violations
 */
export async function runCheck(): Promise<CheckResult> {
  const files = await findSourceFiles(path.join(ROOT, 'src'));
  const failures: CheckFailure[] = [];
  let criticalCount = 0;

  for (const rel of files) {
    const content = await fs.readFile(path.join(ROOT, rel), 'utf-8');
    const lines = content.split('\n');
    const normalizedPath = rel.replace(/\\/g, '/');

    for (const rule of RULES) {
      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i];
        const trimmed = lineText.trim();
        if (trimmed.startsWith('*') || trimmed.startsWith('//')) continue;
        if (rule.pattern.test(lineText)) {
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

  return {
    check: 'antipatterns',
    severity: criticalCount > 0 ? 'critical' : failures.length > 0 ? 'warning' : 'info',
    passed: criticalCount === 0,
    failures,
    stats: {
      total_files_checked: files.length,
      violations_found: failures.length,
      critical: criticalCount,
      warnings: failures.length - criticalCount,
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
