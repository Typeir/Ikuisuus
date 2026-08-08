/**
 * @fileoverview Catalog: "At Higher Levels" upcast prose patterns
 *
 * Walks every spell .mdx file and extracts the upcasting block — the
 * "At Higher Levels" heading and its body, or inline bullet variants.
 * Classifies each into one of several structural patterns and writes a
 * JSON catalogue so the editorial team can analyse repetition, derive a
 * leaner convention, and spot outliers.
 *
 * Usage:
 *   node scripts/content/catalog-upcast-patterns.mjs
 *
 * Output:
 *   .ignore/reports/upcast-patterns.json
 *
 * @module scripts/content/catalog-upcast-patterns
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-07
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const SPELLS_DIR = join(ROOT, 'src', 'content', 'en', 'spells');
const OUT_DIR = join(ROOT, '.ignore', 'reports');
const OUT_FILE = join(OUT_DIR, 'upcast-patterns.json');

// ---------------------------------------------------------------------------
// Regex arsenal
// ---------------------------------------------------------------------------

/** Matches the "At Higher Levels" heading — standalone or inline with body. */
const HEADING_RE = /^>\s*\*{0,2}At Higher Levels\.?\*{0,2}\s*/im;

/** Matches an inline bullet upcast: `> - **4th level or higher:** …` */
const INLINE_BULLET_RE = /^>\s*[-*]\s+\*{0,2}(\d+(?:st|nd|rd|th)\s+level\s+or\s+higher)\*{0,2}\s*:\s*(.+)$/im;

/** Slot-level references in body text: "Nth level or higher". */
const SLOT_LEVEL_RE = /(\d+(?:st|nd|rd|th))\s+level\s+or\s+higher/gi;

/** "per/for each slot level above N" tail. */
const PER_SLOT_RE = /(?:per|for\s+each|for\s+every)\s+(?:slot\s+level|two\s+slot\s+levels)\s+above\s+(\d+(?:st|nd|rd|th)?)/i;

/** "If you cast …" intro variant. */
const IF_INTRO_RE = /^>\s*\*{0,2}(?:At Higher Levels\.\s*)?If you cast this spell/i;

/** "When you cast …" intro variant. */
const WHEN_INTRO_RE = /^>\s*\*{0,2}(?:At Higher Levels\.\s*)?When you cast this spell/i;

/** Catch a bare "Higher slots let you…" freeform intro. */
const FREEFORM_INTRO_RE = /^>\s*\*{0,2}(?:At Higher Levels\.\s*)?Higher slots/i;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * @typedef {object} UpcastEntry
 * @property {string} file     — relative path of the spell file
 * @property {string} spell    — spell slug (filename stem)
 * @property {string} pattern  — classification label
 * @property {string[]} slotLevels — every "Nth level or higher" found in the block
 * @property {string} body     — the raw block text (trimmed)
 * @property {number} bodyLines — line count of the block
 */

/**
 * Read all .mdx files in the spells directory (one level, no recursion).
 * @returns {string[]}
 */
function collectSpellFiles() {
  return readdirSync(SPELLS_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => join(SPELLS_DIR, f));
}

/**
 * Slice out the upcast block from file content.
 * Starts at the "At Higher Levels" heading (or inline bullet) and ends at
 * the next `---` divider, `#### Spell Lists` heading, or EOF.
 *
 * @param {string} content
 * @returns {string|null}
 */
function extractUpcastBlock(content) {
  const lines = content.split('\n');
  let start = -1;

  // Look for "At Higher Levels" heading (may be inline with body) or inline bullet
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (HEADING_RE.test(line) || INLINE_BULLET_RE.test(line)) {
      start = i;
      break;
    }
  }

  if (start === -1) return null;

  // Collect until next section divider or spell-lists heading
  const blockLines = [];
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];

    // Stop at horizontal rule or Spell Lists heading
    if (i > start && (line.trim() === '---' || /^####\s+Spell Lists/.test(line))) {
      break;
    }

    // Stop if we hit a blank line followed by a new blockquote section
    // (i.e. the upcast block ended, and a new topic started)
    if (i > start + 1 && line.trim() === '' && i + 1 < lines.length) {
      const next = lines[i + 1].trim();
      // If next line is a blockquote that isn't continuing the upcast
      if (/^>\s*\*{0,2}(?!When|If|Higher|per|for each|for every)/i.test(next) &&
          !INLINE_BULLET_RE.test(next)) {
        break;
      }
    }

    blockLines.push(line);
  }

  return blockLines.join('\n').trim();
}

/**
 * Classify the upcast block into one of the known structural patterns.
 *
 * @param {string} block
 * @returns {string}
 */
