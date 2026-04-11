/**
 * PAW Post Tool Use Hook
 *
 * @fileoverview Runs quick regex-based rule checks against edited files.
 * When violations are found, blocks further processing via decision:'block',
 * writes a single violation ledger to VIOLATIONS_PATH, persists to SQLite,
 * and exits with code 2.
 * When clean, removes the ledger file and resolves SQLite records.
 *
 * Enforcement loop (manifest Part 1):
 *   1. postToolUse detects → writes VIOLATIONS_PATH → exit 2
 *   2. preToolUse reads VIOLATIONS_PATH → denies non-exempt tools
 *   3. Agent fixes file → postToolUse re-checks → deletes VIOLATIONS_PATH
 *   4. preToolUse sees no ledger → allows tools again
 *
 * VS Code contract: PostToolUse output can block with decision:'block'.
 * Exit code 2 = blocking error per chatHooks spec.
 *
 * @module .paw/hooks/post-tool-use
 * @author PAW
 * @version 4.0.0
 * @since 3.0.0
 */

import {
  promises as fs,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import {
  readHookInput,
  resolveEditedFilePath,
  writeHookOutput,
} from '../../.github/PAW/hook-runtime';
import {
  DEFAULT_DB_PATH,
  insertViolation,
  openDb,
  resolveViolations,
} from '../../.github/PAW/paw-db';
import { VIOLATIONS_PATH } from '../../.github/PAW/paw-paths';

const IGNORE_FILE_DIRECTIVE_PATTERN =
  /health:check-ignore-file\s+([a-z0-9*_,\s-]+)/gi;
const WILDCARD_RULE = '*';

/**
 * Determine whether a single-line comment is an exempt tool directive.
 *
 * @param comment - Trimmed line content
 * @returns True when exempt from the inline comment rule
 */
function isExemptComment(comment: string): boolean {
  return /^\/\/\s*(eslint|@ts-|istanbul|vitest|TODO:|FIXME:|HACK:|https?:\/\/|prettier-ignore|region|endregion|noinspection)/.test(
    comment,
  );
}

/**
 * Normalize a rule token from a directive payload.
 *
 * @param token - Raw token text
 * @returns Canonical lowercase rule token
 */
function normalizeRuleToken(token: string): string {
  const normalized = token.trim().toLowerCase();
  if (normalized === 'all') {
    return WILDCARD_RULE;
  }
  return normalized;
}

/**
 * Parse rule names from an ignore-file directive payload.
 *
 * @param rawRules - Raw directive payload
 * @returns Set of normalized rules
 */
function parseRuleList(rawRules: string): Set<string> {
  const rules = new Set<string>();
  const sanitizedRawRules = rawRules.replace(/\s+\*+$/g, '');
  const tokens = sanitizedRawRules
    .split(/[\s,]+/)
    .map(normalizeRuleToken)
    .filter(Boolean);

  if (tokens.length === 0) {
    rules.add(WILDCARD_RULE);
    return rules;
  }

  for (const token of tokens) {
    rules.add(token);
  }

  return rules;
}

/**
 * Determine whether a file-level ignore directive suppresses a rule.
 *
 * @param content - File contents
 * @param rule - Rule identifier
 * @returns True when the rule is ignored for the file
 */
function hasIgnoreFileDirective(content: string, rule: string): boolean {
  const ignoredRules = new Set<string>();
  IGNORE_FILE_DIRECTIVE_PATTERN.lastIndex = 0;

  for (const match of content.matchAll(IGNORE_FILE_DIRECTIVE_PATTERN)) {
    const parsedRules = parseRuleList(match[1] ?? '');
    for (const parsedRule of parsedRules) {
      ignoredRules.add(parsedRule);
    }
  }

  const normalizedRule = normalizeRuleToken(rule);
  return ignoredRules.has(WILDCARD_RULE) || ignoredRules.has(normalizedRule);
}

/**
 * Run quick checks on a TypeScript/TSX file.
 *
 * @param content - File contents
 * @param filePath - Absolute file path
 * @returns Array of warning strings
 */
function checkTsFile(content: string, filePath: string): string[] {
  const warnings: string[] = [];

  if (filePath.endsWith('.tsx') && /#[0-9a-fA-F]{3,8}\b/.test(content)) {
    warnings.push(
      'Color literal found — use CSS variable var(--color-*) instead',
    );
  }

  if (/\balert\s*\(/.test(content)) {
    warnings.push(
      'alert function call found — use NotificationProvider instead',
    );
  }

  const lines = content.split('\n');
  let inJSDoc = false;
  for (const line of lines) {
    if (line.includes('/**')) inJSDoc = true;
    if (line.includes('*/')) {
      inJSDoc = false;
      continue;
    }
    if (inJSDoc) continue;

    const trimmed = line.trim();
    if (trimmed.startsWith('//') && !isExemptComment(trimmed)) {
      warnings.push('Inline comment found — use JSDoc block instead');
      break;
    }
  }

  return warnings;
}

/**
 * Run quick checks on an MDX content file.
 *
 * @param content - File contents
 * @param filePath - Absolute file path
 * @returns Array of warning strings
 */
function checkMdxFile(content: string, filePath: string): string[] {
  const warnings: string[] = [];

  if (/src=["']\/full-size\//.test(content)) {
    warnings.push(
      'Image references /full-size/ path — use /library/ path instead',
    );
  }
  if (/<img\s/.test(content)) {
    warnings.push('Raw <img> tag — use <Image> or <BlendedImage> component');
  }
  if (/style=["'][^"']*#[0-9a-fA-F]{3,8}/.test(content)) {
    warnings.push(
      'Inline color literal in MDX style attribute — use CSS variables',
    );
  }

  const basename = filePath.replace(/\\/g, '/').split('/').pop() ?? '';
  const normalized = basename.replace(/\.sheet\.mdx$|\.mdx$/, '');
  if (/[A-Z_]/.test(normalized)) {
    warnings.push(
      'MDX filename is not kebab-case — rename to lowercase with hyphens',
    );
  }

  return warnings;
}

/**
 * Run quick checks on an SCSS file.
 *
 * @param content - File contents
 * @param filePath - Absolute file path
 * @returns Array of warning strings
 */
function checkScssFile(content: string, filePath: string): string[] {
  const warnings: string[] = [];
  const colorRuleIgnored = hasIgnoreFileDirective(content, 'no-color-literals');

  if (
    !colorRuleIgnored &&
    !filePath.includes('globals.scss') &&
    /#[0-9a-fA-F]{3,8}\b/.test(content)
  ) {
    warnings.push(
      'Color literal found outside globals.scss — use CSS variable',
    );
  }

  return warnings;
}

/**
 * Write violation ledger to VIOLATIONS_PATH and persist to SQLite.
 * Uses atomic write (tmp file + rename) to prevent partial reads by preToolUse.
 *
 * @param filePath - File that was checked
 * @param warnings - Violation strings
 */
function writeViolations(filePath: string, warnings: string[]): void {
  const ledger = {
    file: filePath,
    violations: warnings,
    hookEvent: 'postToolUse',
    timestamp: new Date().toISOString(),
  };
  const tmp = `${VIOLATIONS_PATH}.tmp`;
  writeFileSync(tmp, JSON.stringify(ledger, null, 2), 'utf-8');
  renameSync(tmp, VIOLATIONS_PATH);

  try {
    const db = openDb(DEFAULT_DB_PATH);
    try {
      for (const warning of warnings) {
        insertViolation(db, {
          filePath,
          rule: warning.split(' — ')[0] ?? warning,
          message: warning,
          hookEvent: 'postToolUse',
        });
      }
    } finally {
      db.close();
    }
  } catch {
    /* DB write failure should not block the fast-path enforcement */
  }
}

/**
 * Remove the violation ledger and resolve SQLite records for the given file.
 * Only deletes VIOLATIONS_PATH if the ledger is for the same file being cleared.
 * This prevents editing an unrelated clean file from wiping violations.
 *
 * @param filePath - Absolute path of the file whose violations are resolved
 */
function clearViolations(filePath: string): void {
  try {
    const raw = readFileSync(VIOLATIONS_PATH, 'utf-8');
    const ledger = JSON.parse(raw) as { file?: string };
    const normalize = (p: string) => p.replace(/\\/g, '/').toLowerCase();
    if (normalize(ledger.file ?? '') === normalize(filePath)) {
      unlinkSync(VIOLATIONS_PATH);
    }
  } catch {
    /* ledger may already be absent or unparseable */
  }

  try {
    const db = openDb(DEFAULT_DB_PATH);
    try {
      resolveViolations(db, filePath);
    } finally {
      db.close();
    }
  } catch {
    /* DB failure non-critical for enforcement */
  }
}

/**
 * Emit violation details and block further processing, or emit a clean pass.
 * PostToolUse uses top-level decision:'block' per VS Code spec.
 *
 * @param warnings - Warning strings
 * @param filePath - File that was checked
 */
function respond(warnings: string[], filePath: string): void {
  if (warnings.length === 0) {
    clearViolations(filePath);
    writeHookOutput({ continue: true });
    return;
  }

  writeViolations(filePath, warnings);

  const message = `⚠️ Hard rule violations in edited file:\n${warnings.map((w) => `  - ${w}`).join('\n')}\n\nFix these before continuing.`;

  writeHookOutput({
    continue: true,
    decision: 'block',
    reason: message,
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext: message,
    },
  });
}

/**
 * Main hook entrypoint.
 */
async function main(): Promise<void> {
  const hookInput = await readHookInput();
  const filePath = resolveEditedFilePath(hookInput);

  if (!filePath || !filePath.match(/\.(ts|tsx|scss|mdx)$/)) {
    writeHookOutput({ continue: true });
    return;
  }

  const norm = filePath.replace(/\\/g, '/');
  if (
    norm.includes('/.paw/') ||
    norm.includes('/.github/PAW/') ||
    norm.includes('/.github/scripts/hooks/')
  ) {
    clearViolations(filePath);
    writeHookOutput({ continue: true });
    return;
  }

  try {
    await fs.access(filePath);
  } catch {
    writeHookOutput({ continue: true });
    return;
  }

  const content = await fs.readFile(filePath, 'utf-8');

  if (filePath.endsWith('.mdx')) {
    respond(checkMdxFile(content, filePath), filePath);
  } else if (filePath.endsWith('.scss')) {
    respond(checkScssFile(content, filePath), filePath);
  } else {
    respond(checkTsFile(content, filePath), filePath);
  }
}

main().catch(() => {
  writeHookOutput({ continue: true });
});
