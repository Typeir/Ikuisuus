/**
 * @fileoverview Lab route discovery.
 * @description Walks the `labs` segment for `page.tsx` files and turns each
 * into a route. Reading the filesystem rather than keeping a list means a new
 * lab appears the moment its page exists, which is the only way an index of
 * scratch routes stays true — a hand-maintained one is stale by the second
 * lab nobody remembered to add.
 *
 * @module app/[locale]/labs/labIndex
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-04
 */

import { readdirSync } from 'fs';
import path from 'path';

/**
 * One lab route.
 *
 * @property {string} href - Route below the locale, e.g. `labs/dev/slots`
 * @property {string} name - Last segment, the lab's own name
 * @property {string[]} segments - Every segment below `labs`
 */
export interface LabRoute {
  href: string;
  name: string;
  segments: string[];
}

/**
 * Directory holding the labs segment.
 */
const LABS_DIR = path.resolve(process.cwd(), 'src/app/[locale]/labs');

/**
 * Collects lab routes by walking the segment for pages.
 *
 * @param {string} dir - Directory to walk
 * @param {string[]} trail - Segments walked so far
 * @returns {LabRoute[]} Routes found beneath `dir`
 */
function walk(dir: string, trail: string[]): LabRoute[] {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const found: LabRoute[] = [];
  const hasPage = entries.some(
    (entry) => entry.isFile() && entry.name === 'page.tsx',
  );
  if (hasPage && trail.length > 0) {
    found.push({
      href: ['labs', ...trail].join('/'),
      name: trail[trail.length - 1],
      segments: trail,
    });
  }

  for (const entry of entries) {
    /* A private folder is not routed; a route group is routed but adds no
       segment of its own. */
    if (!entry.isDirectory() || entry.name.startsWith('_')) continue;
    const isGroup = /^\(.*\)$/.test(entry.name);
    found.push(
      ...walk(
        path.join(dir, entry.name),
        isGroup ? trail : [...trail, entry.name],
      ),
    );
  }
  return found;
}

/**
 * Every lab route, deepest path last, alphabetical within a level.
 *
 * @returns {LabRoute[]} Lab routes
 */
export function labRoutes(): LabRoute[] {
  return walk(LABS_DIR, []).sort((a, b) => a.href.localeCompare(b.href));
}
