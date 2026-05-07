#!/usr/bin/env npx tsx
/**
 * @fileoverview Deduplicate blockquote content in spell files (V2).
 * Handles consecutive line duplicates where same text appears on adjacent lines.
 * @module scripts/migration/deduplicateDescriptionsV2
 * @author Copilot
 * @version 2.0.0
 * @since 2026-05-07
 */

import { createLogger } from '@/lib/logging/logger';
import { execSync } from 'child_process';
import { distance } from 'fastest-levenshtein';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger({ script: 'DeduplicateDescriptionsV2' });

/**
 * Calculate text similarity using Levenshtein distance.
 *
 * @param {string} text1 - First text
 * @param {string} text2 - Second text
 * @returns {number} Similarity 0-1 (1 = identical)
 */
function fuzzyTextSimilarity(text1: string, text2: string): number {
  const s1 = text1.toLowerCase().trim();
  const s2 = text2.toLowerCase().trim();

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const len1 = s1.length;
  const s2Substring = s2.substring(0, len1);
  const maxLen = len1;
  const dist = distance(s1, s2Substring);

  return 1 - dist / maxLen;
}

/**
 * Get all changed spell files from commit 08377b7.
 *
 * @returns {string[]} Array of file paths
 */
function getChangedFiles(): string[] {
  try {
    const output = execSync(
      'git show --name-only --pretty=format: 08377b7c87a14b9f0137ec75d97a2eda6025935b',
      { cwd: path.resolve(__dirname, '../../src/content'), encoding: 'utf-8' },
    );
    return output
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.endsWith('.mdx') && line.includes('/spells/'));
  } catch (error) {
    logger.error(`Failed to get changed files: ${error}`);
    return [];
  }
}

/**
 * Remove duplicate blockquote lines and paragraphs from spell content.
 *
 * @param {string} content - Raw file content
 * @returns {string} Deduplicated content
 */
function deduplicateSpellContent(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let inBlockquote = false;
  let blockquoteStartIdx = -1;
  const seenContentLines = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    /** Track blockquote state. */
    if (line.startsWith('>')) {
      if (!inBlockquote) {
        inBlockquote = true;
        blockquoteStartIdx = result.length;
      }
    } else if (inBlockquote && line.trim() !== '') {
      inBlockquote = false;
      seenContentLines.clear();
    }

    /** Extract clean content from blockquote lines. */
    if (inBlockquote && line.startsWith('>')) {
      const cleanContent = line.replace(/^\s*>\s?/, '').trim();

      /** Skip empty blockquote lines. */
      if (!cleanContent || line.trim() === '>') {
        result.push(line);
        continue;
      }

      /** Skip stat block metadata (**, _, etc). */
      if (cleanContent.startsWith('**') || cleanContent.startsWith('_')) {
        result.push(line);
        seenContentLines.clear();
        continue;
      }

      /** Check if this content line has been seen before. */
      if (seenContentLines.has(cleanContent)) {
        /** Skip duplicate content line. */
        continue;
      }

      seenContentLines.add(cleanContent);
    } else {
      seenContentLines.clear();
    }

    result.push(line);
  }

  return result.join('\n');
}

async function main(): Promise<void> {
  const files = getChangedFiles();
  logger.message(`Found ${files.length} files to check.`);

  let fixedCount = 0;

  for (const relPath of files) {
    const filePath = path.resolve(__dirname, '../../src/content', relPath);

    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const cleaned = deduplicateSpellContent(raw);

      if (raw !== cleaned) {
        fs.writeFileSync(filePath, cleaned, 'utf-8');
        fixedCount++;
        logger.message(`Deduplicated: ${path.basename(filePath)}`);
      }
    } catch (error) {
      logger.error(`Failed to process ${path.basename(filePath)}: ${error}`);
    }
  }

  logger.message(`Deduplicated ${fixedCount} spells.`);
}

main().catch((error) => {
  logger.error(`Fatal error: ${error}`);
  process.exit(1);
});

