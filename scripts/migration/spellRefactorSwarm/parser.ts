/**
 * @fileoverview MDX parser, detector, and transformer for the spell refactor swarm.
 *
 * Responsibilities:
 * 1. Parse the components of an SRD spell MDX file into a {@link ParsedSpell}.
 * 2. Detect whether the post-H1 text is rules/mechanical text rather than a
 *    Damocles lore description.
 * 3. Reconstruct the MDX with a new lore description and (optionally) the
 *    original text prepended to the blockquote body.
 *
 * @module scripts/migration/spellRefactorSwarm/parser
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { distance } from 'fastest-levenshtein';
import type { ParsedSpell } from './types';

/**
 * Computes normalized text similarity using Levenshtein distance.
 * Extracts a substring from text2 matching the length of text1,
 * then calculates edit distance on the same-length segments.
 * Returns a score from 0 to 1 (1 = identical, 0 = completely different).
 *
 * @param {string} text1 - First string to compare.
 * @param {string} text2 - Second string to compare (may be longer).
 * @returns {number} Similarity score (0–1).
 */
export const fuzzyTextSimilarity = (text1: string, text2: string): number => {
  const s1 = text1.toLowerCase().trim();
  const s2 = text2.toLowerCase().trim();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const len1 = s1.length;
  const s2Substring = s2.substring(0, len1);

  const maxLen = len1;
  const dist = distance(s1, s2Substring);

  return 1 - dist / maxLen;
};

/**
 * Parses the raw MDX content of an SRD spell into its logical sections.
 * Returns null when the file does not match the expected structure.
 *
 * @param {string} raw - Full file content as read from disk.
 * @returns {ParsedSpell | null} The parsed structure, or null on failure.
 */
export const parseSpellMdx = (raw: string): ParsedSpell | null => {
  const lines = raw.split('\n').map((l) => l.replace(/\r+$/, ''));
  let idx = 0;

  /** Advance past the YAML frontmatter block. */
  let frontmatter = '';
  if (lines[idx] === '---') {
    idx++;
    const fmStart = idx;
    while (idx < lines.length && lines[idx] !== '---') idx++;
    frontmatter = lines.slice(fmStart, idx).join('\n');
    idx++; /** skip closing --- */
  }

  while (idx < lines.length && lines[idx].trim() === '') idx++;

  if (!lines[idx]?.startsWith('# ')) return null;
  idx++;

  while (idx < lines.length && lines[idx].trim() === '') idx++;

  const postH1Lines: string[] = [];
  while (idx < lines.length && lines[idx].trim() !== '---') {
    postH1Lines.push(lines[idx]);
    idx++;
  }
  const postH1Text = postH1Lines.join('\n').trim();
  idx++;

  while (idx < lines.length && lines[idx].trim() === '') idx++;

  const blockquoteLines: string[] = [];
  while (idx < lines.length && lines[idx].startsWith('>')) {
    blockquoteLines.push(lines[idx]);
    idx++;
  }

  if (blockquoteLines.length === 0) return null;

  const blankInBQ = blockquoteLines.findIndex((l) => l.trim() === '>');
  let blockquoteHeader: string;
  let blockquoteBodyRaw: string;

  if (blankInBQ === -1) {
    blockquoteHeader = blockquoteLines.join('\n');
    blockquoteBodyRaw = '';
  } else {
    blockquoteHeader = blockquoteLines.slice(0, blankInBQ).join('\n');
    blockquoteBodyRaw = blockquoteLines.slice(blankInBQ + 1).join('\n');
  }

  const blockquoteBody = blockquoteBodyRaw
    .split('\n')
    .map((l) =>
      l.startsWith('> ') ? l.slice(2) : l.startsWith('>') ? l.slice(1) : l,
    )
    .filter((line) => line.trim() !== 'NO DESCRIPTION!!!!')
    .join('\n')
    .trim();

  const titleMatch = blockquoteHeader.match(/\*\*([^*]+)\*\*/);
  const title = titleMatch ? titleMatch[1].trim() : 'Untitled Spell';

  /** Extract "At Higher Levels." paragraph. */
  const atHigherLevelsMatch = blockquoteBody.match(
    /(\*\*At Higher Levels\.\*\*[\s\S]*?)(?=\n\n|$)/,
  );
  const atHigherLevels = atHigherLevelsMatch
    ? atHigherLevelsMatch[1].trim()
    : null;

  /** Collect everything after the blockquote. */
  while (idx < lines.length && lines[idx].trim() === '') idx++;
  const remaining = lines.slice(idx).join('\n').trim();
  const spellListsSection = remaining.length > 0 ? remaining : null;

  /** Extract spell level from blockquote header. */
  const levelMatch = blockquoteHeader.match(
    /_([0-9]+)(?:st|nd|rd|th)?-?level|cantrip_/i,
  );
  let spellLevel = 0;
  if (levelMatch) {
    if (levelMatch[0].toLowerCase().includes('cantrip')) {
      spellLevel = 0;
    } else {
      spellLevel = parseInt(levelMatch[1], 10);
    }
  }

  return {
    frontmatter,
    title,
    postH1Text,
    blockquoteHeader,
    blockquoteBody,
    spellLevel,
    atHigherLevels,
    spellListsSection,
  };
};

