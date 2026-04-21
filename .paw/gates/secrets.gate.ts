/**
 * Secrets Gate
 *
 * @fileoverview Scans files for restricted string patterns (encoded in
 * .github/PAW/git-hooks/.patterns). Blocks commits and agent edits that would
 * introduce sensitive content. Ported from the former Husky pre-commit
 * security scanner.
 *
 * @module .paw/gates/secrets
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
    GateContext,
    GateFinding,
    GateResult,
    GateStats,
    QualityGate,
} from '../../.github/PAW/health-check-types';

/**
 * File extensions to scan for restricted patterns.
 * Mirrors the original pre-commit.ts CHECKED_EXTENSIONS list.
 */
const CHECKED_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.mdx',
  '.env',
  '.env.local',
  '.env.production',
  '.yml',
  '.yaml',
  '.toml',
  '.npmrc',
  '.gitignore',
  '.gitattributes',
  '.vercelignore',
  '.ps1',
  '.sh',
];

/**
 * Path segments that should be skipped entirely.
 */
const IGNORE_SEGMENTS = [
  'node_modules',
  '.git',
  'dist',
  '.next',
  'coverage',
  'build',
  '.backup',
  'scripts/hooks',
];

/**
 * Loads and decodes base64-encoded restricted patterns from the .patterns file.
 *
 * @param {string} rootDir - Absolute path to the project root
 * @returns {string[]} Decoded pattern strings
 */
function loadPatterns(rootDir: string): string[] {
  const patternsFile = join(rootDir, '.paw', 'git-hooks', '.patterns');
  try {
    const content = readFileSync(patternsFile, 'utf-8');
    return content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((encoded) => Buffer.from(encoded, 'base64').toString('utf-8'));
  } catch {
    return [];
  }
}

/**
 * Checks whether a relative file path should be skipped.
 *
 * @param {string} filePath - Relative file path
 * @returns {boolean} True when the file matches an ignore segment
 */
function shouldSkip(filePath: string): boolean {
  return IGNORE_SEGMENTS.some(
    (seg) => filePath.includes(`/${seg}/`) || filePath.includes(`\\${seg}\\`),
  );
}

export const gate: QualityGate = {
  id: 'secrets',
  name: 'Secrets Scanner',
  port: 'code-quality',
  severity: 'critical',
  appliesTo: CHECKED_EXTENSIONS,

  async check(context: GateContext): Promise<GateResult> {
    const start = performance.now();
    const files = await context.targetFiles(this.appliesTo, [
      'src',
      'scripts',
      'messages',
    ]);

    const patterns = loadPatterns(context.rootDir);
    const findings: GateFinding[] = [];

    for (const file of files) {
      if (shouldSkip(file)) continue;

      const content = await context.readFile(file);
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const pattern of patterns) {
          const regex = new RegExp(
            `\\b${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
            'i',
          );
          if (regex.test(line)) {
            findings.push({
              file,
              line: i + 1,
              rule: 'restricted-pattern',
              message: `File contains a restricted pattern`,
              suggestion:
                'Review and remove sensitive content before committing',
              severity: 'critical',
            });
            break;
          }
        }
      }
    }

    const durationMs = Math.round(performance.now() - start);
    const stats: GateStats = {
      filesChecked: files.length,
      findingsCount: findings.length,
      durationMs,
    };

    return {
      gate: this.id,
      passed: findings.length === 0,
      severity: findings.length > 0 ? 'critical' : 'info',
      findings,
      stats,
    };
  },
};
