/**
 * @fileoverview Detects and fixes false-negative skipped spells.
 * Finds spells that were never touched since the clean commit (6b97754),
 * meaning they have rules text that should have been moved to blockquote.
 * Moves their post-H1 rules text into the blockquote body and replaces
 * post-H1 with a placeholder.
 *
 * @module scripts/migration/fixSkippedRulesText
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { parseSpellMdx, reconstructSpellMdx } from './spellRefactorSwarm/parser';

const log = createLogger({ component: 'FixSkippedRulesText' });

const CONTENT_DIR = path.join(process.cwd(), 'src/content/en/spells');
const CLEAN_COMMIT = '6b97754cc407de7aafc6e075ee6a0e0de54450b1';
const BASE_COMMIT = 'bfa7f8cb57e5f3b9fcc7a002af0093cf0e84c97e';

/**
 * Gets all spell files added since the base commit.
 */
function getAllAddedSpells(): Set<string> {
  try {
    const output = execSync(
      `cd src/content && git diff --name-only ${BASE_COMMIT}...HEAD`,
      { encoding: 'utf-8' },
    );
    const files = output
      .trim()
      .split('\n')
      .filter((f) => f.includes('en/spells/') && f.endsWith('.mdx'))
      .map((f) => path.basename(f, '.mdx'));
    return new Set(files);
  } catch {
    return new Set();
  }
}

/**
 * Gets all spells touched since the clean commit.
 */
function getEditedSinceClean(): Set<string> {
  try {
    const output = execSync(
      `cd src/content && git diff --name-only ${CLEAN_COMMIT}...HEAD`,
      { encoding: 'utf-8' },
    );
    const files = output
      .trim()
      .split('\n')
      .filter((f) => f.includes('en/spells/') && f.endsWith('.mdx'))
      .map((f) => path.basename(f, '.mdx'));
    return new Set(files);
  } catch {
    return new Set();
  }
}

async function main() {
  log.message('Detecting false-negative skipped spells...');

  const allAdded = getAllAddedSpells();
  const edited = getEditedSinceClean();

  const skipped = new Set([...allAdded].filter((s) => !edited.has(s)));

  log.message(`Total added: ${allAdded.size}, edited: ${edited.size}, skipped: ${skipped.size}`);

  if (skipped.size === 0) {
    log.message('No skipped spells to fix.');
    return;
  }

  log.message(`Processing ${skipped.size} false-negative spells...`);

  let fixed = 0;
  for (const slug of Array.from(skipped).sort()) {
    const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = parseSpellMdx(content);

      if (!parsed || !parsed.postH1Text.trim()) {
        continue;
      }

      const newContent = reconstructSpellMdx(parsed, 'NO DESCRIPTION!!!', true);
      await fs.writeFile(filePath, newContent, 'utf-8');

      log.message(`Moved rules text to blockquote: ${slug}`);
      fixed++;
    } catch (error) {
      log.error(`Failed to process ${slug}: ${(error as Error).message}`);
    }
  }

  log.message(`Fixed ${fixed} spells.`);
}

main().catch((error) => {
  log.error('Fatal error:', (error as Error).message);
  process.exit(1);
});