function classifyPattern(block) {
  // Normalise: strip blockquote markers and collapse whitespace for pattern matching
  const flat = block
    .split('\n')
    .map((l) => l.replace(/^>\s?/, '').trim())
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  const hasHeading = /\bAt Higher Levels\.?\b/i.test(flat);

  // Inline bullet list: no heading, just `- **Nth level or higher:** …`
  if (!hasHeading && /^\s*[-*]\s+\*{0,2}\d+(?:st|nd|rd|th)\s+level\s+or\s+higher/i.test(flat)) {
    // Count bullets in original block
    const bulletCount = [...block.matchAll(new RegExp(INLINE_BULLET_RE.source, 'gm'))].length;
    return bulletCount > 1
      ? 'inline-bullet-list'
      : 'inline-bullet-single';
  }

  // Bare body — no heading, starts with "When you cast…"
  if (!hasHeading && /^When you cast this spell/i.test(flat)) {
    return 'body-only-when';
  }

  // Heading present
  if (hasHeading) {
    // Strip the heading for body analysis
    const bodyText = flat.replace(/^.*?\bAt Higher Levels\.?\b\s*/i, '').trim();

    // Empty after heading
    if (!bodyText) return 'heading-only-empty';

    // Freeform: "Higher slots let you…"
    if (/^Higher slots/i.test(bodyText)) return 'heading-freeform';

    // "If you cast…" variant
    if (/^If you cast this spell/i.test(bodyText)) return 'heading-if';

    // "When you cast…" variant
    if (/^When you cast this spell/i.test(bodyText)) return 'heading-when';

    // "For each slot level…" or other direct mechanic
    if (/^(For each|The |What counts)/i.test(bodyText)) return 'heading-direct';

    // Has inline bullets after heading
    if (/\s*[-*]\s+\*{0,2}\d+(?:st|nd|rd|th)\s+level\s+or\s+higher/i.test(bodyText)) {
      return 'heading-with-bullets';
    }

    // Something else
    return 'heading-other';
  }

  return 'unclassified';
}

/**
 * Extract all "Nth level or higher" slot references from a block.
 * @param {string} block
 * @returns {string[]}
 */
function extractSlotLevels(block) {
  const levels = [];
  const re = new RegExp(SLOT_LEVEL_RE.source, SLOT_LEVEL_RE.flags);
  let m;
  while ((m = re.exec(block)) !== null) {
    levels.push(m[0]);
  }
  return [...new Set(levels)];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const files = collectSpellFiles();
  /** @type {UpcastEntry[]} */
  const results = [];
  const patternCounts = {};

  for (const filePath of files) {
    const content = readFileSync(filePath, 'utf8');
    const block = extractUpcastBlock(content);

    if (!block) {
      results.push({
        file: filePath.replace(ROOT, '').replace(/\\/g, '/'),
        spell: filePath.split(/[\\/]/).pop().replace('.mdx', ''),
        pattern: 'none',
        slotLevels: [],
        body: '',
        bodyLines: 0,
      });
      patternCounts.none = (patternCounts.none || 0) + 1;
      continue;
    }

    const pattern = classifyPattern(block);
    const slotLevels = extractSlotLevels(block);
    const bodyLines = block.split('\n').length;

    results.push({
      file: filePath.replace(ROOT, '').replace(/\\/g, '/'),
      spell: filePath.split(/[\\/]/).pop().replace('.mdx', ''),
      pattern,
      slotLevels,
      body: block,
      bodyLines,
    });

    patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
  }

  // Summary stats
  const summary = {
    total: results.length,
    withUpcast: results.filter((r) => r.pattern !== 'none').length,
    withoutUpcast: results.filter((r) => r.pattern === 'none').length,
    patternCounts,
    /** Spells whose body includes 3+ "Nth level or higher" refs (verbose). */
    verboseUpcasts: results
      .filter((r) => r.slotLevels.length >= 3)
      .map((r) => ({ spell: r.spell, file: r.file, refs: r.slotLevels.length })),
    /** Spells using the inline bullet pattern (most divergent). */
    inlineBullets: results
      .filter((r) => r.pattern.startsWith('inline-bullet'))
      .map((r) => ({ spell: r.spell, file: r.file, pattern: r.pattern })),
    /** Spells with bare heading + nothing after */
    bareHeadings: results
      .filter((r) => r.pattern === 'heading-only-empty')
      .map((r) => ({ spell: r.spell, file: r.file })),
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, JSON.stringify({ summary, entries: results }, null, 2), 'utf8');

  console.log(`\n📊 Upcast pattern catalogue written to ${OUT_FILE}`);
  console.log(`   ${summary.total} spells scanned`);
  console.log(`   ${summary.withUpcast} with upcast blocks, ${summary.withoutUpcast} without\n`);

  console.log('Pattern distribution:');
  for (const [pattern, count] of Object.entries(patternCounts).sort((a, b) => b[1] - a[1])) {
    const bar = '█'.repeat(Math.min(count, 50));
    console.log(`  ${pattern.padEnd(24)} ${String(count).padStart(3)}  ${bar}`);
  }

  console.log(`\n   Verbose upcasts (3+ slot-level refs): ${summary.verboseUpcasts.length}`);
  console.log(`   Inline bullet upcasts: ${summary.inlineBullets.length}`);
  console.log(`   Bare headings (no body): ${summary.bareHeadings.length}`);
}

main();
