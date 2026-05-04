/**
 * @fileoverview PostgreSQL Database Initialisation Script
 * @description Synchronises all content and auth tables via MikroORM
 * SchemaGenerator, then applies supplementary indexes that cannot be expressed
 * via `@Index` decorators (COALESCE expressions, GIN array indexes, child-table
 * FK/composite indexes).
 *
 * Safe to run multiple times — all statements use IF NOT EXISTS.
 *
 * @module init-db
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 *
 * Usage:
 *   npx tsx scripts/db/pg/init-db.ts
 *
 * Required env:
 *   DATABASE_URL — Neon / Postgres connection string
 */

import { createLogger } from '@/lib/logging/logger';
import { defineConfig, MikroORM } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import {
   AuditRecordEntity,
   BannedIpEntity,
   BloodlineBoonEntity,
   BloodlineEntity,
   CorrectionsUserEntity,
   DraftEntity,
   HeirloomChargesEmbed,
   HeirloomEntity,
   MonsterACEmbed,
   MonsterEntity,
   MonsterHPEmbed,
   MonsterSaveEmbed,
   MonsterScoreEmbed,
   MonsterSenseEmbed,
   MonsterSpeedEmbed,
   SchemaMigrationEntity,
   SpecializationEntity,
   SpecializationFeatureEntity,
   SpecializationPreparedSpellEntity,
   SpecializationSpellcastingEmbed,
   SpellComponentEmbed,
   SpellEntity,
   SpellListEntity,
   TrinketEntity,
   TrinketSavingThrowEmbed,
   VocationEntity,
   VocationFeatureEntity,
   VocationSkillProficienciesEmbed,
   VocationSpellcastingEmbed,
} from '../../../src/lib/db/orm/entities/index';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../../');
const log = createLogger({ script: 'init-db' });

/* ─────────────────────────  Env  ──────────────────────────────────── */

try {
  const raw = readFileSync(resolve(ROOT, '.env.local'), 'utf8');
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
  /* .env.local absent — rely on system env */
}

if (!process.env.DATABASE_URL) {
  log.error('❌  DATABASE_URL is not set.');
  process.exit(1);
}

/* ───────────────────  Supplementary Indexes  ─────────────────────── */

/**
 * Expression-based and GIN indexes that supplement the MikroORM-managed schema.
 * Only includes indexes that cannot be expressed via `@Index` decorators
 * (COALESCE expressions, GIN array indexes) or child-table FK/composite indexes
 * on entities without `@Index` annotations.
 */
const SUPPLEMENTARY_INDEXES: string[] = [
  `CREATE UNIQUE INDEX IF NOT EXISTS monsters_locale_display_slug_uidx
     ON monsters (locale, COALESCE(sub_slug, slug))`,
  `CREATE INDEX IF NOT EXISTS monsters_tags_gin_idx
     ON monsters USING GIN (tags)`,
  `CREATE INDEX IF NOT EXISTS heirlooms_tags_gin_idx
     ON heirlooms USING GIN (tags)`,
  `CREATE INDEX IF NOT EXISTS spells_tags_gin_idx
     ON spells USING GIN (tags)`,
  `CREATE INDEX IF NOT EXISTS trinkets_tags_gin_idx
     ON trinkets USING GIN (tags)`,
  `CREATE INDEX IF NOT EXISTS bloodlines_tags_gin_idx
     ON bloodlines USING GIN (tags)`,
  `CREATE INDEX IF NOT EXISTS bloodline_boons_bloodline_id_idx
     ON bloodline_boons (bloodline_id)`,
  `CREATE INDEX IF NOT EXISTS bloodline_boons_sort_order_idx
     ON bloodline_boons (bloodline_id, sort_order)`,
  `CREATE INDEX IF NOT EXISTS bloodline_boons_tags_gin_idx
     ON bloodline_boons USING GIN (tags)`,
  `CREATE INDEX IF NOT EXISTS vocations_tags_gin_idx
     ON vocations USING GIN (tags)`,
  `CREATE INDEX IF NOT EXISTS vocation_features_vocation_id_idx
     ON vocation_features (vocation_id)`,
  `CREATE INDEX IF NOT EXISTS specializations_tags_gin_idx
     ON specializations USING GIN (tags)`,
  `CREATE INDEX IF NOT EXISTS specialization_features_specialization_id_idx
     ON specialization_features (specialization_id)`,
  `CREATE INDEX IF NOT EXISTS specialization_prepared_spells_specialization_id_idx
     ON specialization_prepared_spells (specialization_id)`,
  `CREATE INDEX IF NOT EXISTS audit_logs_timestamp_idx
     ON audit_logs (timestamp DESC)`,
  `CREATE INDEX IF NOT EXISTS audit_logs_token_id_idx
     ON audit_logs (token_id)`,
  `CREATE INDEX IF NOT EXISTS banned_ips_range_idx
     ON banned_ips (range)`,
];

/* ─────────────────────────  Main  ─────────────────────────── */

/**
 * Initialises the PostgreSQL schema using MikroORM SchemaGenerator, then
 * applies supplementary indexes that cannot be expressed via decorator.
 *
 * @returns Promise that resolves when schema and indexes are ready.
 */
async function main(): Promise<void> {
  const orm = await MikroORM.init(
    defineConfig({
      clientUrl: process.env.DATABASE_URL,
      metadataProvider: TsMorphMetadataProvider,
      driverOptions: {
        connection: {
          ssl:
            process.env.DATABASE_SSL === 'false'
              ? false
              : { rejectUnauthorized: false },
        },
      },
      entities: [
        AuditRecordEntity,
        BannedIpEntity,
        BloodlineBoonEntity,
        BloodlineEntity,
        CorrectionsUserEntity,
        DraftEntity,
        HeirloomChargesEmbed,
        HeirloomEntity,
        MonsterACEmbed,
        MonsterEntity,
        MonsterHPEmbed,
        MonsterSaveEmbed,
        MonsterScoreEmbed,
        MonsterSenseEmbed,
        MonsterSpeedEmbed,
        SchemaMigrationEntity,
        SpecializationEntity,
        SpecializationFeatureEntity,
        SpecializationPreparedSpellEntity,
        SpecializationSpellcastingEmbed,
        SpellComponentEmbed,
        SpellEntity,
        SpellListEntity,
        TrinketEntity,
        TrinketSavingThrowEmbed,
        VocationEntity,
        VocationFeatureEntity,
        VocationSkillProficienciesEmbed,
        VocationSpellcastingEmbed,
      ],
      debug: false,
      forceEntityConstructor: true,
    }),
  );

  try {
    log.message('🔄  Synchronising schema via MikroORM SchemaGenerator…');
    await orm.getSchemaGenerator().updateSchema({ safe: true, wrap: false });
    log.message('✅  Schema synchronised.');

    if (SUPPLEMENTARY_INDEXES.length > 0) {
      log.message('🔄  Creating supplementary indexes…');
      const conn = orm.em.getConnection('write');
      for (const sql of SUPPLEMENTARY_INDEXES) {
        await conn.execute(sql);
      }
      log.message('✅  Supplementary indexes created (or already existed.');
    }
  } finally {
    await orm.close(true);
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  log.error('❌  init-db failed:', { error: message });
  process.exit(1);
});
