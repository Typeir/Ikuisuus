/**
 * Reusable Region Registry
 *
 * @fileoverview Discovers content files that opt into reuse and exposes their
 * regions as MDX component sources. Reads frontmatter only; results cached for
 * the process lifetime.
 *
 * @module lib/content/reusable/reusableRegistry
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-03
 */

import fs from 'fs/promises';
import path from 'path';
import { parseReusableRegions } from './parseReusableRegions';

/** True when the file declares `reusable: true`. */
const HAS_FLAG = /^\s*reusable\s*:\s*true\s*$/m;

/**
 * A discovered reusable file.
 *
 * @interface ReusableEntry
 * @property {string} name - PascalCase component name derived from the filename
 * @property {string} filePath - Absolute path to the source file
 * @property {string | null} body - Whole-body source, when no named regions exist
 * @property {Record<string, string>} regions - Named region sources
 */
export interface ReusableEntry {
  name: string;
  filePath: string;
  body: string | null;
  regions: Record<string, string>;
}

/** Cached discovery result, keyed by content root. */
const cache = new Map<string, Map<string, ReusableEntry>>();

/**
 * Converts a file path into a PascalCase component name.
 *
 * @param {string} filePath - Absolute or relative path to an MDX file
 * @returns {string} PascalCase name, e.g. "LesserMooncleave"
 *
 * @example
 * componentNameFromPath('spells/lesser-mooncleave.mdx') // 'LesserMooncleave'
 */
export function componentNameFromPath(filePath: string): string {
  const base = path.basename(filePath).replace(/\.mdx$/, '');
  return base
    .split(/[-_.]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Recursively lists MDX files beneath a directory.
 *
 * @param {string} dir - Directory to walk
 * @returns {Promise<string[]>} Absolute paths of every .mdx file found
 */
async function listMdxFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  const nested = await Promise.all(
    entries.map(async (entry) => {
      const resolved = path.resolve(dir, entry.name);
      if (entry.isDirectory()) return listMdxFiles(resolved);
      return resolved.endsWith('.mdx') ? [resolved] : [];
    }),
  );

  return nested.flat();
}

/**
 * Discovers every reusable file beneath a content root.
 *
 * @param {string} contentRoot - Absolute path to the content directory
 * @returns {Promise<Map<string, ReusableEntry>>} Entries keyed by component name
 */
export async function discoverReusables(
  contentRoot: string,
): Promise<Map<string, ReusableEntry>> {
  const cached = cache.get(contentRoot);
  if (cached) {
    return cached;
  }

  const files = await listMdxFiles(contentRoot);
  const found = new Map<string, ReusableEntry>();

  await Promise.all(
    files.map(async (filePath) => {
      const raw = await fs.readFile(filePath, 'utf8');
      if (!HAS_FLAG.test(raw)) {
        return;
      }

      const parsed = parseReusableRegions(raw);
      if (!parsed.isReusable) {
        return;
      }

      found.set(componentNameFromPath(filePath), {
        name: componentNameFromPath(filePath),
        filePath,
        body: parsed.body,
        regions: parsed.regions,
      });
    }),
  );

  cache.set(contentRoot, found);
  return found;
}

/**
 * Clears the discovery cache.
 *
 * @returns {void}
 */
export function clearReusableCache(): void {
  cache.clear();
}
