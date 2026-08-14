/**
 * @fileoverview Metadata Sidecar Cleaner
 * @description Removes every `*.metadata.json` sidecar under `src/content/`
 * and `scripts/core/`, and deletes the `.meta/en` and `.meta/runtime` trees.
 *
 * @module scripts/metadata/cleanMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/metadata/cleanMetadata.ts
 */

import { promises as fs } from 'fs';
import path from 'path';

const ROOT = process.cwd();

/**
 * Recursively deletes files matching a suffix under a directory.
 *
 * @param {string} dir - Directory to walk
 * @param {string} suffix - Filename suffix to match (e.g. `.metadata.json`)
 * @returns {Promise<number>} Number of files deleted
 */
async function deleteBySuffix(dir: string, suffix: string): Promise<number> {
  let deleted = 0;
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      deleted += await deleteBySuffix(full, suffix);
    } else if (entry.isFile() && entry.name.endsWith(suffix)) {
      await fs.rm(full, { force: true });
      deleted++;
    }
  }
  return deleted;
}

/**
 * Entry point: removes sidecars and `.meta` output trees.
 *
 * @returns {Promise<void>}
 */
async function main(): Promise<void> {
  const contentDeleted = await deleteBySuffix(
    path.join(ROOT, 'src', 'content'),
    '.metadata.json',
  );
  const coreDeleted = await deleteBySuffix(
    path.join(ROOT, 'scripts', 'core'),
    '.metadata.json',
  );
  for (const metaSub of ['en', 'runtime']) {
    await fs.rm(path.join(ROOT, '.meta', metaSub), {
      recursive: true,
      force: true,
    });
  }
  process.stdout.write(
    `[clean-metadata] Removed ${contentDeleted} sidecars from src/content, ` +
      `${coreDeleted} from scripts/core, and .meta/en + .meta/runtime.\n`,
  );
}

main().catch((err) => {
  process.stderr.write(`[clean-metadata] Fatal: ${err.message}\n`);
  process.exit(1);
});
