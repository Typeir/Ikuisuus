/**
 * @fileoverview CLI Runner for Metadata Generators
 * @description Wraps generator main functions with `--persist` flag handling,
 * creating a storage adapter from DATABASE_URL when persistence is requested.
 *
 * @module lib/metadata/cliRunner
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import type { StorageAdapter } from './generatorUtils';

const log = createLogger({ component: 'metadata-cli' });

/**
 * Wraps a generator main function with CLI --persist flag handling.
 * Creates a storage adapter from DATABASE_URL when --persist is present.
 *
 * @param {Function} mainFn - Generator main function receiving { storage? }
 * @returns {Promise<void>}
 */
export async function runWithCli(
  mainFn: (options: { storage?: StorageAdapter }) => Promise<void>,
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
    await mainFn({ storage: storage ?? undefined });
  } finally {
    if (storage) await storage.close();
  }
}
