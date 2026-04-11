/**
 * @fileoverview Backfill missing content version hashes in PostgreSQL
 * @module scripts/db/pg/backfill-version-hashes
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 * @description Scans content tables, computes deterministic hashes from the
 * canonical metadata payload shape, and updates rows where `version_hash` is
 * null or empty.
 *
 * Usage:
 *   npx tsx scripts/db/pg/backfill-version-hashes.ts
 *
 * Required env:
 *   DATABASE_URL — Neon / Postgres connection string
 */

import {
  defineConfig,
  MikroORM,
  type EntityManager,
} from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  BloodlineEntity,
  HeirloomEntity,
  MonsterEntity,
  SpellEntity,
  TrinketEntity,
} from '../../../src/lib/db/orm/entities/index';
import { nonEmpty, orUndef } from '../../../src/lib/db/orm/helpers';
import { contentHash } from '../../../src/lib/metadata/contentHash';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../');

/**
 * Summary for one table backfill pass.
 *
 * @interface BackfillSummary
 * @property {string} table - Physical table name
 * @property {number} total - Total rows scanned
 * @property {number} missing - Rows missing hash before backfill
 * @property {number} updated - Rows updated by this run
 */
interface BackfillSummary {
  table: string;
  total: number;
  missing: number;
  updated: number;
}

/**
 * Checks whether a stored hash is missing.
 *
 * @param {string | null | undefined} value - Current hash column value
 * @returns {boolean} True when hash is null/undefined/blank
 */
function isMissingHash(value: string | null | undefined): boolean {
  return value == null || value.trim().length === 0;
}

/**
 * Loads `.env.local` into process env when present.
 */
