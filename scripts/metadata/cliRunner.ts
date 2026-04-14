/**
 * @fileoverview CLI Runner for Metadata Generators
 * @description Wraps generator main functions with `--persist` and `--file`
 * flag handling. Creates a storage adapter when persistence is requested,
 * and narrows generation to a single source file when `--file` is provided.
 *
 * @module lib/metadata/cliRunner
 * @version 1.1.0
 * @author Typeir
 * @since 3.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import type { StorageAdapter } from './generatorUtils';

const log = createLogger({ component: 'metadata-cli' });

/**
 * Options passed from CLI to generator main functions.
 *
 * @interface CliOptions
 * @property {StorageAdapter} [storage] - Database storage adapter (--persist)
 * @property {string} [fileFilter] - Single filename to process (--file)
 */
export interface CliOptions {
  storage?: StorageAdapter;
  fileFilter?: string;
}

/**
 * Parses `--file <filename>` from process.argv.
 *
 * @returns {string | undefined} Filename if provided
 */
function parseFileArg(): string | undefined {
  const idx = process.argv.indexOf('--file');
  if (idx === -1 || idx + 1 >= process.argv.length) return undefined;
  return process.argv[idx + 1];
}

/**
 * Wraps a generator main function with CLI flag handling.
 * Supports `--persist` for database storage and `--file <name>` for
 * single-file generation.
 *
 * @param {Function} mainFn - Generator main function receiving CLI options
 * @returns {Promise<void>}
 */
export async function runWithCli(
  mainFn: (options: CliOptions) => Promise<void>,
): Promise<void> {
  let storage: StorageAdapter | null = null;
  try {
    if (process.argv.includes('--persist')) {
      const storagePath = '../../../../scripts/core/metadataStorage';
      const { createStorageFromEnv } = await import(
        /* webpackIgnore: true */
        storagePath
      );
      storage = (await createStorageFromEnv()) as StorageAdapter;
      log.message('--persist flag detected, database storage enabled');
    }
    const fileFilter = parseFileArg();
    if (fileFilter) {
      log.message(`--file filter: ${fileFilter}`);
    }
    await mainFn({ storage: storage ?? undefined, fileFilter });
  } finally {
    if (storage) await storage.close();
  }
}
