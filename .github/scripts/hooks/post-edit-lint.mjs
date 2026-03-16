/**
 * Post-Edit Lint Hook
 *
 * @fileoverview Quick lint check run after every file edit/create by Copilot.
 * Checks for hard-rule violations (color literals, inline comments, alert calls)
 * in the edited file only. Returns additionalContext to help the model self-correct.
 *
 * @module .github/scripts/hooks/post-edit-lint
 */

import { promises as fs } from 'fs';

const filePath = process.argv[2];

/**
 * Quick-check a single file for hard-rule violations
 *
 * @param {string} absPath - Absolute file path
 * @returns {Promise<Object>} Hook result with additionalContext
 */
async function quickCheck(absPath) {
  if (!absPath || !absPath.match(/\.(ts|tsx|scss|mdx)$/)) {
    return output(true, []);
  }

  try {
    await fs.access(absPath);
  } catch {
    return output(true, []);
  }

  const content = await fs.readFile(absPath, 'utf-8');
  const warnings = [];

  if (absPath.endsWith('.tsx') && /#[0-9a-fA-F]{3,8}\b/.test(content)) {
    warnings.push(
      'Color literal found — use CSS variable var(--color-*) instead',
    );
  }

  if (/\balert\s*\(/.test(content)) {
    warnings.push('alert() call found — use NotificationProvider instead');
  }

  if (absPath.endsWith('.mdx')) {
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
    const basename = absPath.replace(/\\/g, '/').split('/').pop();
    if (/[A-Z_]/.test(basename.replace(/\.sheet\.mdx$|\.mdx$/, ''))) {
      warnings.push(
        'MDX filename is not kebab-case — rename to lowercase with hyphens',
      );
    }
    return output(warnings.length === 0, warnings);
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
    if (trimmed.startsWith('//') && !isExempt(trimmed)) {
      warnings.push(
        'Inline comment found — extract to helper function with JSDoc',
      );
      break;
    }
  }

  return output(warnings.length === 0, warnings);
}

/**
 * Check if a comment is exempt from the inline comments rule
 *
 * @param {string} comment - Trimmed line
 * @returns {boolean} Whether exempt
 */
function isExempt(comment) {
  return /^\/\/\s*(eslint|@ts-|istanbul|vitest|TODO:|FIXME:|HACK:|https?:\/\/|prettier-ignore|region|endregion|noinspection)/.test(
    comment,
  );
}

/**
 * Format hook output as JSON per VS Code PostToolUse hook protocol
 *
 * @param {boolean} passed - Whether the check passed
 * @param {string[]} warnings - List of warning messages
 * @returns {Object} Hook result
 */
function output(passed, warnings) {
  const result = {
    continue: true,
  };

  if (warnings.length > 0) {
    result.hookSpecificOutput = {
      hookEventName: 'PostToolUse',
      additionalContext: `⚠️ Hard rule violations in edited file:\n${warnings.map((w) => `  - ${w}`).join('\n')}\n\nFix these before continuing.`,
    };
  }

  console.log(JSON.stringify(result));
  return result;
}

quickCheck(filePath).catch(() => {
  console.log(JSON.stringify({ continue: true }));
});