/**
 * Determines whether the post-H1 text is rules/mechanical content rather than
 * a Damocles lore description. Only examines the post-H1 text itself; does not
 * compare to blockquote content.
 *
 * A text is considered rules text when any of the following hold:
 * - It begins with a mechanical action verb or phrase
 * - It contains >= 2 mechanical keywords
 *
 * @param {string} postH1Text - The extracted post-H1 paragraph(s).
 * @param {string} _blockquoteBody - (Unused) The extracted blockquote body text.
 * @returns {boolean} True when the text should be treated as rules/mechanical content.
 */
export const isRulesText = (
  postH1Text: string,
  _blockquoteBody: string,
): boolean => {
  if (!postH1Text || postH1Text.trim().length === 0) return false;

  const text = postH1Text.trim();

  const MECHANICAL_OPENERS =
    /^(You |A bright|A bolt|A flash|A wave|A beam|A surge|A pale|A thin|A roaring|A mass|Necromantic|Lightning|Searing|Ethereal|Divine|This spell|Roll |Choose |Select |Target |The target|Each creature|Up to )/;
  if (MECHANICAL_OPENERS.test(text)) return true;

  const MECHANICAL_KEYWORDS = [
    'saving throw',
    'spell attack',
    'hit points',
    'damage',
    'hit point',
    'Constitution',
    'Dexterity',
    'Strength',
    'Wisdom',
    'Intelligence',
    'Charisma',
    'spell slot',
    'concentration',
    'within range',
    'spell level',
    'radiant',
    'necrotic',
    'psychic',
    'thunder',
    'piercing',
    'slashing',
    'bludgeoning',
    'fire damage',
    'cold damage',
    'acid damage',
    'poison damage',
    'force damage',
    'lightning damage',
    'spell save DC',
  ];
  const matchCount = MECHANICAL_KEYWORDS.filter((kw) =>
    text.toLowerCase().includes(kw.toLowerCase()),
  ).length;
  if (matchCount >= 2) return true;

  return false;
};

/**
 * Extracts the first paragraph of the blockquote body for comparison in skip detection.
 *
 * @param {string} blockquoteBody - Full blockquote body text.
 * @returns {string} First paragraph (up to double newline), or empty string if none.
 */
export const getBlockquoteFirstParagraph = (blockquoteBody: string): string => {
  const normalized = blockquoteBody.trim();
  const match = normalized.match(/^([^\n]+(?:\n[^\n]+)*?)(?:\n\n|$)/);
  return match ? match[1].trim() : '';
};

/**
 * Checks whether the post-H1 text is already present at the start of the
 * blockquote body.  When false, the text should be prepended before the
 * body narrative.
 *
 * @param {string} postH1Text - Post-H1 paragraph(s).
 * @param {string} blockquoteBody - Blockquote body text.
 * @returns {boolean} True when the text is already in the blockquote body.
 */
export const isAlreadyInBlockquote = (
  postH1Text: string,
  blockquoteBody: string,
): boolean => {
  const text = postH1Text.trim();
  if (!text) return true;
  const normalised = blockquoteBody.trimStart();
  return (
    normalised.includes(text) ||
    normalised.startsWith(text.slice(0, Math.min(text.length, 60)))
  );
};

/**
 * Reconstructs the full MDX content for a spell after refactoring.
 * Replaces the post-H1 text with the generated lore description and
 * optionally prepends the original text to the blockquote body.
 *
 * @param {ParsedSpell} parsed - The parsed spell structure.
 * @param {string} loreDescription - The Damocles lore description to use as post-H1 text.
 * @param {boolean} prependOriginalToBody - When true, the original post-H1 text is
 *   inserted as the first paragraph of the blockquote body (unless it is a placeholder).
 * @returns {string} Full reconstructed MDX content.
 */
export const reconstructSpellMdx = (
  parsed: ParsedSpell,
  loreDescription: string,
  prependOriginalToBody: boolean,
): string => {
  const {
    frontmatter,
    title,
    postH1Text,
    blockquoteHeader,
    blockquoteBody,
    spellListsSection,
  } = parsed;

  const isPlaceholder =
    postH1Text.trim() === '' ||
    postH1Text.trim() === 'NO DESCRIPTION!!!' ||
    postH1Text.trim().length < 10;

  const finalBody =
    prependOriginalToBody && !isPlaceholder
      ? `${postH1Text.trim()}\n\n${blockquoteBody}`
      : blockquoteBody;

  const cleanedBody = finalBody
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      return (
        trimmed !== 'NO DESCRIPTION!!!!' &&
        trimmed !== 'NO DESCRIPTION!!!'
      );
    })
    .join('\n')
    .replace(/\n\n\n+/g, '\n\n');

  const wrappedBody = cleanedBody
    .split('\n')
    .map((l) => (l.trim() === '' ? '>' : `> ${l}`))
    .join('\n');

  const frontmatterBlock = frontmatter ? `---\n${frontmatter}\n---\n\n` : '';
  const spellListsBlock = spellListsSection ? `\n\n${spellListsSection}` : '';

  return (
    `${frontmatterBlock}# ${title}\n\n` +
    `${loreDescription.trim()}\n\n` +
    `---\n\n` +
    `${blockquoteHeader}\n>\n${wrappedBody}` +
    `${spellListsBlock}\n`
  );
};
