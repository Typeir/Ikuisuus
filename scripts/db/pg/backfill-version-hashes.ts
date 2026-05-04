/**
 * @fileoverview Backfill missing content version hashes in PostgreSQL
 * @description Scans content tables, derives a deterministic hash payload from
 * each entity row via MikroORM reflection metadata, and updates rows where
 * `version_hash` is null or empty.
 *
 * All field selection is driven by `orm.getMetadata()` — no property names are
 * hardcoded. Relation payloads (spell lists, bloodline boons) are appended via
 * per-entity `appendRelations` hooks in the config array.
 *
 * @module scripts/db/pg/backfill-version-hashes
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @example
 * npx tsx scripts/db/pg/backfill-version-hashes.ts
 *
 * @requires DATABASE_URL Neon / Postgres connection string
 */

import {
  defineConfig,
  MikroORM,
  type EntityClass,
  type EntityManager,
  type MetadataStorage,
} from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  BloodlineBoonEntity,
  BloodlineEntity,
  HeirloomChargesEmbed,
  HeirloomEntity,
  MonsterACEmbed,
  MonsterHPEmbed,
  MonsterSaveEmbed,
  MonsterScoreEmbed,
  MonsterSenseEmbed,
  MonsterSpeedEmbed,
  MonsterEntity,
  SpellComponentEmbed,
  SpellEntity,
  SpellListEntity,
  TrinketEntity,
  TrinketSavingThrowEmbed,
} from '../../../src/lib/db/orm/entities/index';
import { contentHash } from '../../../src/lib/metadata/contentHash';
import {
  entityToRecord,
  HASH_SKIP,
} from '../../../src/lib/db/orm/reflect';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../');

/* ────────────────────────────  Types  ──────────────────────────────── */

/**
 * Summary for one table backfill pass.
 *
 * @interface BackfillSummary
 * @property {string} table - Physical table name (from entity metadata)
 * @property {number} total - Total rows scanned
 * @property {number} missing - Rows without a hash before this run
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

/* ─────────────────────  Relation Appenders  ────────────────────────── */

/**
 * Appends the sorted spell-list relation payload to a spell hash record.
 *
 * @param {MetadataStorage} allMeta - ORM metadata for `SpellListEntity` reflection
 * @param {object} entity - Spell entity instance with populated `spellLists`
 * @param {Record<string, unknown>} base - Base hash record from `entityToRecord`
 * @returns {Record<string, unknown>} Augmented record including `spellLists`
 */
function appendSpellLists(
  allMeta: MetadataStorage,
  entity: object,
  base: Record<string, unknown>,
): Record<string, unknown> {
  const spell = entity as SpellEntity;
  const spellLists = spell.spellLists
    .getItems()
    .map((sl) => entityToRecord(allMeta, sl, SpellListEntity.name))
    .sort((a, b) => {
      const byName = String(a.name).localeCompare(String(b.name));
      return byName !== 0 ? byName : String(a.link).localeCompare(String(b.link));
    });
  return { ...base, spellLists: spellLists.length > 0 ? spellLists : undefined };
}

/**
 * Appends the sorted boon relation payload to a bloodline hash record.
 *
 * @param {MetadataStorage} allMeta - ORM metadata for `BloodlineBoonEntity` reflection
 * @param {object} entity - Bloodline entity instance with populated `boons`
 * @param {Record<string, unknown>} base - Base hash record from `entityToRecord`
 * @returns {Record<string, unknown>} Augmented record including `boons`
 */
function appendBloodlineBoons(
  allMeta: MetadataStorage,
  entity: object,
  base: Record<string, unknown>,
): Record<string, unknown> {
  const bloodline = entity as BloodlineEntity;
  const boons = bloodline.boons
    .getItems()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((boon) => entityToRecord(allMeta, boon, BloodlineBoonEntity.name));
  return { ...base, boons };
}

/* ──────────────────────  Generic Backfiller  ───────────────────────── */

/**
 * Configuration for a single-table backfill pass.
 *
 * @interface BackfillConfig
 * @property {EntityClass<object>} entityClass - MikroORM entity constructor
 * @property {string[]} [populate] - Relation paths to load before hashing
 * @property {Function} [appendRelations] - Merges relation payloads into the base record after reflection
 */
interface BackfillConfig {
  entityClass: EntityClass<object>;
  populate?: string[];
  appendRelations?: (
    entity: object,
    base: Record<string, unknown>,
  ) => Record<string, unknown>;
}

/**
 * Scans all rows for `config.entityClass`, computes a deterministic hash for
 * each row that is missing one, and persists updates via `em.flush()`.
 *
 * Field selection is driven entirely by `entityToRecord` and the ORM metadata —
 * no property names are hardcoded here. The optional `appendRelations` callback
 * in `config` handles relation payloads that `entityToRecord` skips.
 *
 * @param {EntityManager} em - Transaction-scoped entity manager
 * @param {MetadataStorage} allMeta - ORM metadata from `orm.getMetadata()`
 * @param {BackfillConfig} config - Entity class, populate hints, and optional relation appender
 * @returns {Promise<BackfillSummary>} Row counts for reporting
 */
async function backfillTable(
  em: EntityManager,
  allMeta: MetadataStorage,
  config: BackfillConfig,
): Promise<BackfillSummary> {
  const rows = await em.find(
    config.entityClass,
    {},
    { populate: (config.populate ?? []) as never[] },
  );

  let missing = 0;
  let updated = 0;

  for (const row of rows) {
    const versioned = row as object & { versionHash?: string | null };
    if (!isMissingHash(versioned.versionHash)) continue;
    missing++;

    const base = entityToRecord(allMeta, row, config.entityClass.name, HASH_SKIP);
    const payload = config.appendRelations
      ? config.appendRelations(row, base)
      : base;

    versioned.versionHash = contentHash(payload);
    updated++;
  }

  await em.flush();

  return {
    table: allMeta.get(config.entityClass.name).collection,
    total: rows.length,
    missing,
    updated,
  };
}

/* ────────────────────────────  Main  ───────────────────────────────── */

/**
 * Connects to PostgreSQL, builds reflection-driven backfill configs, and runs
 * each table's backfill pass inside a single transaction.
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
        MonsterACEmbed,
        MonsterHPEmbed,
        MonsterSpeedEmbed,
        MonsterScoreEmbed,
        MonsterSaveEmbed,
        MonsterSenseEmbed,
        HeirloomEntity,
        HeirloomChargesEmbed,
        SpellEntity,
        SpellComponentEmbed,
        SpellListEntity,
        TrinketEntity,
        TrinketSavingThrowEmbed,
        BloodlineEntity,
        BloodlineBoonEntity,
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
    const allMeta = orm.getMetadata();

    const configs: BackfillConfig[] = [
      { entityClass: MonsterEntity },
      { entityClass: HeirloomEntity },
      {
        entityClass: SpellEntity,
        populate: ['spellLists'],
        appendRelations: (entity, base) =>
          appendSpellLists(allMeta, entity, base),
      },
      { entityClass: TrinketEntity },
      {
        entityClass: BloodlineEntity,
        populate: ['boons'],
        appendRelations: (entity, base) =>
          appendBloodlineBoons(allMeta, entity, base),
      },
    ];

    const em = orm.em.fork();
    const summaries = await em.transactional(async (tx) =>
      Promise.all(configs.map((cfg) => backfillTable(tx, allMeta, cfg))),
    );

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
