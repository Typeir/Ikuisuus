/**
 * @fileoverview Migration: Ensure `source` + `contentType` frontmatter on all content MDX
 * @description One-shot script that walks `src/content/{locale}/` and ensures
 * every `.mdx`/`.md` file carries YAML frontmatter with:
 * - `source: Ikuisuus` — only when no `source` key exists (files already
 *   tagged with another source, e.g. `basic`, are left untouched)
 * - `contentType: <type>` — derived from the content folder (and the
 *   `.specialization.mdx` suffix inside vocations), so readers no longer
 *   have to infer the type from file extensions
 *
 * Existing frontmatter blocks are patched textually (missing keys appended
 * before the closing delimiter) — never reserialized — so field order,
 * quoting, and formatting of authored frontmatter are preserved.
 *
 * Safe to re-run — idempotent.
 *
 * @module scripts/migrations/addContentFrontmatter
 * @author Typeir
 * @version 1.0.0
 * @since 8.0.0
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/migrations/addContentFrontmatter.ts
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../');
const CONTENT_ROOT = join(ROOT, 'src/content');

const BOM = '﻿';

/**
 * Derives the contentType for a file from its path relative to the locale
 * root. Folder-first: the directory decides the type; only vocations vs
 * specializations need the file suffix as a tiebreaker.
 *
 * @param {string} relPath - Path relative to `src/content/{locale}/`, using `/`
 * @returns {string | null} contentType value, or null when underivable
 */
function deriveContentType(relPath: string): string | null {
  const segments = relPath.split('/');
  const top = segments[0];

  switch (top) {
    case 'monsters':
      return 'monsters';
    case 'spells':
      return 'spells';
    case 'world':
      return 'world';
    case 'rules':
      return 'rules';
    case 'items':
      /* items/heirlooms, items/trinkets, items/equipment, items/tools */
      return segments.length > 2 ? segments[1] : null;
    case 'character-creation': {
      const sub = segments[1];
      if (sub === 'vocations') {
        return /\.specialization\.mdx?$/.test(relPath)
          ? 'specializations'
          : 'vocations';
      }
      /* bloodlines, feats */
      return sub && segments.length > 2 ? sub : null;
    }
    default:
      return null;
  }
}

/**
 * Ensures `source` and `contentType` keys exist in a file's frontmatter,
 * creating the block when absent. Existing keys are never overwritten.
 *
 * @param {string} filePath - Absolute path to the content file
 * @param {string | null} contentType - Derived contentType, or null to skip that key
 * @returns {'created' | 'patched' | 'skipped'} Outcome for reporting
 */
function ensureFrontmatter(
  filePath: string,
  contentType: string | null,
): 'created' | 'patched' | 'skipped' {
  let raw = readFileSync(filePath, 'utf8');
  const hadBom = raw.startsWith(BOM);
  if (hadBom) raw = raw.slice(BOM.length);

  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const write = (content: string): void =>
    writeFileSync(filePath, (hadBom ? BOM : '') + content, 'utf8');

  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?=\r?\n|$)/);

  if (!fmMatch) {
    const lines = [`source: Ikuisuus`];
    if (contentType) lines.push(`contentType: ${contentType}`);
    write(`---${eol}${lines.join(eol)}${eol}---${eol}${eol}${raw}`);
    return 'created';
  }

  const block = fmMatch[1];
  const additions: string[] = [];
  if (!/^source\s*:/m.test(block)) {
    additions.push(`source: Ikuisuus`);
  }
  if (contentType && !/^contentType\s*:/m.test(block)) {
    additions.push(`contentType: ${contentType}`);
  }
  if (additions.length === 0) return 'skipped';

  const rest = raw.slice(fmMatch[0].length);
  write(`---${eol}${block}${eol}${additions.join(eol)}${eol}---${rest}`);
  return 'patched';
}

/**
 * Recursively collects `.mdx`/`.md` files under a directory.
 *
 * @param {string} dir - Directory to walk
 * @returns {string[]} Absolute file paths
 */
function collectContentFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      results.push(...collectContentFiles(fullPath));
    } else if (/\.mdx?$/.test(entry)) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Entry point. Walks every locale under `src/content/` and patches files.
 *
 * @returns {void}
 */
function main(): void {
  const stats = { created: 0, patched: 0, skipped: 0, untyped: [] as string[] };
  const byType: Record<string, number> = {};

  const locales = readdirSync(CONTENT_ROOT).filter(
    (entry) =>
      !entry.startsWith('.') &&
      statSync(join(CONTENT_ROOT, entry)).isDirectory(),
  );

  for (const locale of locales) {
    const localeRoot = join(CONTENT_ROOT, locale);
    for (const filePath of collectContentFiles(localeRoot)) {
      const relPath = relative(localeRoot, filePath).replace(/\\/g, '/');
      const contentType = deriveContentType(relPath);
      if (!contentType) stats.untyped.push(`${locale}/${relPath}`);
      else byType[contentType] = (byType[contentType] ?? 0) + 1;

      const outcome = ensureFrontmatter(filePath, contentType);
      stats[outcome]++;
    }
  }

  process.stdout.write('── Frontmatter migration ─────────────────────────\n');
  process.stdout.write(`  created (no frontmatter before): ${stats.created}\n`);
  process.stdout.write(`  patched (keys appended):         ${stats.patched}\n`);
  process.stdout.write(`  skipped (already complete):      ${stats.skipped}\n`);
  process.stdout.write('\n── contentType distribution ──────────────────────\n');
  for (const [type, count] of Object.entries(byType).sort()) {
    process.stdout.write(`  ${type}: ${count}\n`);
  }
  if (stats.untyped.length > 0) {
    process.stdout.write(
      `\n  ⚠️  contentType underivable (source added only):\n`,
    );
    for (const file of stats.untyped) {
      process.stdout.write(`    ${file}\n`);
    }
  }
  process.stdout.write('\n✅  Done.\n');
}

main();
