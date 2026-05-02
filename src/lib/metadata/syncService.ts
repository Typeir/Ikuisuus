/**
 * @fileoverview Metadata Sync Service
 * @description Hash-based incremental sync from filesystem metadata to PostgreSQL
 * via MikroORM. Compares FNV-1a content hashes between incoming records and
 * existing DB rows — only inserts/updates/deletes when data actually changed.
 *
 * Designed to be called from the sync API endpoint after ISR revalidation
 * or from the seed script. Uses the app's ORM singleton (`getEM()`) so it
 * shares the runtime connection pool.
 *
 * Strategy per content type per locale:
 *   1. Read `.metadata.json` files from `.meta/{locale}/` (fallback: `src/content/{locale}/`)
 *   2. Compute content hash for each incoming record
 *   3. Load existing `(slug → versionHash)` map from DB
 *   4. Diff: skip unchanged, update changed, insert new
 *   5. Delete stale rows (in DB but not in incoming set)
 *
 * @module lib/metadata/syncService
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import {
    HeirloomEntity,
    MonsterEntity,
    SpellEntity,
    SpellListEntity,
} from '@/lib/db/orm/entities';
import { getEM } from '@/lib/db/orm/orm';
import { createLogger } from '@/lib/logging/logger';
import type { EntityManager } from '@mikro-orm/postgresql';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { syncBloodlines } from './syncBloodlines';
import { syncTrinkets } from './syncTrinkets';
import type { SyncResult } from './types';

const log = createLogger({ component: 'MetadataSync' });

/**
 * Resolves the root directory of the project.
 *
 * @returns {string} Absolute path to project root
 */
function getProjectRoot(): string {
  /** Works from src/lib/metadata/ at build time and at runtime */
  return join(__dirname, '..', '..', '..');
}

/**
 * Reads and flattens all `.metadata.json` files from a content subdirectory.
 * Checks `.meta/{locale}/{subdir}` first, falls back to `src/content/{locale}/{subdir}`.
 *
 * Returns `sourceExists: false` when neither directory exists **or** when the
 * chosen directory contains no `.metadata.json` files. Callers treat a false
 * `sourceExists` as "no authoritative source — skip sync to prevent destructive
 * deletion". This guards against serverless deployments where content directories
 * exist but metadata sidecars were not bundled (they are git-ignored).
 *
 * @param {string} locale - Locale code
 * @param {string} subdir - Content subdirectory (e.g. 'monsters')
 * @returns {{ records: Record<string, unknown>[]; sourceExists: boolean }} Flattened records and source presence flag
 */
function readMetadataFiles(
  locale: string,
  subdir: string,
): { records: Record<string, unknown>[]; sourceExists: boolean } {
  const root = getProjectRoot();
  const metaDirPath = join(root, '.meta', locale, subdir);
  const contentDirPath = join(root, 'src', 'content', locale, subdir);
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
 * Slug key for a monster record — uses subSlug if present.
 *
 * @param {Record<string, unknown>} record - Monster metadata record
 * @returns {string} Slug key for deduplication
 */
function monsterSlugKey(record: Record<string, unknown>): string {
  return (record.subSlug as string) || (record.slug as string) || 'unknown';
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
): Promise<SyncResult> {
  const { records, sourceExists } = readMetadataFiles(locale, 'monsters');
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

  const existing = await em.find(MonsterEntity, { locale });
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
      proficiencyBonus: m.proficiencyBonus as number | undefined,
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

    if (entity) {
      em.assign(entity, data);
      result.updated++;
    } else {
      em.create(MonsterEntity, data);
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
): Promise<SyncResult> {
  const { records, sourceExists } = readMetadataFiles(
    locale,
    join('items', 'heirlooms'),
  );
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

  for (const [key, entity] of Array.from(existingMap)) {
    if (!incomingKeys.has(key)) {
      em.remove(entity);
      result.deleted++;
    }
  }

  return result;
}

/**
 * Syncs the `spells` + `spell_lists` tables for a locale using hash-based diffing.
 *
 * @param {EntityManager} em - Transaction-scoped entity manager
 * @param {string} locale - Locale code
 * @returns {Promise<SyncResult>} Sync statistics
 */
async function syncSpells(
  em: EntityManager,
  locale: string,
): Promise<SyncResult> {
  const { records, sourceExists } = readMetadataFiles(locale, 'spells');
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
      tags: (s.tags as string[]) ?? [],
      versionHash: hash,
    };

    if (entity) {
      em.assign(entity, data);
      /** Rebuild spell lists: remove old, add new */
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

  for (const [key, entity] of Array.from(existingMap)) {
    if (!incomingKeys.has(key)) {
      /** Never delete external spells — they are seeded once via db:seed and
       * are not present in the local .meta directory that the revalidation
       * sync reads from. Deleting them here would nuke all 500+ SRD spells
       * every time a custom-spell correction is published. */
      if (entity.file === 'external') continue;
      em.remove(entity);
      result.deleted++;
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
    sync: (em: EntityManager, locale: string) => Promise<SyncResult>;
    label: string;
  }
> = {
  monsters: { sync: syncMonsters, label: 'monsters' },
  heirlooms: { sync: syncHeirlooms, label: 'heirlooms' },
  spells: { sync: syncSpells, label: 'spells' },
  trinkets: { sync: syncTrinkets, label: 'trinkets' },
  bloodlines: { sync: syncBloodlines, label: 'bloodlines' },
};

/**
 * Runs a hash-based incremental sync for one or more content types.
 * Each content type is synced inside a transaction.
 *
 * @param {Object} options - Sync options
 * @param {string} [options.locale='en'] - Locale to sync
 * @param {string[]} [options.contentTypes] - Content types to sync (defaults to all)
 * @returns {Promise<Record<string, SyncResult>>} Per-type sync results
 */
export async function syncMetadata(
  options: {
    locale?: string;
    contentTypes?: string[];
  } = {},
): Promise<Record<string, SyncResult>> {
  const locale = options.locale ?? 'en';
  const types = options.contentTypes ?? Object.keys(SYNC_MAP);
  const results: Record<string, SyncResult> = {};

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

        const result = await config.sync(tx, locale);
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
  return results;
}
