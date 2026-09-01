/**
 * Monster Metadata Bundler
 *
 * @fileoverview Aggregates individual monster metadata JSON files into a single
 * bundle for client-side import. Flattens multi-stat-block files.
 *
 * @module scripts/wip/bundleMonsterMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @example
 * ```bash
 * npx tsx scripts/wip/bundleMonsterMetadata.ts
 * ```
 */

import { createLogger } from '@/lib/logging/logger';
import fs from 'fs';
import path from 'path';

const log = createLogger({ script: 'bundleMonsterMetadata' });

/**
 * Bundles all monster metadata JSON files into a single importable JSON file.
 */
async function bundleMonsterMetadata(): Promise<void> {
  const monstersDir = path.join(
    process.cwd(),
    'src',
    'content',
    'en',
    'monsters',
  );
  const outputFile = path.join(
    process.cwd(),
    'src',
    'lib',
    'data',
    'monsters.json',
  );

  try {
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const files = fs.readdirSync(monstersDir);
    const metadataFiles = files.filter((f) => f.endsWith('.metadata.json'));

    const allMonsters = metadataFiles
      .map((file) => {
        const content = fs.readFileSync(path.join(monstersDir, file), 'utf-8');
        return JSON.parse(content);
      })
      .flat();

    fs.writeFileSync(outputFile, JSON.stringify(allMonsters, null, 2));
    log.message('✓ Bundled monsters', {
      count: allMonsters.length,
      path: outputFile,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Error bundling monster metadata', { error: msg });
    process.exit(1);
  }
}

bundleMonsterMetadata();