function loadEnv(): void {
  try {
    const raw = readFileSync(join(ROOT, '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed
        .slice(eqIdx + 1)
        .trim()
        .replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    return;
  }
}

/**
 * Produces the canonical monster hash payload from a DB row.
 *
 * @param {MonsterEntity} row - Monster row
 * @returns {Record<string, unknown>} Metadata-compatible payload
 */
function monsterHashPayload(row: MonsterEntity): Record<string, unknown> {
  const savingThrows: Record<string, number> = {};
  let hasSavingThrows = false;
  for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const) {
    const value = row.saves[key];
    if (value != null) {
      savingThrows[key] = value;
      hasSavingThrows = true;
    }
  }

  return {
    slug: row.slug,
    subSlug: orUndef(row.subSlug),
    title: row.title,
    file: row.file,
    link: row.link,
    size: orUndef(row.size),
    creatureType: orUndef(row.creatureType),
    alignment: orUndef(row.alignment),
    cr: orUndef(row.cr),
    proficiencyBonus: orUndef(row.proficiencyBonus),
    ac: {
      value: row.ac.value ?? 0,
      notes: orUndef(row.ac.notes),
      raw: orUndef(row.ac.raw),
    },
    hp: {
      average: row.hp.average ?? 0,
      formula: orUndef(row.hp.formula),
      raw: orUndef(row.hp.raw),
    },
    speed: {
      raw: row.speed.raw ?? '',
      modes: {
        walk: orUndef(row.speed.walk),
        fly: orUndef(row.speed.fly),
        climb: orUndef(row.speed.climb),
        swim: orUndef(row.speed.swim),
        burrow: orUndef(row.speed.burrow),
        hover: orUndef(row.speed.hover),
      },
    },
    abilities: {
      str: { score: orUndef(row.scores.str) },
      dex: { score: orUndef(row.scores.dex) },
      con: { score: orUndef(row.scores.con) },
      int: { score: orUndef(row.scores.int) },
      wis: { score: orUndef(row.scores.wis) },
      cha: { score: orUndef(row.scores.cha) },
    },
    savingThrows: hasSavingThrows ? savingThrows : undefined,
    senses: {
      raw: row.senses.raw ?? '',
      passivePerception: orUndef(row.senses.passivePerception),
      darkvision: orUndef(row.senses.darkvision),
      blindsight: orUndef(row.senses.blindsight),
      tremorsense: orUndef(row.senses.tremorsense),
      truesight: orUndef(row.senses.truesight),
    },
    skills: nonEmpty(row.skills),
    damageResistances: nonEmpty(row.damageResistances),
    damageImmunities: nonEmpty(row.damageImmunities),
    damageVulnerabilities: nonEmpty(row.damageVulnerabilities),
    conditionImmunities: nonEmpty(row.conditionImmunities),
    languages: nonEmpty(row.languages),
    tags: nonEmpty(row.tags),
    indexVersion: orUndef(row.indexVersion),
  };
}

/**
 * Produces the canonical heirloom hash payload from a DB row.
 *
 * @param {HeirloomEntity} row - Heirloom row
 * @returns {Record<string, unknown>} Metadata-compatible payload
 */
function heirloomHashPayload(row: HeirloomEntity): Record<string, unknown> {
  const charges = row.charges;
  const hasCharges =
    charges.initial != null ||
    charges.recharge != null ||
    charges.depletes != null;

  return {
    slug: row.slug,
    title: row.title,
    file: row.file,
    link: row.link,
    rarity: orUndef(row.rarity),
    itemType: orUndef(row.itemType),
    weaponType: orUndef(row.weaponType),
    requiresAttunement: row.requiresAttunement ?? false,
    attunementRequirements: orUndef(row.attunementRequirements),
    weaponDamage:
      row.weaponDamage == null
        ? undefined
        : {
            damage: row.weaponDamage,
            damageType: row.weaponDamageType ?? '',
            versatileDamage: orUndef(row.versatileDamage),
          },
    hitModifier: orUndef(row.hitModifier),
    range: orUndef(row.range),
    weight: orUndef(row.weight),
    charges: hasCharges
      ? {
          initial: orUndef(charges.initial),
          recharge: orUndef(charges.recharge),
          depletes: charges.depletes ?? false,
        }
      : undefined,
    mastery: nonEmpty(row.mastery),
    weaponProperties: nonEmpty(row.weaponProperties),
    damageTypesDealt: nonEmpty(row.damageTypesDealt),
    savingThrowTypes: nonEmpty(row.savingThrowTypes),
    tags: nonEmpty(row.tags),
    indexVersion: orUndef(row.indexVersion),
  };
}

/**
 * Produces the canonical spell hash payload from a DB row.
 *
 * @param {SpellEntity} row - Spell row with populated spell lists
 * @returns {Record<string, unknown>} Metadata-compatible payload
 */
function spellHashPayload(row: SpellEntity): Record<string, unknown> {
  const spellLists = row.spellLists
    .getItems()
    .map((list) => ({ name: list.name, link: list.link }))
    .sort((a, b) => {
      const byName = a.name.localeCompare(b.name);
      return byName !== 0 ? byName : a.link.localeCompare(b.link);
    });

  return {
    slug: row.slug,
    title: row.title,
    file: row.file,
    link: row.link,
    level: orUndef(row.level),
    school: orUndef(row.school),
    quality: orUndef(row.quality),
    castingTimeRaw: orUndef(row.castingTimeRaw),
    castingTime: nonEmpty(row.castingTime),
    range: orUndef(row.range),
    concentration: orUndef(row.concentration),
    duration: orUndef(row.duration),
    verbal: orUndef(row.components.verbal),
    somatic: orUndef(row.components.somatic),
    material: orUndef(row.components.material),
    materialDescription: orUndef(row.components.materialDescription),
    hasRitual: orUndef(row.hasRitual),
    tags: nonEmpty(row.tags),
    spellLists: spellLists.length > 0 ? spellLists : undefined,
  };
}

/**
 * Produces the canonical trinket hash payload from a DB row.
 *
 * @param {TrinketEntity} row - Trinket row
 * @returns {Record<string, unknown>} Metadata-compatible payload
 */
function trinketHashPayload(row: TrinketEntity): Record<string, unknown> {
  return {
    slug: row.slug,
    title: row.title,
    file: row.file,
    link: row.link,
    itemType: row.itemType,
    damage: orUndef(row.damage),
    damageType: orUndef(row.damageType),
    properties: nonEmpty(row.properties),
    range: orUndef(row.range),
    weight: orUndef(row.weight),
    savingThrowDC: orUndef(row.savingThrow.dc),
    savingThrowAbility: orUndef(row.savingThrow.ability),
    specialEffects: nonEmpty(row.specialEffects),
    inflictsConditions: nonEmpty(row.inflictsConditions),
    tags: nonEmpty(row.tags),
  };
}

/**
 * Produces the canonical bloodline hash payload from a DB row.
 *
 * @param {BloodlineEntity} row - Bloodline row with populated boons
 * @returns {Record<string, unknown>} Metadata-compatible payload
 */
function bloodlineHashPayload(row: BloodlineEntity): Record<string, unknown> {
  const boons = row.boons
    .getItems()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((boon) => ({
      name: boon.name,
      bpLabel: boon.bpLabel,
      bpValue: orUndef(boon.bpValue),
      sortOrder: boon.sortOrder,
      tags: boon.tags,
    }));

  return {
    slug: row.slug,
    title: row.title,
    file: row.file,
    link: row.link,
    description: orUndef(row.description),
    coreFeatures: {
      abilityScores: row.abilityScores,
      movementSpeeds: row.movementSpeeds,
      senses: row.senses,
      size: row.size,
      creatureTypes: row.creatureTypes,
      age: orUndef(row.age),
    },
    boonBudget: orUndef(row.boonBudget),
    boons,
    tags: nonEmpty(row.tags),
    indexVersion: orUndef(row.indexVersion),
  };
}

/**
 * Backfills missing monster hashes.
 *
 * @param {EntityManager} em - Entity manager
 * @returns {Promise<BackfillSummary>} Table summary
 */
async function backfillMonsters(em: EntityManager): Promise<BackfillSummary> {
  const rows = await em.find(MonsterEntity, {});
  let missing = 0;
  let updated = 0;

  for (const row of rows) {
    if (!isMissingHash(row.versionHash)) continue;
    missing++;
    row.versionHash = contentHash(monsterHashPayload(row));
    updated++;
  }

  await em.flush();
  return { table: 'monsters', total: rows.length, missing, updated };
}

/**
 * Backfills missing heirloom hashes.
 *
 * @param {EntityManager} em - Entity manager
 * @returns {Promise<BackfillSummary>} Table summary
 */
async function backfillHeirlooms(em: EntityManager): Promise<BackfillSummary> {
  const rows = await em.find(HeirloomEntity, {});
  let missing = 0;
  let updated = 0;

  for (const row of rows) {
    if (!isMissingHash(row.versionHash)) continue;
    missing++;
    row.versionHash = contentHash(heirloomHashPayload(row));
    updated++;
  }

  await em.flush();
  return { table: 'heirlooms', total: rows.length, missing, updated };
}

/**
 * Backfills missing spell hashes.
 *
 * @param {EntityManager} em - Entity manager
 * @returns {Promise<BackfillSummary>} Table summary
 */
async function backfillSpells(em: EntityManager): Promise<BackfillSummary> {
  const rows = await em.find(SpellEntity, {}, { populate: ['spellLists'] });
  let missing = 0;
  let updated = 0;

  for (const row of rows) {
    if (!isMissingHash(row.versionHash)) continue;
    missing++;
    row.versionHash = contentHash(spellHashPayload(row));
    updated++;
  }

  await em.flush();
  return { table: 'spells', total: rows.length, missing, updated };
}

/**
 * Backfills missing trinket hashes.
 *
 * @param {EntityManager} em - Entity manager
 * @returns {Promise<BackfillSummary>} Table summary
 */
async function backfillTrinkets(em: EntityManager): Promise<BackfillSummary> {
  const rows = await em.find(TrinketEntity, {});
  let missing = 0;
  let updated = 0;

  for (const row of rows) {
    if (!isMissingHash(row.versionHash)) continue;
    missing++;
    row.versionHash = contentHash(trinketHashPayload(row));
    updated++;
  }

  await em.flush();
  return { table: 'trinkets', total: rows.length, missing, updated };
}

/**
 * Backfills missing bloodline hashes.
 *
 * @param {EntityManager} em - Entity manager
 * @returns {Promise<BackfillSummary>} Table summary
 */
async function backfillBloodlines(em: EntityManager): Promise<BackfillSummary> {
  const rows = await em.find(BloodlineEntity, {}, { populate: ['boons'] });
  let missing = 0;
  let updated = 0;

  for (const row of rows) {
    if (!isMissingHash(row.versionHash)) continue;
    missing++;
    row.versionHash = contentHash(bloodlineHashPayload(row));
    updated++;
  }

  await em.flush();
  return { table: 'bloodlines', total: rows.length, missing, updated };
}

/**
 * Script entry point.
 */
async function main(): Promise<void> {
  loadEnv();

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set.');
  }

  const orm = await MikroORM.init(
    defineConfig({
      entities: [
        MonsterEntity,
        HeirloomEntity,
        SpellEntity,
        TrinketEntity,
        BloodlineEntity,
      ],
      dbName: undefined,
      clientUrl: process.env.DATABASE_URL,
      driverOptions: {
        connection: {
          ssl:
            process.env.DATABASE_SSL === 'false'
              ? false
              : { rejectUnauthorized: false },
        },
      },
      metadataProvider: TsMorphMetadataProvider,
      debug: false,
      forceEntityConstructor: true,
    }),
  );

  try {
    const em = orm.em.fork();
    const summaries = await em.transactional(async (tx) => {
      return [
        await backfillMonsters(tx),
        await backfillHeirlooms(tx),
        await backfillSpells(tx),
        await backfillTrinkets(tx),
        await backfillBloodlines(tx),
      ];
    });

    let totalUpdated = 0;
    console.log('\nVersion hash backfill summary:');
    for (const summary of summaries) {
      totalUpdated += summary.updated;
      console.log(
        `  ${summary.table}: scanned=${summary.total}, missing=${summary.missing}, updated=${summary.updated}`,
      );
    }

    console.log(`\nDone. Updated ${totalUpdated} row(s).`);
  } finally {
    await orm.close(true);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Version hash backfill failed:', message);
  process.exit(1);
});
