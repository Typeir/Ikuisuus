/**
 * @fileoverview Hash-based incremental sync of the `trinkets` table
 * from local metadata sidecars into PostgreSQL via MikroORM.
 *
 * @module lib/metadata/syncTrinkets
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import { readMetadataFiles } from './metadataSource';
import { TrinketEntity } from '@/lib/db/orm/entities';
import { createLogger } from '@/lib/logging/logger';
import type { EntityManager } from '@mikro-orm/postgresql';
import { join } from 'path';
import type { SyncOptions, SyncResult } from './types';

const log = createLogger({ component: 'MetadataSync:Trinkets' });

/**
 * Syncs the `trinkets` table for a locale using hash-based diffing.
 *
 * @param {EntityManager} em - Transaction-scoped entity manager
 * @param {string} locale - Locale code
 * @returns {Promise<SyncResult>} Sync statistics
 */
export async function syncTrinkets(
  em: EntityManager,
  locale: string,
  options: SyncOptions = {},
): Promise<SyncResult> {
  const { records, sourceExists } = options.records
    ? { records: options.records, sourceExists: true }
    : readMetadataFiles(locale, join('items', 'trinkets'));
  const result: SyncResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    deleted: 0,
  };

  if (!sourceExists) {
    log.warning(
      'Trinket metadata source directory missing, skipping sync to prevent destructive deletion',
      { locale },
    );
    return result;
  }

  const existing = await em.find(TrinketEntity, { locale });
  const existingMap = new Map(existing.map((e) => [e.slug, e]));
  const incomingKeys = new Set<string>();

  for (const t of records) {
    const slug = t.slug as string;
    incomingKeys.add(slug);
    const hash = t.versionHash as string;
    const entity = existingMap.get(slug);

    if (hash && entity?.versionHash === hash) {
      result.skipped++;
      continue;
    }

    const data = {
      locale,
      slug,
      title: t.title as string,
      file: t.file as string,
      link: t.link as string,
      itemType: t.itemType as string,
      damage: t.damage as string | undefined,
      damageType: t.damageType as string | undefined,
      range: t.range as string | undefined,
      weight: t.weight as string | undefined,
      savingThrow: {
        dc: t.savingThrowDC as number | undefined,
        ability: t.savingThrowAbility as string | undefined,
      },
      properties: (t.properties as string[]) ?? [],
      specialEffects: (t.specialEffects as string[]) ?? [],
      inflictsConditions: (t.inflictsConditions as string[]) ?? [],
      tags: (t.tags as string[]) ?? [],
      description: t.description as string | undefined,
      image: t.image as string | undefined,
      versionHash: hash,
    };

    if (entity) {
      em.assign(entity, data);
      result.updated++;
    } else {
      em.create(TrinketEntity, data);
      result.inserted++;
    }
  }

  if (options.allowDeletion) {
    for (const [key, entity] of Array.from(existingMap)) {
      if (!incomingKeys.has(key)) {
        em.remove(entity);
        result.deleted++;
      }
    }
  }

  return result;
}
