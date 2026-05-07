/**
 * @fileoverview Detects and fixes duplicate H1 text vs blockquote description.
 * Uses levenshtein distance to check if H1 and the first blockquote paragraph
 * are substantially similar. If they are, consolidates them into blockquote
 * and replaces H1 with "NO DESCRIPTION!!!!"
 *
 * @module scripts/migration/fixDuplicateH1AndDescription
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import { distance } from 'fastest-levenshtein';
import fs from 'fs';
import path from 'path';

const log = createLogger({ script: 'FixDuplicateH1AndDescription' });

/**
 * Normalize text for comparison: lowercase, remove punctuation, collapse whitespace.
 *
 * @param {string} text - Text to normalize.
 * @returns {string} Normalized text.
 */
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[.,!?;:—–\-'"""""'']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Get the first paragraph of blockquote body (text before first double newline).
 *
 * @param {string} blockquoteBody - Full blockquote body.
 * @returns {string} First paragraph.
 */
const getFirstBlockquoteParagraph = (blockquoteBody: string): string => {
  const match = blockquoteBody.match(/^([^\n]+(?:\n[^\n]+)*?)(?:\n\n|$)/);
  return match ? match[1].trim() : '';
};

/**
 * Check if two texts are substantially similar using levenshtein distance.
 * Compares substring of blockquote equal to H1 length.
 *
 * @param {string} h1Text - H1 text (shorter).
 * @param {string} blockquoteFirstPara - First blockquote paragraph (potentially longer).
 * @returns {boolean} True if substantially similar.
 */
const areTextsSimilar = (
  h1Text: string,
  blockquoteFirstPara: string,
): boolean => {
  const norm1 = normalizeText(h1Text);
  const normBlockquote = normalizeText(blockquoteFirstPara);

  if (norm1.length === 0 || normBlockquote.length === 0) {
    return false;
  }

  const substringLength = Math.min(norm1.length, normBlockquote.length);
  const blockquoteSubstring = normBlockquote.substring(0, substringLength);

  const dist = distance(norm1, blockquoteSubstring);
  const maxDist = Math.ceil(substringLength * 0.15);

  return dist <= maxDist;
};

/**
 * Process a single spell file.
 *
 * @param {string} filePath - Path to spell MDX file.
 * @returns {boolean} True if file was modified.
 */
const processSpellFile = (filePath: string): boolean => {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');

  let idx = 0;

  if (lines[0].trim() === '---') {
    idx = 1;
    while (idx < lines.length && lines[idx].trim() !== '---') idx += 1;
    idx += 1;
  }

  while (idx < lines.length && !lines[idx].startsWith('#')) idx += 1;
  if (idx >= lines.length) return false;

  const h1Line = lines[idx];
  const h1Text = h1Line.replace(/^#+\s+/, '').trim();
  idx += 1;

  while (idx < lines.length && lines[idx].trim() === '') idx += 1;

  const postH1Start = idx;
  while (
    idx < lines.length &&
    lines[idx].trim() !== '' &&
    !lines[idx].startsWith('---')
  ) {
    idx += 1;
  }

  const postH1End = idx;
  const postH1Text = lines.slice(postH1Start, postH1End).join('\n').trim();

  while (idx < lines.length && lines[idx].trim() !== '---') idx += 1;
  if (idx >= lines.length) return false;

  const separatorIdx = idx;
  idx += 1;

  while (idx < lines.length && lines[idx].trim() === '') idx += 1;

  let blockquoteHeaderEnd = idx;
  while (
    idx < lines.length &&
    lines[idx].trim() !== '' &&
    lines[idx].trim() !== '>'
  ) {
    idx += 1;
  }

  if (lines[idx]?.trim() === '>') {
    blockquoteHeaderEnd = idx + 1;
  }

  if (blockquoteHeaderEnd >= lines.length) return false;

  const blockquoteBodyLines: string[] = [];
  idx = blockquoteHeaderEnd;
  while (idx < lines.length && lines[idx].startsWith('>')) {
    const line = lines[idx].startsWith('> ')
      ? lines[idx].slice(2)
      : lines[idx].slice(1);
    blockquoteBodyLines.push(line);
    idx += 1;
  }

  const blockquoteBody = blockquoteBodyLines.join('\n').trim();
  const firstBlockquotePara = getFirstBlockquoteParagraph(blockquoteBody);

  if (!areTextsSimilar(postH1Text, firstBlockquotePara)) {
    return false;
  }

  const h1Idx = Array.from({ length: postH1Start }).findIndex((_, i) =>
    lines[i].startsWith('#'),
  );

  const newLines = [
    ...lines.slice(0, h1Idx),
    '# NO DESCRIPTION!!!!',
    '',
    ...lines.slice(separatorIdx),
  ];

  const newContent = newLines.join('\n');
  fs.writeFileSync(filePath, newContent, 'utf-8');

  return true;
};

/**
 * Main: process all spell files.
 *
 * @returns {Promise<void>}
 */
async function main(): Promise<void> {
  const spellDir = path.resolve(process.cwd(), 'en/spells');
  const files = fs.readdirSync(spellDir).filter((f) => f.endsWith('.mdx'));

  log.message(`Found ${files.length} spell files to check.`);

  let fixed = 0;
  for (const file of files) {
    const filePath = path.join(spellDir, file);
    if (processSpellFile(filePath)) {
      fixed += 1;
      log.message(`Fixed: ${file}`);
    }
  }

  log.message(`Fixed ${fixed} spells with duplicate H1/description.`);
}

main().catch((err) => {
  log.error('Fatal error', { error: String(err) });
  process.exit(1);
});
