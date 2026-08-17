/**
 * @fileoverview Hash-based incremental sync of `bloodlines` and
 * `bloodline_boons` from local metadata sidecars into PostgreSQL.
 *
 * @module lib/metadata/syncBloodlines
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import type { BloodlineBoonSubOption } from '@/lib/db/content/schemas/bloodlineMetadata';
import {
  BloodlineBoonEntity,
  BloodlineBoonOptionEntity,
  BloodlineEntity,
} from '@/lib/db/orm/entities';
import { createLogger } from '@/lib/logging/logger';
import type { EntityManager } from '@mikro-orm/postgresql';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import type { SyncResult } from './types';

const log = createLogger({ component: 'MetadataSync:Bloodlines' });

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

/**
 * Syncs the `bloodlines` + `bloodline_boons` tables for one locale.
 *
 * @param {EntityManager} em - Transaction-scoped entity manager
 * @param {string} locale - Locale code
 * @returns {Promise<SyncResult>} Sync statistics
 */
/**
 * Creates a boon row and its option rows from a generated boon record.
 *
 * @param {EntityManager} em - Entity manager
 * @param {BloodlineEntity} bloodline - Owning bloodline
 * @param {Record<string, unknown>} boon - Generated boon record
 */
function createBoon(
  em: EntityManager,
  bloodline: BloodlineEntity,
  boon: Record<string, unknown>,
): void {
  const row = em.create(BloodlineBoonEntity, {
    bloodline,
    name: boon.name as string,
    anchor: (boon.anchor as string | undefined) ?? null,
    parentName: (boon.parentName as string | undefined) ?? null,
    bpLabel: boon.bpLabel as string,
    bpValue: boon.bpValue as number | undefined,
    sortOrder: boon.sortOrder as number,
    startLine: boon.startLine as number | undefined,
    endLine: boon.endLine as number | undefined,
    tags: (boon.tags as string[]) ?? [],
  });
  const options = (boon.subOptions as BloodlineBoonSubOption[] | undefined) ?? [];
  options.forEach((option, index) => {
    em.create(BloodlineBoonOptionEntity, {
      boon: row,
      name: option.name,
      anchor: option.anchor ?? null,
      bpValue: option.bpValue,
      effect: option.effect ?? null,
      tags: option.tags ?? [],
      sortOrder: index,
    });
  });
}

export async function syncBloodlines(
  em: EntityManager,
  locale: string,
): Promise<SyncResult> {
  const { records: rawRecords, sourceExists } = readMetadataFiles(
    locale,
    join('character-creation', 'bloodlines'),
  );
  const records = rawRecords.filter(Boolean);
  const result: SyncResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    deleted: 0,
  };

  if (!sourceExists) {
    log.warning(
      'Bloodline metadata source directory missing, skipping sync to prevent destructive deletion',
      { locale },
    );
    return result;
  }

  const existing = await em.find(
    BloodlineEntity,
    { locale },
    { populate: ['boons'] },
  );
  const existingMap = new Map(existing.map((e) => [e.slug, e]));
  const incomingKeys = new Set<string>();

  for (const rawRecord of records) {
    const record = rawRecord as Record<string, unknown>;
    const slug = record.slug as string;
    incomingKeys.add(slug);
    const hash = record.versionHash as string;
    const entity = existingMap.get(slug);

    if (hash && entity?.versionHash === hash) {
      result.skipped++;
      continue;
    }

    const coreFeatures =
      (record.coreFeatures as Record<string, unknown> | undefined) ?? {};
    const boonRows = (record.boons as Array<Record<string, unknown>>) ?? [];

    const data = {
      locale,
      slug,
      title: record.title as string,
      file: record.file as string,
      link: record.link as string,
      description: record.description as string | undefined,
      image: record.image as string | undefined,
      abilityScores: (coreFeatures.abilityScores as string[]) ?? [],
      movementSpeeds: (coreFeatures.movementSpeeds as string[]) ?? [],
      senses: (coreFeatures.senses as string[]) ?? [],
      size: (coreFeatures.size as string[]) ?? [],
      creatureTypes: (coreFeatures.creatureTypes as string[]) ?? [],
      age: coreFeatures.age as string | undefined,
      boonBudget: record.boonBudget as number | undefined,
      tags: (record.tags as string[]) ?? [],
      indexVersion: record.indexVersion as number | undefined,
      versionHash: hash,
    };

    if (entity) {
      em.assign(entity, data);
      entity.boons.removeAll();
      await em.flush();

      for (const boon of boonRows) {
        createBoon(em, entity, boon);
      }

      result.updated++;
    } else {
      const bloodline = em.create(BloodlineEntity, data);
      for (const boon of boonRows) {
        createBoon(em, bloodline, boon);
      }
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
