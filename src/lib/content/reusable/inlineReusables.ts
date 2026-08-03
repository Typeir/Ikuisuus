/**
 * Reusable Region Inliner
 *
 * @fileoverview Splices reusable region sources into a host document before it
 * is compiled.
 *
 * Inlining at source level means the region compiles as part of its host, with
 * the host's component map. Interactive components inside a region therefore
 * behave exactly as they would written inline, and nothing is pre-rendered to
 * frozen HTML.
 *
 * @module lib/content/reusable/inlineReusables
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-03
 */

import type { ReusableEntry } from './reusableRegistry';

/**
 * Matches a self-closing PascalCase tag, optionally dotted for a named region.
 * Attributes are tolerated and discarded — a region takes no props.
 */
const REUSABLE_TAG = /<([A-Z][A-Za-z0-9]*)(?:\.([A-Za-z][A-Za-z0-9]*))?\s*\/>/g;

/** Depth limit guarding against a region that references itself. */
const MAX_DEPTH = 5;

/**
 * Resolves the source for one reference.
 *
 * @param {ReusableEntry} entry - The registry entry for the referenced file
 * @param {string | undefined} region - Named region, when the tag was dotted
 * @returns {string | null} The region source, or null when it does not exist
 */
function resolveSource(
  entry: ReusableEntry,
  region: string | undefined,
): string | null {
  if (region) {
    return entry.regions[region] ?? null;
  }

  if (entry.body !== null) {
    return entry.body;
  }

  const names = Object.keys(entry.regions);
  return names.length === 1 ? entry.regions[names[0]] : null;
}

/**
 * Replaces reusable references in a document with their region sources.
 *
 * A reference to an unknown component is left untouched, so ordinary MDX
 * components continue to resolve through the component map as before. This is
 * what keeps a built-in like `Image` working even though a content file shares
 * its name.
 *
 * @param {string} source - Host document source
 * @param {Map<string, ReusableEntry>} registry - Discovered reusable entries
 * @param {number} [depth] - Current recursion depth; callers should omit this
 * @returns {string} Source with every resolvable reference inlined
 *
 * @example
 * inlineReusables('<LesserMooncleave />', registry) // '> **Lesser Mooncleave** …'
 */
export function inlineReusables(
  source: string,
  registry: Map<string, ReusableEntry>,
  depth = 0,
): string {
  if (depth >= MAX_DEPTH || registry.size === 0) {
    return source;
  }

  let replaced = false;

  const result = source.replace(
    REUSABLE_TAG,
    (full, name: string, region: string | undefined) => {
      const entry = registry.get(name);
      if (!entry) {
        return full;
      }

      const inner = resolveSource(entry, region);
      if (inner === null) {
        return full;
      }

      replaced = true;
      return `\n\n${inner}\n\n`;
    },
  );

  return replaced ? inlineReusables(result, registry, depth + 1) : result;
}
