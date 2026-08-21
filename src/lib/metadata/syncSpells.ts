/**
 * @fileoverview Hash-based incremental sync of the `spells` and `spell_lists`
 * tables from metadata records into PostgreSQL via MikroORM.
 *
 * @module lib/metadata/syncSpells
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { SpellEntity, SpellListEntity } from '@/lib/db/orm/entities';
import { createLogger } from '@/lib/logging/logger';
import type { EntityManager } from '@mikro-orm/postgresql';
import { readMetadataFiles } from './metadataSource';
import type { SyncOptions, SyncResult } from './types';

const log = createLogger({ component: 'MetadataSync:Spells' });


/**
 * Syncs the `spells` + `spell_lists` tables for a locale using hash-based diffing.
 *
 * @param {EntityManager} em - Transaction-scoped entity manager
 * @param {string} locale - Locale code
 * @returns {Promise<SyncResult>} Sync statistics
 */
export async function syncSpells(
  em: EntityManager,
  locale: string,
  options: SyncOptions = {},
): Promise<SyncResult> {
  const { records, sourceExists } = options.records
    ? { records: options.records, sourceExists: true }
    : readMetadataFiles(locale, 'spells');
  const result: SyncResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    deleted: 0,
  };

  if (!sourceExists) {
    log.warning(
      'Spell metadata source directory missing, skipping sync to prevent destructive deletion',
      { locale },
    );
    return result;
  }

  const existing = await em.find(
    SpellEntity,
    { locale },
    { populate: ['spellLists'] },
  );
  const existingMap = new Map(existing.map((e) => [e.slug, e]));
  const incomingKeys = new Set<string>();

  for (const s of records) {
    const slug = s.slug as string;
    incomingKeys.add(slug);
    const hash = s.versionHash as string;
    const entity = existingMap.get(slug);

    if (hash && entity?.versionHash === hash) {
      result.skipped++;
      continue;
    }

    const spellLists = (s.spellLists ?? []) as {
      name: string;
      link: string;
    }[];

    const data = {
      locale,
      slug,
      title: s.title as string,
      file: s.file as string,
      link: s.link as string,
      level: s.level as number | undefined,
      school: s.school as string | undefined,
      quality: s.quality as string | undefined,
      castingTimeRaw: s.castingTimeRaw as string | undefined,
      castingTime: (s.castingTime as string[]) ?? [],
      range: s.range as string | undefined,
      concentration: s.concentration as boolean | undefined,
      duration: s.duration as string | undefined,
      components: {
        verbal: s.verbal as boolean | undefined,
        somatic: s.somatic as boolean | undefined,
        material: s.material as boolean | undefined,
        materialDescription: s.materialDescription as string | undefined,
      },
      hasRitual: s.hasRitual as boolean | undefined,
      description: s.description as string | undefined,
      image: s.image as string | undefined,
      tags: (s.tags as string[]) ?? [],
      source: s.source as string | undefined,
      versionHash: hash,
    };

    if (entity) {
      em.assign(entity, data);
      entity.spellLists.removeAll();
      await em.flush();
      for (const ref of spellLists) {
        em.create(SpellListEntity, {
          spell: entity,
          name: ref.name,
          link: ref.link,
        });
      }
      result.updated++;
    } else {
      const spell = em.create(SpellEntity, data);
      for (const ref of spellLists) {
        em.create(SpellListEntity, { spell, name: ref.name, link: ref.link });
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
