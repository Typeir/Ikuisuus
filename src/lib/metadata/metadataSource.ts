/**
 * @fileoverview Reads `.metadata.json` sidecars from `.meta/{locale}/{subdir}`,
 * falling back to `src/content/{locale}/{subdir}`.
 *
 * @module lib/metadata/metadataSource
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Flattened sidecar records from one subdirectory.
 *
 * @property {Record<string, unknown>[]} records - Flattened sidecar records
 * @property {boolean} sourceExists - True when a populated source directory was found
 */
export interface MetadataSourceRead {
  records: Record<string, unknown>[];
  sourceExists: boolean;
}

/**
 * Returns the project root, three levels above this module.
 *
 * @returns {string} Absolute path to project root
 */
export function getProjectRoot(): string {
  return join(__dirname, '..', '..', '..');
}

/**
 * Reads and flattens every `.metadata.json` file in a locale subdirectory.
 *
 * @param {string} locale - Locale code
 * @param {string} subdir - Content subdirectory, e.g. `spells` or `items/trinkets`
 * @returns {MetadataSourceRead} Flattened records and source presence flag
 */
export function readMetadataFiles(
  locale: string,
  subdir: string,
): MetadataSourceRead {
  const root = getProjectRoot();
  const metaDirPath = join(root, '.meta', locale, subdir);
  const contentDirPath = join(
    /*turbopackIgnore: true*/ root,
    'src',
    'content',
    locale,
    subdir,
  );
  const metaExists = existsSync(metaDirPath);
  const contentExists = existsSync(contentDirPath);
  const dir = metaExists ? metaDirPath : contentDirPath;
  const sourceExists = metaExists || contentExists;

  if (!sourceExists) return { records: [], sourceExists: false };

  const metaFiles = readdirSync(dir).filter((f) =>
    f.endsWith('.metadata.json'),
  );

  if (metaFiles.length === 0) return { records: [], sourceExists: false };

  const records = metaFiles.flatMap((f) => {
    const parsed = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    return Array.isArray(parsed) ? parsed : [parsed];
  });

  return { records, sourceExists: true };
}
