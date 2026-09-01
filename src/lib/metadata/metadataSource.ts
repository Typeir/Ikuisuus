/**
 * @fileoverview Reads `.metadata.json` sidecars for the sync layer.
 * @description Thin wrapper over the fs adapter reader, adding the
 * source-presence flag the sync targets consume. Reads recursively from
 * `.meta/{locale}/{subdir}`, falling back to `src/content/{locale}/{subdir}`.
 *
 * @module lib/metadata/metadataSource
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { readMetadataFiles as readMetadataRecords } from '@/lib/db/content/adapters/fs/readMetadataFiles';

/**
 * Flattened sidecar records from one subdirectory.
 *
 * @property {Record<string, unknown>[]} records - Flattened sidecar records
 * @property {boolean} sourceExists - True when any sidecar records were found
 */
export interface MetadataSourceRead {
  records: Record<string, unknown>[];
  sourceExists: boolean;
}

/**
 * Reads and flattens every `.metadata.json` file in a locale subdirectory,
 * nested sidecars included.
 *
 * @param {string} locale - Locale code
 * @param {string} subdir - Content subdirectory, e.g. `spells` or `items/trinkets`
 * @returns {Promise<MetadataSourceRead>} Flattened records and source presence flag
 */
export async function readMetadataFiles(
  locale: string,
  subdir: string,
): Promise<MetadataSourceRead> {
  const records = await readMetadataRecords<Record<string, unknown>>(
    locale,
    subdir,
  );
  return { records, sourceExists: records.length > 0 };
}
