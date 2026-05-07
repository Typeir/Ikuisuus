/**
 * @fileoverview Removes post-H1 text when it's already duplicated in the blockquote body.
 * When the post-H1 text matches the first paragraph of the blockquote, this script
 * removes it to eliminate redundancy.
 *
 * @module scripts/migration/removePostH1DuplicatesInBlockquote
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import fs from 'fs';
import path from 'path';

const log = createLogger({ script: 'RemovePostH1DuplicatesInBlockquote' });

/**
 * Normalize text for comparison: lowercase, trim whitespace, remove punctuation.
 *
 * @param {string} text - Text to normalize.
 * @returns {string} Normalized text for comparison.
 */
const normalizeForComparison = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:—–\-'"""""]/g, '')
    .replace(/\s+/g, ' ');
};

/**
 * Extract the first paragraph from blockquote body (before first double newline).
 *
 * @param {string} blockquoteBody - Full blockquote body text.
 * @returns {string} First paragraph or empty string.
 */
const getFirstBlockquoteParagraph = (blockquoteBody: string): string => {
  const match = blockquoteBody.match(/^([^\n]+(?:\n[^\n]+)*?)(?:\n\n|$)/);
  return match ? match[1].trim() : '';
};

/**
 * Process a single spell file and remove post-H1 text if it duplicates the blockquote.
 *
 * @param {string} filePath - Path to the spell MDX file.
 * @returns {Promise<boolean>} True if file was modified.
 */
const processSpellFile = async (filePath: string): Promise<boolean> => {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const lines = raw.split('\n');

  let idx = 0;

  if (lines[0].trim() === '---') {
    idx = 1;
    while (idx < lines.length && lines[idx].trim() !== '---') idx++;
    idx += 1;
  }

  while (idx < lines.length && !lines[idx].startsWith('#')) idx++;
  if (idx >= lines.length) return false;
  idx += 1;

  while (idx < lines.length && lines[idx].trim() === '') idx++;

  const postH1Start = idx;
  while (
    idx < lines.length &&
    lines[idx].trim() !== '' &&
    !lines[idx].startsWith('---')
  ) {
    idx += 1;
  }

  if (idx === postH1Start) return false;

  const postH1End = idx;
  const postH1Text = lines.slice(postH1Start, postH1End).join('\n').trim();

  while (idx < lines.length && lines[idx].trim() !== '---') idx++;
  if (idx >= lines.length) return false;
  idx += 1;

  while (idx < lines.length && lines[idx].trim() === '') idx++;

  const blockquoteStart = idx;
  let inHeader = true;
  let blockquoteBodyStart = idx;
  while (idx < lines.length && lines[idx].trim() !== '') {
    if (inHeader && lines[idx].trim() === '>') {
      inHeader = false;
      blockquoteBodyStart = idx + 1;
      break;
    }
    idx += 1;
  }

  if (blockquoteBodyStart >= lines.length) return false;

  const blockquoteBodyLines: string[] = [];
  idx = blockquoteBodyStart;
  while (idx < lines.length && lines[idx].startsWith('>')) {
    const line = lines[idx].startsWith('> ')
      ? lines[idx].slice(2)
      : lines[idx].slice(1);
    blockquoteBodyLines.push(line);
    idx += 1;
  }

  const blockquoteBody = blockquoteBodyLines.join('\n').trim();
  const firstBlockquotePara = getFirstBlockquoteParagraph(blockquoteBody);

  const postH1Normalized = normalizeForComparison(postH1Text);
  const blockquoteNormalized = normalizeForComparison(firstBlockquotePara);

  if (postH1Normalized !== blockquoteNormalized) {
    return false;
  }

  lines.splice(postH1Start, postH1End - postH1Start);

  const newContent = lines.join('\n');
  fs.writeFileSync(filePath, newContent, 'utf-8');

  return true;
};

/**
 * Main entry point: iterate all spell files and remove post-H1 duplicates.
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
    if (await processSpellFile(filePath)) {
      fixed += 1;
      log.message(`Fixed: ${file}`);
    }
  }

  log.message(`Removed post-H1 duplicates from ${fixed} spells.`);
}

main().catch((err) => {
  log.error('Fatal error', { error: String(err) });
  process.exit(1);
});
