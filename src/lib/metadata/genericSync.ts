/**
 * @fileoverview Definition-driven metadata sync.
 * @description Upserts a content table from metadata records using MikroORM
 * property metadata for the mapping, so no per-type field list exists. Entities
 * with `1:m` collections supply a static `syncChildren`.
 *
 * @module lib/metadata/genericSync
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { hasChildSync, type ChildSyncContext } from '@/lib/db/orm/childSync';
import { recordToEntityInit } from '@/lib/db/orm/reflect';
import type { EntityClass } from '@/lib/db/orm/schema/registry';
import { createLogger } from '@/lib/logging/logger';
import { ReferenceKind } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { SyncOptions, SyncResult } from './types';

const log = createLogger({ component: 'MetadataSync:Generic' });

/**
 * A content table to sync.
 *
 * @interface SyncTarget
 * @property {EntityClass} entityClass - Entity owning the table
 * @property {string} subdir - Metadata subdirectory under the locale root
 * @property {Function} readRecords - Reads records for a locale and subdirectory
 * @property {Function} [naturalKey] - Row identity within a locale; defaults to `slug`
 */
export interface SyncTarget {
  entityClass: EntityClass;
  subdir: string;
  readRecords: (
    locale: string,
    subdir: string,
  ) => { records: Record<string, unknown>[]; sourceExists: boolean };
  naturalKey?: (row: Record<string, unknown>) => string;
}

/**
 * Returns the names of an entity's `1:m` collection properties.
 *
 * @param {EntityManager} em - Entity manager
 * @param {string} className - Entity class name
 * @returns {string[]} Collection property names
 */
function collectionProps(em: EntityManager, className: string): string[] {
  const meta = em.getMetadata().get(className);
  return Object.values(meta.properties)
    .filter((p) => p.kind === ReferenceKind.ONE_TO_MANY)
    .map((p) => p.name);
}

/**
 * Builds the context passed to an entity's `syncChildren` static.
 *
 * @param {EntityManager} em - Entity manager
 * @returns {ChildSyncContext} Context bound to this entity manager
 */
function childContext(em: EntityManager): ChildSyncContext {
  return {
    init: (entityClass, record) =>
      recordToEntityInit(
        em.getMetadata(),
        (entityClass as { name: string }).name,
        record,
      ),
    create: (entityClass, data) => em.create(entityClass as never, data as never),
  };
}

/**
 * Syncs one content table for a locale, diffing on `versionHash`.
 *
 * @param {EntityManager} em - Transaction-scoped entity manager
 * @param {string} locale - Locale code
 * @param {SyncTarget} target - Table to sync
 * @param {SyncOptions} [options] - Sync options
 * @returns {Promise<SyncResult>} Sync statistics
 */
export async function syncTable(
  em: EntityManager,
  locale: string,
  target: SyncTarget,
  options: SyncOptions = {},
): Promise<SyncResult> {
  const className = (target.entityClass as { name: string }).name;
  const { records, sourceExists } = options.records
    ? { records: options.records, sourceExists: true }
    : target.readRecords(locale, target.subdir);

  const result: SyncResult = { inserted: 0, updated: 0, skipped: 0, deleted: 0 };

  if (!sourceExists) {
    log.warning('Metadata source directory missing, skipping sync', {
      locale,
      className,
    });
    return result;
  }

  const keyOf =
    target.naturalKey ?? ((row: Record<string, unknown>) => row.slug as string);
  const collections = collectionProps(em, className);
  const ctx = childContext(em);
  const existing = await em.find(target.entityClass as never, { locale });
  const existingMap = new Map(
    (existing as Array<Record<string, unknown>>).map((e) => [keyOf(e), e]),
  );
  const incomingKeys = new Set<string>();

  for (const record of records) {
    incomingKeys.add(keyOf(record));
    const hash = record.versionHash as string | undefined;
    const entity = existingMap.get(keyOf(record));

    if (hash && entity?.versionHash === hash) {
      result.skipped++;
      continue;
    }

    const init = recordToEntityInit(em.getMetadata(), className, {
      ...record,
      locale,
    });

    if (entity) {
      em.assign(entity as never, init as never);
      for (const name of collections) {
        const collection = entity[name] as { removeAll?: () => void } | undefined;
        collection?.removeAll?.();
      }
      await em.flush();
      if (hasChildSync(target.entityClass)) {
        target.entityClass.syncChildren(ctx, entity, record);
      }
      result.updated++;
    } else {
      const created = em.create(target.entityClass as never, init as never);
      if (hasChildSync(target.entityClass)) {
        target.entityClass.syncChildren(ctx, created, record);
      }
      result.inserted++;
    }
  }

  if (options.allowDeletion) {
    for (const [key, entity] of Array.from(existingMap)) {
      if (!incomingKeys.has(key)) {
        em.remove(entity as never);
        result.deleted++;
      }
    }
  }

  return result;
}
