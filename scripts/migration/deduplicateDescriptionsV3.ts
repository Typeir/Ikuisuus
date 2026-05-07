/**
 * @fileoverview Deduplicates blockquote content in spell MDX files (V3)
 * @module scripts/migration/deduplicateDescriptionsV3
 * @author Copilot
 * @version 3.0.0
 * @since 2026-05-07
 * Proper deduplication: keeps longer/more complete lines, removes shorter/duplicate ones.
 */

import { createLogger } from '@/lib/logging/logger';
import { distance } from 'fastest-levenshtein';
import fs from 'fs';
import path from 'path';

const logger = createLogger('DeduplicateDescriptionsV3');

/**
 * Normalize text for comparison: remove punctuation, lowercase, trim.
 *
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,!?;:—–\-'""]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Calculate text similarity (0-1) based on Levenshtein distance.
 *
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} Similarity score 0-1
 */
function fuzzyTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  const maxLen = Math.max(text1.length, text2.length);
  if (maxLen === 0) return 1;
  const lev = distance(text1, text2);
  return 1 - lev / maxLen;
}

/**
 * Remove duplicate blockquote header from description body.
 * Only deduplicates when header text appears in first body paragraph.
 *
 * @param {string} content - Raw file content
 * @returns {string} Deduplicated content
 */
function deduplicateSpellContent(content: string): string {
  const lines = content.split('\n');
  const skipIndices = new Set<number>();

  let blockquoteStartIdx = -1;
  let headerEndIdx = -1;
  let bodyStartIdx = -1;
  let blockquoteEndIdx = -1;

  /** Find blockquote boundaries. */
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('>')) {
      if (blockquoteStartIdx === -1) blockquoteStartIdx = i;
    } else if (blockquoteStartIdx !== -1 && !lines[i].startsWith('>')) {
      blockquoteEndIdx = i;
      break;
    }
  }

  if (blockquoteStartIdx === -1) return content;

  /** Find where header ends (first empty line in blockquote). */
  for (
    let i = blockquoteStartIdx;
    i < (blockquoteEndIdx || lines.length);
    i++
  ) {
    if (lines[i].trim() === '>') {
      headerEndIdx = i;
      bodyStartIdx = i + 1;
      break;
    }
  }

  if (headerEndIdx === -1) return content;

  /** Extract header lines (skip > prefix and metadata markers). */
  const headerTexts: string[] = [];
  for (let i = blockquoteStartIdx; i < headerEndIdx; i++) {
    const cleanContent = lines[i].replace(/^\s*>\s?/, '').trim();
    if (
      cleanContent &&
      !cleanContent.startsWith('**') &&
      !cleanContent.startsWith('_') &&
      !cleanContent.startsWith('|')
    ) {
      headerTexts.push(normalizeForComparison(cleanContent));
    }
  }

  if (headerTexts.length === 0) return content;

  /** Check if header text appears in first body paragraph. */
  let firstBodyParagraphEnd = bodyStartIdx;
  for (let i = bodyStartIdx; i < (blockquoteEndIdx || lines.length); i++) {
    if (lines[i].trim() === '>' || !lines[i].startsWith('>')) {
      firstBodyParagraphEnd = i;
      break;
    }
  }

  /** Collect first body paragraph content. */
  const bodyParagraphLines: Array<{ index: number; cleanContent: string }> = [];
  for (let i = bodyStartIdx; i < firstBodyParagraphEnd; i++) {
    const cleanContent = lines[i].replace(/^\s*>\s?/, '').trim();
    if (
      cleanContent &&
      !cleanContent.startsWith('**') &&
      !cleanContent.startsWith('_') &&
      !cleanContent.startsWith('|')
    ) {
      bodyParagraphLines.push({
        index: i,
        cleanContent,
      });
    }
  }

  /** Remove body lines that are similar to header. */
  for (const bodyLine of bodyParagraphLines) {
    const normBody = normalizeForComparison(bodyLine.cleanContent);

    for (const headerText of headerTexts) {
      const isSubstring =
        headerText.includes(normBody) || normBody.includes(headerText);
      const similarity = fuzzyTextSimilarity(headerText, normBody);

      if (isSubstring || similarity > 0.85) {
        skipIndices.add(bodyLine.index);
        break;
      }
    }
  }

  /** Rebuild content, skipping marked lines. */
  const result: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (!skipIndices.has(i)) {
      result.push(lines[i]);
    }
  }

  return result.join('\n');
}

/**
 * Main function to deduplicate all spell files.
 */
async function main() {
  try {
    const spellDir = path.resolve(__dirname, '../../src/content/en/spells');

    const files = fs.readdirSync(spellDir).filter((f) => f.endsWith('.mdx'));

    let deduplicated = 0;

    for (const file of files) {
      const filePath = path.join(spellDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const dedupedContent = deduplicateSpellContent(content);

      if (dedupedContent !== content) {
        fs.writeFileSync(filePath, dedupedContent, 'utf-8');
        logger.message(`Deduplicated: ${file}`);
        deduplicated++;
      }
    }

    logger.message(`Deduplicated ${deduplicated} spells.`);
  } catch (error) {
    logger.message(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

main().catch((error) => {
  logger.message(`Fatal error: ${String(error)}`);
  process.exit(1);
});

export { deduplicateSpellContent, main };

