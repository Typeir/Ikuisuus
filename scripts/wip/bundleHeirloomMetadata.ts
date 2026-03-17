/**
 * Heirloom Metadata Bundler
 *
 * @fileoverview Aggregates individual heirloom metadata JSON files into a single
 * bundle for client-side import.
 *
 * @module bundleHeirloomMetadata
 * @version 1.0.0
 * @since 1.0.0
 *
 * @example
 * ```bash
 * npx tsx scripts/wip/bundleHeirloomMetadata.ts
 * ```
 */

import { createLogger } from '@/lib/logging/logger';
import fs from 'fs';
import path from 'path';

const log = createLogger({ script: 'bundleHeirloomMetadata' });

/**
 * Bundles all heirloom metadata JSON files into a single importable JSON file.
 */
async function bundleHeirloomMetadata(): Promise<void> {
  const heirloomsDir = path.join(
    process.cwd(),
    'src',
    'content',
    'en',
    'items',
    'heirlooms',
  );
  const outputFile = path.join(
    process.cwd(),
    'src',
    'lib',
    'data',
    'heirlooms.json',
  );

  try {
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const files = fs.readdirSync(heirloomsDir);
    const metadataFiles = files.filter((f) => f.endsWith('.metadata.json'));

    const allHeirlooms = metadataFiles
      .map((file) => {
        const content = fs.readFileSync(path.join(heirloomsDir, file), 'utf-8');
        return JSON.parse(content);
      })
      .flat();

    fs.writeFileSync(outputFile, JSON.stringify(allHeirlooms, null, 2));
    log.message('✓ Bundled heirlooms', {
      count: allHeirlooms.length,
      path: outputFile,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error('Error bundling heirloom metadata', { error: msg });
    process.exit(1);
  }
}

bundleHeirloomMetadata();
