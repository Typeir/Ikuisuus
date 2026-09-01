/**
 * @fileoverview Metadata Sync Service
 * @description Hash-based incremental sync from filesystem metadata to PostgreSQL
 * via MikroORM. Uses the app's ORM singleton (`getEM()`) and drives every content
 * type through {@link syncTable}.
 *
 * @module lib/metadata/syncService
 * @version 2.0.0
 * @author Typeir
 * @since 7.0.0
 */

import { clearServerCaches } from '@/lib/cache/registry';
import { getEM } from '@/lib/db/orm/orm';
import { createLogger } from '@/lib/logging/logger';
import { syncTable } from './genericSync';
import { SYNC_TARGETS } from './syncTargets';
import type { SyncResult } from './types';

const log = createLogger({ component: 'MetadataSync' });

/**
 * Syncs metadata for a locale into PostgreSQL.
 *
 * @param {object} [options] - Sync options
 * @param {string} [options.locale] - Locale code, defaults to `en`
 * @param {string[]} [options.contentTypes] - Content types to sync, defaults to all
 * @param {Record<string, unknown>[]} [options.records] - Records to sync instead of reading from disk
 * @param {boolean} [options.allowDeletion] - Remove rows absent from the source
 * @returns {Promise<Record<string, SyncResult>>} Per-type sync statistics
 * @throws {Error} When `records` is supplied for other than exactly one content type
 */
export async function syncMetadata(
  options: {
    locale?: string;
    contentTypes?: string[];
    records?: Record<string, unknown>[];
    allowDeletion?: boolean;
  } = {},
): Promise<Record<string, SyncResult>> {
  const locale = options.locale ?? 'en';
  const types = options.contentTypes ?? Object.keys(SYNC_TARGETS);
  const results: Record<string, SyncResult> = {};

  if (options.records && types.length !== 1) {
    throw new Error(
      `records may only be supplied for exactly one content type, got ${types.length}`,
    );
  }

  log.message('Starting metadata sync', { locale, contentTypes: types });

  const em = await getEM();

  try {
    await em.transactional(async (tx) => {
      for (const type of types) {
        const target = SYNC_TARGETS[type];
        if (!target) {
          log.warning('Unknown content type, skipping', { type });
          continue;
        }

        const result = await syncTable(tx, locale, target, {
          records: options.records,
          allowDeletion: options.allowDeletion ?? false,
        });
        results[type] = result;

        log.message(`Synced ${type}`, {
          locale,
          inserted: result.inserted,
          updated: result.updated,
          skipped: result.skipped,
          deleted: result.deleted,
        });
      }
    });
  } finally {
    em.clear();
  }

  log.message('Metadata sync complete', { locale, results });

  /* The sync rewrote metadata, so every server cache built from it is stale. */
  clearServerCaches();

  return results;
}
