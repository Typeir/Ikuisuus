/**
 * Updates internal MDX links after content files are renamed with double-extension suffixes.
 *
 * @fileoverview Scans all `.mdx` files and rewrites markdown links whose targets
 * have been renamed (e.g., `/vocations/Berserker/path-of-the-berserker` becomes
 * `/vocations/Berserker/path-of-the-berserker.specialization`).
 *
 * Builds a mapping of old URL slugs → new URL slugs from the filesystem,
 * then applies replacements across all content files.
 *
 * @module scripts/content/updateContentLinks
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 *
 * @example
 * ```bash
 * npx tsx scripts/content/updateContentLinks.ts --dry   # preview only
 * npx tsx scripts/content/updateContentLinks.ts          # apply changes
 * ```
 */

import { createLogger } from '@/lib/logging/logger';
import fs from 'fs';
import path from 'path';

import { hasFlag } from '../core/cliArgs';

const log = createLogger({ script: 'updateContentLinks' });

const CONTENT_ROOT = path.resolve('src', 'content', 'en');
const DRY_RUN = hasFlag('dry');

/** URL path prefix for the library route */
const LIBRARY_PREFIX = '/en/library/';

/**
 * Suffix extraction regex matching recognized double-extension content suffixes.
 */
const SUFFIX_REGEX =
  /\.(sheet|specialization|list|heirloom|trinket|bloodline|lore)$/;

/**
 * Builds a mapping of old URL slugs (without suffix) to new URL slugs (with suffix)
 * by scanning renamed files on disk.
 *
 * @returns {Map<string, string>} Map from old link target to new link target
 */
function buildSlugMap(): Map<string, string> {
  const slugMap = new Map<string, string>();

  /**
   * Recursively scans a directory for renamed `.mdx` files and registers their slug mappings.
   *
   * @param {string} dir - Directory to scan
   * @param {string} urlPrefix - URL path prefix for this directory
   */
  function scanDir(dir: string, urlPrefix: string): void {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanDir(fullPath, `${urlPrefix}${entry.name}/`);
        continue;
      }

      if (!entry.name.endsWith('.mdx')) continue;

      const slug = entry.name.replace(/\.mdx$/, '');
      const suffixMatch = slug.match(SUFFIX_REGEX);
      if (!suffixMatch) continue;

      const oldSlug = slug.replace(SUFFIX_REGEX, '');
      const oldUrl = `${urlPrefix}${oldSlug}`;
      const newUrl = `${urlPrefix}${slug}`;

      slugMap.set(oldUrl, newUrl);
    }
  }

  scanDir(
    path.join(CONTENT_ROOT, 'character-creation', 'vocations'),
    `${LIBRARY_PREFIX}character-creation/vocations/`,
  );
  scanDir(
    path.join(CONTENT_ROOT, 'character-creation', 'bloodlines'),
    `${LIBRARY_PREFIX}character-creation/bloodlines/`,
  );
  scanDir(
    path.join(CONTENT_ROOT, 'items', 'heirlooms'),
    `${LIBRARY_PREFIX}items/heirlooms/`,
  );
  scanDir(
    path.join(CONTENT_ROOT, 'items', 'trinkets'),
    `${LIBRARY_PREFIX}items/trinkets/`,
  );
  scanDir(path.join(CONTENT_ROOT, 'world'), `${LIBRARY_PREFIX}world/`);

  return slugMap;
}

/**
 * Result of processing a single file.
 *
 * @property {string} file - Relative path of the processed file
 * @property {number} count - Number of link replacements made
 */
interface FileResult {
  file: string;
  count: number;
}

/**
 * Processes a single MDX file, replacing old link targets with new suffixed targets.
 *
 * @param {string} filePath - Absolute path to the MDX file
 * @param {Map<string, string>} slugMap - Old-to-new URL slug mapping
 * @returns {FileResult | null} Result with replacement count, or null if no changes
 */
function processFile(
  filePath: string,
  slugMap: Map<string, string>,
): FileResult | null {
  const content = fs.readFileSync(filePath, 'utf-8');
  let updated = content;
  let count = 0;

  for (const [oldUrl, newUrl] of slugMap) {
    const escaped = oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(\\]\\()${escaped}([)#])`, 'g');

    updated = updated.replace(pattern, (_match, prefix, ending) => {
      count++;
      return `${prefix}${newUrl}${ending}`;
    });
  }

  if (count === 0) return null;

  if (!DRY_RUN) {
    fs.writeFileSync(filePath, updated, 'utf-8');
  }

  return {
    file: path.relative(path.resolve('src', 'content'), filePath),
    count,
  };
}

/**
 * Recursively finds all `.mdx` files in a directory.
 *
 * @param {string} dir - Directory to search
 * @returns {string[]} Array of absolute file paths
 */
function findAllMdx(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findAllMdx(fullPath));
    } else if (entry.name.endsWith('.mdx')) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Entry point — builds the slug map and processes all MDX files.
 */
function main(): void {
  const slugMap = buildSlugMap();
  log.message(`📋 Built slug map: ${slugMap.size} renamed targets`);

  const allFiles = findAllMdx(CONTENT_ROOT);
  log.message(`📂 Scanning ${allFiles.length} MDX files`);
  log.message(`   Mode: ${DRY_RUN ? '🔍 DRY RUN' : '✏️  APPLY'}`);

  const results: FileResult[] = [];
  for (const file of allFiles) {
    const result = processFile(file, slugMap);
    if (result) results.push(result);
  }

  let totalReplacements = 0;
  for (const r of results) {
    log.message(`  ${r.file}: ${r.count} links updated`);
    totalReplacements += r.count;
  }

  log.message(
    `\n✅ ${totalReplacements} links updated across ${results.length} files.`,
  );
}

main();
