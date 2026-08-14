/**
 * @fileoverview Emits a critical finding when code directly modifies protected
 * paw_config keys (e.g. severity_override) via in-code calls or raw SQL.
 *
 * @module .paw/gates/protected-config
 * @author Typeir
 * @version 1.0.0
 * @since 3.1.0
 */

import type {
    GateContext,
    GateFinding,
    GateResult,
    QualityGate,
} from '../../.github/PAW/health-check-types';

/** Config keys that must only be changed via password-protected CLI. */
const PROTECTED_KEYS = ['severity_override'];

/** File extensions to scan. */
const CHECKED_EXTENSIONS = ['.ts', '.tsx', '.mjs', '.js'];

/** Path segments that should be skipped entirely. */
const IGNORE_SEGMENTS = [
  'node_modules',
  '.git',
  'dist',
  '.next',
  'coverage',
  'build',
  '.backup',
  '.github/PAW',
  '.paw',
];

/**
 * Build a regex matching direct assignment to protected paw_config keys.
 * Matches patterns like:
 *   setPawConfig(db, 'severity_override', ...)
 *   setSeverityOverride(db, ...)
 *   setPawConfig( db , "severity_override" , ...
 *   .prepare('INSERT INTO paw_config ... severity_override ...')
 *
 * @returns RegExp matching protected key manipulation
 */
function buildProtectedPattern(): RegExp {
  const keys = PROTECTED_KEYS.join('|');
  return new RegExp(`(${keys})`, 'i');
}

/**
 * Check if a line contains a protected key reference in a write context.
 *
 * @param line - Source line to check
 * @returns The matched key name, or null
 */
function detectProtectedAccess(line: string): string | null {
  const pattern = buildProtectedPattern();
  const match = pattern.exec(line);
  if (!match) return null;

  const trimmed = line.trim();
  const lower = trimmed.toLowerCase();

  /** Must be a write operation, not a read. */
  const isWrite =
    lower.includes('setpawconfig') ||
    lower.includes('setseverityoverride') ||
    lower.includes('insert into paw_config') ||
    lower.includes('update paw_config') ||
    lower.includes('db.exec') ||
    (lower.includes('.run(') && lower.includes('severity_override')) ||
    (lower.includes('.prepare(') && lower.includes('severity_override'));

  if (!isWrite) return null;

  return match[1];
}

/**
 * Check whether a relative file path should be skipped.
 *
 * @param filePath - Relative file path
 * @returns True when the file matches an ignore segment
 */
function shouldSkip(filePath: string): boolean {
  return IGNORE_SEGMENTS.some(
    (seg) => filePath.includes(`/${seg}/`) || filePath.includes(`\\${seg}\\`),
  );
}

export const gate: QualityGate = {
  id: 'protected-config',
  name: 'Protected Config Scanner',
  port: 'code-quality',
  severity: 'critical',
  appliesTo: CHECKED_EXTENSIONS,

  async check(context: GateContext): Promise<GateResult> {
    const start = performance.now();
    const files = await context.targetFiles(this.appliesTo, ['src', 'scripts']);

    const findings: GateFinding[] = [];

    for (const file of files) {
      if (shouldSkip(file)) continue;

      const content = await context.readFile(file);
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = detectProtectedAccess(line);
        if (match) {
          findings.push({
            file,
            line: i + 1,
            rule: `protected-key-${match.toLowerCase()}`,
            message: `Direct modification of protected config key '${match}' detected — use the password-protected CLI instead (e.g. \`npm run paw:severity-override\`).`,
            suggestion: `Remove this code and use \`npm run paw:severity-override set <level>\` from the terminal instead.`,
            severity: 'critical',
          });
        }
      }
    }

    const durationMs = performance.now() - start;

    return {
      gate: this.id,
      passed: findings.length === 0,
      severity: findings.length > 0 ? 'critical' : 'info',
      findings,
      stats: {
        filesChecked: files.length,
        findingsCount: findings.length,
        durationMs,
      },
    };
  },
};
