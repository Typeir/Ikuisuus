/**
 * Reusable Region Parser
 *
 * @fileoverview Pure parser for reusable MDX regions. A file opts in with
 * `reusable: true` in its frontmatter, then either marks named regions with
 * paired `reusable:start <name>` and `reusable:end` MDX comments, or exposes
 * its whole body with the title heading and flavour lede removed.
 *
 * Headings inside a region are normalised so the region's own shallowest
 * heading sits at level 1, then shifted down by the declared offset when
 * embedded. This keeps a region's internal structure while letting the host
 * document own the outline.
 *
 * @module lib/content/reusable/parseReusableRegions
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-03
 */

/** Matches the opening marker of a named region. */
const REGION_START = /\{\s*\/\*\s*reusable:start\s+([A-Za-z][A-Za-z0-9]*)\s*\*\/\s*\}/;

/** Matches the closing marker of a named region. */
const REGION_END = /\{\s*\/\*\s*reusable:end\s*\*\/\s*\}/;

/** Matches YAML frontmatter at the very start of a document. */
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/** Matches an ATX heading line, capturing its hashes and text. */
const HEADING_LINE = /^(#{1,6})[ \t]+(.*)$/gm;

/** Matches a thematic break on its own line. */
const THEMATIC_BREAK = /^\r?\n?---[ \t]*$/m;

/** Default number of levels a region shifts down when embedded. */
const DEFAULT_HEADING_OFFSET = 1;

/**
 * A parsed reusable document.
 *
 * @interface ParsedReusable
 * @property {boolean} isReusable - Whether the file opted in via frontmatter
 * @property {number} headingOffset - Levels to shift headings when embedded
 * @property {Record<string, string>} regions - Named region sources, keyed by name
 * @property {string | null} body - Whole-body source, or null when named regions exist
 */
export interface ParsedReusable {
  isReusable: boolean;
  headingOffset: number;
  regions: Record<string, string>;
  body: string | null;
}

/**
 * Reads the `reusable` and `headingOffset` keys out of raw frontmatter.
 * Deliberately minimal: this runs against every content file, so it avoids
 * pulling in a YAML parser for two scalar lookups.
 *
 * @param {string} raw - The full document source
 * @returns {{ isReusable: boolean; headingOffset: number }} The parsed flags
 */
function readFlags(raw: string): {
  isReusable: boolean;
  headingOffset: number;
} {
  const match = raw.match(FRONTMATTER);
  if (!match) {
    return { isReusable: false, headingOffset: DEFAULT_HEADING_OFFSET };
  }

  const isReusable = /^\s*reusable\s*:\s*true\s*$/m.test(match[1]);
  const offsetMatch = match[1].match(/^\s*headingOffset\s*:\s*(-?\d+)\s*$/m);

  return {
    isReusable,
    headingOffset: offsetMatch
      ? Number.parseInt(offsetMatch[1], 10)
      : DEFAULT_HEADING_OFFSET,
  };
}

/**
 * Strips frontmatter from a document, returning the body alone.
 *
 * @param {string} raw - The full document source
 * @returns {string} The body with frontmatter removed
 */
function stripFrontmatter(raw: string): string {
  return raw.replace(FRONTMATTER, '');
}

/**
 * Removes the document's title heading and flavour lede.
 *
 * A content file leads with an H1 and a paragraph of flavour, separated from
 * the mechanical body by a thematic break. Neither belongs in a reused
 * fragment: the host already has a title, and the lede reads as an
 * interruption mid-page.
 *
 * @param {string} body - Document body with frontmatter already removed
 * @returns {string} The body from the mechanical content onward
 */
function stripTitleAndLede(body: string): string {
  const trimmed = body.replace(/^\s+/, '');

  if (!trimmed.startsWith('# ')) {
    return trimmed;
  }

  const afterHeading = trimmed.slice(trimmed.indexOf('\n') + 1);
  const breakMatch = afterHeading.match(THEMATIC_BREAK);

  if (!breakMatch || breakMatch.index === undefined) {
    return afterHeading.replace(/^\s+/, '');
  }

  return afterHeading
    .slice(breakMatch.index + breakMatch[0].length)
    .replace(/^\s+/, '');
}

/**
 * Extracts every named region delimited by start and end markers.
 * An unterminated region is ignored rather than swallowing the rest of the
 * file, so a typo degrades to "no region" instead of corrupting the output.
 *
 * @param {string} body - Document body with frontmatter already removed
 * @returns {Record<string, string>} Region sources keyed by name
 */
function extractNamedRegions(body: string): Record<string, string> {
  const regions: Record<string, string> = {};
  let cursor = 0;

  for (;;) {
    const remainder = body.slice(cursor);
    const start = remainder.match(REGION_START);
    if (!start || start.index === undefined) {
      break;
    }

    const contentStart = start.index + start[0].length;
    const afterStart = remainder.slice(contentStart);
    const end = afterStart.match(REGION_END);

    if (!end || end.index === undefined) {
      break;
    }

    regions[start[1]] = afterStart.slice(0, end.index).trim();
    cursor += contentStart + end.index + end[0].length;
  }

  return regions;
}

/**
 * Normalises heading levels within a region and applies an embedding offset.
 *
 * The shallowest heading present becomes level 1 before the offset is added,
 * so a region lifted from deep in a document does not carry that depth with
 * it. Relative structure between headings is preserved.
 *
 * @param {string} source - Region source
 * @param {number} offset - Levels to shift down once normalised
 * @returns {string} Source with heading levels rewritten
 *
 * @example
 * normaliseHeadings('##### A\n###### B', 1) // '## A\n### B'
 */
export function normaliseHeadings(source: string, offset: number): string {
  const levels: number[] = [];
  for (const match of source.matchAll(HEADING_LINE)) {
    levels.push(match[1].length);
  }

  if (levels.length === 0) {
    return source;
  }

  const shallowest = Math.min(...levels);

  return source.replace(HEADING_LINE, (_full, hashes: string, text: string) => {
    const normalised = hashes.length - shallowest + 1 + offset;
    const clamped = Math.min(6, Math.max(1, normalised));
    return `${'#'.repeat(clamped)} ${text}`;
  });
}

/**
 * Parses a content file into its reusable regions.
 *
 * @param {string} raw - The full document source, frontmatter included
 * @returns {ParsedReusable} The parsed result; `isReusable` is false when the
 *   file did not opt in, in which case the other fields are empty
 *
 * @example
 * parseReusableRegions('---\nreusable: true\n---\n\n# T\n\nlede\n\n---\n\nbody')
 * // { isReusable: true, headingOffset: 1, regions: {}, body: 'body' }
 */
export function parseReusableRegions(raw: string): ParsedReusable {
  const { isReusable, headingOffset } = readFlags(raw);

  if (!isReusable) {
    return { isReusable: false, headingOffset, regions: {}, body: null };
  }

  const body = stripFrontmatter(raw);
  const named = extractNamedRegions(body);

  if (Object.keys(named).length > 0) {
    const regions: Record<string, string> = {};
    for (const [name, source] of Object.entries(named)) {
      regions[name] = normaliseHeadings(source, headingOffset);
    }
    return { isReusable: true, headingOffset, regions, body: null };
  }

  return {
    isReusable: true,
    headingOffset,
    regions: {},
    body: normaliseHeadings(stripTitleAndLede(body), headingOffset),
  };
}
