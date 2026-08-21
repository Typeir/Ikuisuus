/**
 * @fileoverview Incremental sync of `bloodlines` and `bloodline_boons` tables.
 *
 * @module lib/metadata/syncBloodlines
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import { readMetadataFiles } from './metadataSource';
import type { BloodlineBoonSubOption } from '@/lib/db/content/schemas/bloodlineMetadata';
import {
  BloodlineBoonEntity,
  BloodlineBoonOptionEntity,
  BloodlineEntity,
} from '@/lib/db/orm/entities';
import { createLogger } from '@/lib/logging/logger';
import type { EntityManager } from '@mikro-orm/postgresql';
import { join } from 'path';
import type { SyncOptions, SyncResult } from './types';

const log = createLogger({ component: 'MetadataSync:Bloodlines' });

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
  options: SyncOptions = {},
): Promise<SyncResult> {
  const { records: rawRecords, sourceExists } = options.records
    ? { records: options.records, sourceExists: true }
    : readMetadataFiles(locale, join('character-creation', 'bloodlines'));
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
