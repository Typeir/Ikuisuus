/**
 * @fileoverview Patch External Spell Metadata — Add source field
 * @description One-shot script that reads `scripts/core/spells-external.metadata.json`,
 * adds `"source": "basic"` to every entry, and writes the file back in place.
 *
 * Run once after adding the `source` column to `SpellEntity` and the DB.
 * Safe to re-run — idempotent when `source` is already present.
 *
 * @module scripts/migration/patchExternalMetadata
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const FILE = resolve('scripts', 'core', 'spells-external.metadata.json');

/**
 * Reads the external spell metadata JSON, injects `source: "basic"` on every
 * entry, and writes the result back to the same file.
 *
 * @returns {void}
 */
function patch(): void {
  const raw = readFileSync(FILE, 'utf8');
  const entries: Record<string, unknown>[] = JSON.parse(raw);

  let patched = 0;
  for (const entry of entries) {
    if (entry['source'] !== 'basic') {
      entry['source'] = 'basic';
      patched++;
    }
  }

  writeFileSync(FILE, JSON.stringify(entries, null, 2), 'utf8');
  process.stdout.write(`Patched ${patched} entries — source: "basic" added.\n`);
}

patch();
