/**
 * @fileoverview Metadata Sync Service
 * @description Hash-based incremental sync from filesystem metadata to PostgreSQL
 * via MikroORM. Compares FNV-1a content hashes between incoming records and
 * existing DB rows — only inserts/updates/deletes when data changed.
 * Uses the app's ORM singleton (`getEM()`).
 *
 * Per content type per locale: reads `.metadata.json` from `.meta/{locale}/`
 * (fallback `src/content/{locale}/`), computes content hash, loads existing
 * `(slug → versionHash)` map, diffs, and deletes stale rows.
 *
 * @module lib/metadata/syncService
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import { readMetadataFiles } from './metadataSource';
import {
    HeirloomEntity,
    MonsterEntity,
    MonsterFeatureEntity,
    SpellEntity,
    SpellListEntity,
} from '@/lib/db/orm/entities';
import { getEM } from '@/lib/db/orm/orm';
import { createLogger } from '@/lib/logging/logger';
import type { EntityManager } from '@mikro-orm/postgresql';
import { join } from 'path';
import { syncBloodlines } from './syncBloodlines';
import { syncSpells } from './syncSpells';
import { ContentType } from './contentTypes';
import { syncTrinkets } from './syncTrinkets';
import type { SyncOptions, SyncResult } from './types';

const log = createLogger({ component: 'MetadataSync' });

/**
 * Slug key for a monster record — uses subSlug if present.
 *
 * @param {Record<string, unknown>} record - Monster metadata record
 * @returns {string} Slug key for deduplication
 */
function monsterSlugKey(record: Record<string, unknown>): string {
  return (record.subSlug as string) || (record.slug as string) || 'unknown';
}

/**
 * Writes a monster's feature shards as child rows.
 * Shards are replaced wholesale (not diffed).
 *
 * @param {EntityManager} em - Active entity manager
 * @param {MonsterEntity} monster - Owning monster row
 * @param {Array<Record<string, unknown>>} features - Feature shards from metadata
 * @returns {void}
 */
function createMonsterFeatures(
  em: EntityManager,
  monster: MonsterEntity,
  features: Array<Record<string, unknown>>,
): void {
  features.forEach((feature, index) => {
    const source = feature.source as
      | { start?: number; end?: number }
      | undefined;

    em.create(MonsterFeatureEntity, {
      monster,
      featureId: (feature.id as string) ?? `${monster.slug}/${index}`,
      name: (feature.name as string) ?? '',
      trigger: feature.trigger as string | undefined,
      sortOrder: index,
      startLine: source?.start,
      endLine: source?.end,
      tags: (feature.tags as string[]) ?? [],
    });
  });
}

/**
 * Syncs the `monsters` table for a locale using hash-based diffing.
 *
 * @param {EntityManager} em - Transaction-scoped entity manager
 * @param {string} locale - Locale code
 * @returns {Promise<SyncResult>} Sync statistics
 */
