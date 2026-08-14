/**
 * @fileoverview Hash-based incremental sync of the `trinkets` table
 * from local metadata sidecars into PostgreSQL via MikroORM.
 *
 * @module lib/metadata/syncTrinkets
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import { TrinketEntity } from '@/lib/db/orm/entities';
import { createLogger } from '@/lib/logging/logger';
import type { EntityManager } from '@mikro-orm/postgresql';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import type { SyncResult } from './types';

const log = createLogger({ component: 'MetadataSync:Trinkets' });

/**
 * Resolves the root directory of the project.
 *
 * @returns {string} Absolute path to project root
 */
function getProjectRoot(): string {
  return join(__dirname, '..', '..', '..');
}

/**
 * Reads and flattens `.metadata.json` files from a locale subdirectory.
 * Checks `.meta/{locale}/{subdir}` first, falls back to `src/content/{locale}/{subdir}`.
 *
 * Returns `sourceExists: false` when neither directory exists or the chosen
 * directory contains no `.metadata.json` files.
 *
 * @param {string} locale - Locale code
 * @param {string} subdir - Content subdirectory
 * @returns {{ records: Record<string, unknown>[]; sourceExists: boolean }} Flattened records and source presence flag
 */
function readMetadataFiles(
  locale: string,
  subdir: string,
): { records: Record<string, unknown>[]; sourceExists: boolean } {
  const root = getProjectRoot();
  const metaDirPath = join(root, '.meta', locale, subdir);
  const contentDirPath = join(/*turbopackIgnore: true*/ root, 'src', 'content', locale, subdir);
  const metaExists = existsSync(metaDirPath);
  const contentExists = existsSync(contentDirPath);
  const dir = metaExists ? metaDirPath : contentDirPath;
  const sourceExists = metaExists || contentExists;

  if (!sourceExists) return { records: [], sourceExists: false };

  const metaFiles = readdirSync(dir).filter((f) => f.endsWith('.metadata.json'));

  if (metaFiles.length === 0) return { records: [], sourceExists: false };

  const records = metaFiles.flatMap((f) => {
    const parsed = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    return Array.isArray(parsed) ? parsed : [parsed];
  });

  return { records, sourceExists: true };
}

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
): Promise<SyncResult> {
  const { records, sourceExists } = readMetadataFiles(
    locale,
    join('items', 'trinkets'),
  );
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

  for (const [key, entity] of Array.from(existingMap)) {
    if (!incomingKeys.has(key)) {
      em.remove(entity);
      result.deleted++;
    }
  }

  return result;
}
