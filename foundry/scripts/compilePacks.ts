/**
 * @fileoverview Compile Foundry VTT packs
 * @description Compiles _source directories into LevelDB pack files for
 * monsters, heirlooms, spells, and trinkets modules.
 *
 * @module foundry/scripts/compilePacks
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import { compilePack } from '@foundryvtt/foundryvtt-cli';
import fs from 'fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const log = createLogger({ component: 'PackCompiler' });

/** Workspace root directory, resolved relative to this script's location. */
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Compiles all configured packs.
 *
 * @returns {Promise<void>}
 */
async function main(): Promise<void> {
  const packs = ['monsters', 'heirlooms', 'spells', 'trinkets'];

  for (const p of packs) {
    const sourceDir = join(ROOT, 'foundry/packs/_source', p);
    if (!fs.existsSync(sourceDir)) {
      continue;
    }

    try {
      await compilePack(sourceDir, join(ROOT, 'foundry/packs', p), {
        log: true,
      });
    } catch (e) {
      const error = e as Record<string, unknown>;
      if (error.code === 'LEVEL_ITERATOR_NOT_OPEN') {
        log.message(
          '⚠ LevelDB iterator warning (benign) — pack written successfully.',
        );
      } else {
        throw e;
      }
    }
  }
}

main().catch((error) => {
  log.error('Pack compilation failed', { error });
  process.exit(1);
});