async function syncMonsters(
  em: EntityManager,
  locale: string,
  options: SyncOptions = {},
): Promise<SyncResult> {
  const { records, sourceExists } = options.records
    ? { records: options.records, sourceExists: true }
    : readMetadataFiles(locale, 'monsters');
  const result: SyncResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    deleted: 0,
  };

  if (!sourceExists) {
    log.warning(
      'Monster metadata source directory missing, skipping sync to prevent destructive deletion',
      { locale },
    );
    return result;
  }

  const existing = await em.find(
    MonsterEntity,
    { locale },
    { populate: ['features'] },
  );
  const existingMap = new Map(existing.map((e) => [e.subSlug || e.slug, e]));

  const incomingKeys = new Set<string>();

  for (const m of records) {
    const key = monsterSlugKey(m);
    incomingKeys.add(key);
    const hash = m.versionHash as string;
    const entity = existingMap.get(key);

    if (hash && entity?.versionHash === hash) {
      result.skipped++;
      continue;
    }

    const modes =
      ((m.speed as Record<string, unknown>)?.modes as
        | Record<string, unknown>
        | undefined) ?? {};
    const abilities = (m.abilities ?? {}) as Record<string, { score?: number }>;
    const saves = (m.savingThrows ?? {}) as Record<string, number>;
    const senses = (m.senses ?? {}) as Record<string, unknown>;
    const ac = (m.ac ?? {}) as Record<string, unknown>;
    const hp = (m.hp ?? {}) as Record<string, unknown>;
    const speed = (m.speed ?? {}) as Record<string, unknown>;

    const data = {
      locale,
      slug: m.slug as string,
      subSlug: m.subSlug as string | undefined,
      title: m.title as string,
      file: m.file as string,
      link: m.link as string,
      size: m.size as string | undefined,
      creatureType: m.creatureType as string | undefined,
      alignment: m.alignment as string | undefined,
      cr: m.cr as string | undefined,
      tierBonus: m.tierBonus as number | undefined,
      ac: {
        value: ac.value as number | undefined,
        notes: ac.notes as string | undefined,
        raw: ac.raw as string | undefined,
      },
      hp: {
        average: hp.average as number | undefined,
        formula: hp.formula as string | undefined,
        raw: hp.raw as string | undefined,
      },
      speed: {
        raw: speed.raw as string | undefined,
        walk: modes.walk as number | undefined,
        fly: modes.fly as number | undefined,
        climb: modes.climb as number | undefined,
        swim: modes.swim as number | undefined,
        burrow: modes.burrow as number | undefined,
        hover: modes.hover as boolean | undefined,
      },
      scores: {
        str: abilities.str?.score,
        dex: abilities.dex?.score,
        con: abilities.con?.score,
        int: abilities.int?.score,
        wis: abilities.wis?.score,
        cha: abilities.cha?.score,
      },
      saves: {
        str: saves.str,
        dex: saves.dex,
        con: saves.con,
        int: saves.int,
        wis: saves.wis,
        cha: saves.cha,
      },
      senses: {
        raw: senses.raw as string | undefined,
        passivePerception: senses.passivePerception as number | undefined,
        darkvision: senses.darkvision as number | undefined,
        blindsight: senses.blindsight as number | undefined,
        tremorsense: senses.tremorsense as number | undefined,
        truesight: senses.truesight as number | undefined,
      },
      skills: (m.skills as string[]) ?? [],
      damageResistances: (m.damageResistances as string[]) ?? [],
      damageImmunities: (m.damageImmunities as string[]) ?? [],
      damageVulnerabilities: (m.damageVulnerabilities as string[]) ?? [],
      conditionImmunities: (m.conditionImmunities as string[]) ?? [],
      languages: (m.languages as string[]) ?? [],
      tags: (m.tags as string[]) ?? [],
      image: m.image as string | undefined,
      description: m.description as string | undefined,
      indexVersion: m.indexVersion as number | undefined,
      versionHash: hash,
    };

    const featureRows =
      (m.features as Array<Record<string, unknown>> | undefined) ?? [];

    if (entity) {
      em.assign(entity, data);
      entity.features.removeAll();
      await em.flush();
      createMonsterFeatures(em, entity, featureRows);
      result.updated++;
    } else {
      const monster = em.create(MonsterEntity, data);
      createMonsterFeatures(em, monster, featureRows);
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

/**
 * Syncs the `heirlooms` table for a locale using hash-based diffing.
 *
 * @param {EntityManager} em - Transaction-scoped entity manager
 * @param {string} locale - Locale code
 * @returns {Promise<SyncResult>} Sync statistics
 */
async function syncHeirlooms(
  em: EntityManager,
  locale: string,
  options: SyncOptions = {},
): Promise<SyncResult> {
  const { records, sourceExists } = options.records
    ? { records: options.records, sourceExists: true }
    : readMetadataFiles(locale, join('items', 'heirlooms'));
  const result: SyncResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    deleted: 0,
  };

  if (!sourceExists) {
    log.warning(
      'Heirloom metadata source directory missing, skipping sync to prevent destructive deletion',
      { locale },
    );
    return result;
  }

  const existing = await em.find(HeirloomEntity, { locale });
  const existingMap = new Map(existing.map((e) => [e.slug, e]));
  const incomingKeys = new Set<string>();

  for (const h of records) {
    const slug = h.slug as string;
    incomingKeys.add(slug);
    const hash = h.versionHash as string;
    const entity = existingMap.get(slug);

    if (hash && entity?.versionHash === hash) {
      result.skipped++;
      continue;
    }

    const wd = (h.weaponDamage ?? {}) as Record<string, unknown>;
    const ch = (h.charges ?? {}) as Record<string, unknown>;

    const data = {
      locale,
      slug,
      title: h.title as string,
      file: h.file as string,
      link: h.link as string,
      rarity: h.rarity as string | undefined,
      itemType: h.itemType as string | undefined,
      weaponType: h.weaponType as string | undefined,
      requiresAttunement: h.requiresAttunement as boolean | undefined,
      attunementRequirements: h.attunementRequirements as string | undefined,
      weaponDamage: wd.damage as string | undefined,
      weaponDamageType: wd.damageType as string | undefined,
      versatileDamage: wd.versatileDamage as string | undefined,
      hitModifier: h.hitModifier as number | undefined,
      range: h.range as string | undefined,
      weight: h.weight as string | undefined,
      charges: {
        initial: ch.initial as string | undefined,
        recharge: ch.recharge as string | undefined,
        depletes: ch.depletes as boolean | undefined,
      },
      mastery: (h.mastery as string[]) ?? [],
      weaponProperties: (h.weaponProperties as string[]) ?? [],
      damageTypesDealt: (h.damageTypesDealt as string[]) ?? [],
      savingThrowTypes: (h.savingThrowTypes as string[]) ?? [],
      tags: (h.tags as string[]) ?? [],
      description: h.description as string | undefined,
      image: h.image as string | undefined,
      indexVersion: h.indexVersion as number | undefined,
      versionHash: hash,
    };

    if (entity) {
      em.assign(entity, data);
      result.updated++;
    } else {
      em.create(HeirloomEntity, data);
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

/**
 * Content type sync configuration — maps type names to sync functions and subdirectories.
 */
const SYNC_MAP: Record<
  string,
  {
    sync: (
      em: EntityManager,
      locale: string,
      options?: SyncOptions,
    ) => Promise<SyncResult>;
    label: string;
  }
> = {
  [ContentType.Monsters]: { sync: syncMonsters, label: ContentType.Monsters },
  [ContentType.Heirlooms]: { sync: syncHeirlooms, label: ContentType.Heirlooms },
  [ContentType.Spells]: { sync: syncSpells, label: ContentType.Spells },
  [ContentType.Trinkets]: { sync: syncTrinkets, label: ContentType.Trinkets },
  [ContentType.Bloodlines]: {
    sync: syncBloodlines,
    label: ContentType.Bloodlines,
  },
};

/**
 * Runs a hash-based incremental sync for one or more content types.
 * Each content type is synced inside a transaction.
 *
 * @param {Object} options - Sync options
 * @param {string} [options.locale='en'] - Locale to sync
 * @param {string[]} [options.contentTypes] - Content types to sync (defaults to all)
 * @param {Record<string, unknown>[]} [options.records] - Pre-parsed records for a single content type
 * @param {boolean} [options.allowDeletion] - Remove DB rows with no incoming record; defaults to false
 * @returns {Promise<Record<string, SyncResult>>} Per-type sync results
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
  const types = options.contentTypes ?? Object.keys(SYNC_MAP);
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
        const config = SYNC_MAP[type];
        if (!config) {
          log.warning('Unknown content type, skipping', { type });
          continue;
        }

        const result = await config.sync(tx, locale, {
          records: options.records,
          allowDeletion: options.allowDeletion ?? false,
        });
        results[type] = result;

        log.message(`Synced ${config.label}`, {
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
  try {
    const mod = await import('@/lib/db/content');
    if (mod && typeof mod.clearCache === 'function') {
      mod.clearCache();
      log.message('Cleared file-tree cache after metadata sync');
    }
  } catch (err) {
    log.warning('Failed to clear file-tree cache after metadata sync', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return results;
}
