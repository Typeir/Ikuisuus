#!/usr/bin/env npx tsx
/**
 * @fileoverview Remove orphaned blockquote lines from spell files.
 * Removes empty or whitespace-only blockquote lines that appear after the stat block.
 * @module scripts/migration/removeOrphanedBlockquoteLines
 * @author Copilot
 * @version 1.0.0
 * @since 2026-05-07
 */

import { createLogger } from '@/lib/logging/logger';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger({ script: 'RemoveOrphanedBlockquoteLines' });

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
 * Remove orphaned blockquote lines from spell content.
 * Removes extra consecutive empty blockquote lines, keeping only one as a separator.
 *
 * @param {string} content - Raw MDX content
 * @returns {string} Cleaned content
 */
function removeOrphanedBlockquoteLines(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let consecutiveEmptyBQ = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim() === '>') {
      consecutiveEmptyBQ++;
      /** Keep the first empty blockquote line as a separator; skip extras. */
      if (consecutiveEmptyBQ === 1) {
        result.push(line);
      }
    } else {
      consecutiveEmptyBQ = 0;
      result.push(line);
    }
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
      const cleaned = removeOrphanedBlockquoteLines(raw);

      if (raw !== cleaned) {
        fs.writeFileSync(filePath, cleaned, 'utf-8');
        fixedCount++;
        logger.message(`Removed orphaned blockquote lines: ${path.basename(filePath)}`);
      }
    } catch (error) {
      logger.error(`Failed to process ${path.basename(filePath)}: ${error}`);
    }
  }

  logger.message(`Removed orphaned blockquote lines from ${fixedCount} spells.`);
}

main().catch((error) => {
  logger.error(`Fatal error: ${error}`);
  process.exit(1);
});
