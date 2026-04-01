/**
 * Post Tool Use Hook
 *
 * @fileoverview Runs quick hard-rule checks against the edited file and returns
 * additional context to Copilot when violations are detected.
 *
 * @module .github/scripts/hooks/post-tool-use
 */

import { promises as fs } from 'node:fs';
import { resolveEditedFilePath, readHookInput, writeHookOutput } from './hook-runtime';

/**
 * Determine whether a single-line comment is exempt.
 *
 * @param comment Trimmed line
 * @returns True when exempt from the inline comment rule
 */
function isExemptInlineComment(comment: string): boolean {
  return /^\/\/\s*(eslint|@ts-|istanbul|vitest|TODO:|FIXME:|HACK:|https?:\/\/|prettier-ignore|region|endregion|noinspection)/.test(
    comment,
  );
}

/**
 * Build a postToolUse response from detected warnings.
 *
 * @param warnings Rule warnings
 */
function respondWithWarnings(warnings: string[]): void {
  if (warnings.length === 0) {
    writeHookOutput({ continue: true });
    return;
  }

  writeHookOutput({
    continue: true,
    hookSpecificOutput: {
      hookEventName: 'postToolUse',
      additionalContext: `⚠️ Hard rule violations in edited file:\n${warnings.map((value) => `  - ${value}`).join('\n')}\n\nFix these before continuing.`,
    },
  });
}

/**
 * Run quick checks for the edited file path.
 *
 * @param filePath Candidate edited file path
 */
async function runQuickCheck(filePath: string | undefined): Promise<void> {
  if (!filePath || !filePath.match(/\.(ts|tsx|scss|mdx)$/)) {
    respondWithWarnings([]);
    return;
  }

  try {
    await fs.access(filePath);
  } catch {
    respondWithWarnings([]);
    return;
  }

  const content = await fs.readFile(filePath, 'utf-8');
  const warnings: string[] = [];

  if (filePath.endsWith('.tsx') && /#[0-9a-fA-F]{3,8}\b/.test(content)) {
    warnings.push('Color literal found — use CSS variable var(--color-*) instead');
  }

  if (/\balert\s*\(/.test(content)) {
    warnings.push('alert() call found — use NotificationProvider instead');
  }

  if (filePath.endsWith('.mdx')) {
    if (/src=["']\/full-size\//.test(content)) {
      warnings.push('Image references /full-size/ path — use /library/ path instead');
    }
    if (/<img\s/.test(content)) {
      warnings.push('Raw <img> tag — use <Image> or <BlendedImage> component');
    }
    if (/style=["'][^"']*#[0-9a-fA-F]{3,8}/.test(content)) {
      warnings.push('Inline color literal in MDX style attribute — use CSS variables');
    }
    const basename = filePath.replace(/\\/g, '/').split('/').pop() ?? '';
    const normalizedBase = basename.replace(/\.sheet\.mdx$|\.mdx$/, '');
    if (/[A-Z_]/.test(normalizedBase)) {
      warnings.push('MDX filename is not kebab-case — rename to lowercase with hyphens');
    }
    respondWithWarnings(warnings);
    return;
  }

  const lines = content.split('\n');
  let inJSDoc = false;
  for (const line of lines) {
    if (line.includes('/**')) {
      inJSDoc = true;
    }
    if (line.includes('*/')) {
      inJSDoc = false;
      continue;
    }
    if (inJSDoc) {
      continue;
    }
    const trimmed = line.trim();
    if (trimmed.startsWith('//') && !isExemptInlineComment(trimmed)) {
      warnings.push('Inline comment found — extract to helper function with JSDoc');
      break;
    }
  }

  respondWithWarnings(warnings);
}

/**
 * Main hook entrypoint.
 */
async function main(): Promise<void> {
  const hookInput = await readHookInput();
  const filePath = resolveEditedFilePath(hookInput);
  await runQuickCheck(filePath);
}

main().catch(() => {
  writeHookOutput({ continue: true });
});
