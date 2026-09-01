/**
 * @fileoverview Normalizes trait and action headings in monster stat block files.
 * Converts markdown headings to H4/H5.
 *
 * @module scripts/utils/standardizeTraitHeadings
 * @version 1.0.0
 * @since 1.0.0
 *
 * @example
 * ```bash
 * npx tsx scripts/utils/standardizeTraitHeadings.ts
 * ```
 */

import { createLogger } from '@/lib/logging/logger';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const log = createLogger({ script: 'standardizeTraitHeadings' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path to the monsters content directory. */
const MONSTERS_DIR = path.join(__dirname, '../../src/content/en/monsters');

/**
 * Standardizes trait headings in a single monster file.
 *
 * @param filePath - Absolute path to the .sheet.mdx file
 * @returns The processed file content
 */
async function standardizeFile(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  const result: string[] = [];
  let inTraitsOrActionsSection = false;
  let sectionLevel: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (
      trimmed.match(
        /^##\s+(Traits|Actions|Reactions|Legendary Actions|Lair Actions|Battlefield Actions|Legendary Deed: Phase|Minor Actions)/,
      )
    ) {
      inTraitsOrActionsSection = true;
      sectionLevel = 2;
      result.push(line);
      continue;
    }

    if (trimmed.match(/^###\s+(Traits|Actions|Reactions|Legendary Actions)/)) {
      inTraitsOrActionsSection = true;
      sectionLevel = 3;
      result.push(line);
      continue;
    }

    if (inTraitsOrActionsSection && trimmed.match(/^##[^#]/)) {
      inTraitsOrActionsSection = false;
      sectionLevel = null;
    }

    if (
      inTraitsOrActionsSection &&
      sectionLevel === 3 &&
      trimmed.match(/^##/)
    ) {
      inTraitsOrActionsSection = false;
      sectionLevel = null;
    }

    if (inTraitsOrActionsSection) {
      if (sectionLevel === 2 && trimmed.match(/^###\s+[A-Z]/)) {
        const heading = trimmed.replace(/^###\s+/, '').replace(/\.$/, '');
        result.push(`#### ${heading}`);
        continue;
      }

      if (sectionLevel === 3 && trimmed.match(/^####\s+[A-Z]/)) {
        const heading = trimmed.replace(/^####\s+/, '').replace(/\.$/, '');
        result.push(`##### ${heading}`);
        continue;
      }

      const boldTraitMatch = trimmed.match(/^\*\*([A-Z][^*]+)\.\*\*\s*(.*)$/);
      if (boldTraitMatch) {
        const traitName = boldTraitMatch[1].trim();
        const restOfLine = boldTraitMatch[2].trim();

        if (sectionLevel === 2) {
          result.push(`#### ${traitName}`);
        } else if (sectionLevel === 3) {
          result.push(`##### ${traitName}`);
        }

        if (restOfLine) {
          result.push('');
          result.push(restOfLine);
        }
        continue;
      }
    }

    result.push(line);
  }

  return result.join('\n');
}

/**
 * Main entry point - processes all monster sheet files.
 */
async function main(): Promise<void> {
  const files = await fs.readdir(MONSTERS_DIR);
  const sheetFiles = files.filter((f) => f.endsWith('.sheet.mdx'));

  let processedCount = 0;
  let changedCount = 0;

  for (const file of sheetFiles) {
    const filePath = path.join(MONSTERS_DIR, file);
    const original = await fs.readFile(filePath, 'utf-8');
    const updated = await standardizeFile(filePath);

    if (original !== updated) {
      await fs.writeFile(filePath, updated, 'utf-8');
      log.message('✓ Updated', { path: file });
      changedCount++;
    } else {
      log.message('No change', { path: file });
    }
    processedCount++;
  }

  log.message('Processing complete', {
    changed: changedCount,
    total: processedCount,
  });
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  log.error('Fatal error', { error: msg });
});
