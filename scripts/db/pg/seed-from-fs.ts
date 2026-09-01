/**
 * @fileoverview Seeds .metadata.json sidecars to PostgreSQL via MikroORM.
 * @description Replaces data per locale each run (delete + insert in transaction).
 *
 * @module scripts/db/pg/seed-from-fs
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

import {
    defineConfig,
    MikroORM,
    type EntityClass,
    type EntityManager,
} from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
    BloodlineBoonEntity,
    BloodlineBoonOptionEntity,
    BloodlineFeatureEntity,
    BloodlineEntity,
    CorrectionsUserEntity,
    FeatAbilityIncreaseEmbed,
    FeatEntity,
    FeatFeatureEntity,
    HeirloomChargesEmbed,
    HeirloomEntity,
    MonsterACEmbed,
    MonsterEntity,
    MonsterFeatureEntity,
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
    RuleEntity,
    TrinketEntity,
    WorldEntity,
    TrinketSavingThrowEmbed,
    VocationEntity,
    VocationFeatureEntity,
    VocationSkillProficienciesEmbed,
    VocationSpellcastingEmbed,
} from '../../../src/lib/db/orm/entities/index';
import { syncTable, type SyncTarget } from '../../../src/lib/metadata/genericSync';
import { SYNC_TARGETS } from '../../../src/lib/metadata/syncTargets';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../');

/* ─────────────────────────  Env  ──────────────────────────────────── */

try {
  const raw = readFileSync(join(ROOT, '.env.local'), 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    const val = t
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  /* .env.local absent — rely on system env */
}

if (!process.env.DATABASE_URL) {
  console.error('❌  DATABASE_URL is not set.');
  process.exit(1);
}

import { SUPPORTED_LOCALES } from '@/lib/constants/locales';
import { guardDeployWrites } from './deployGuard';

/* ─────────────────────  Filesystem helpers  ────────────────────────── */

/* ────────────────────  Generic Seeder  ────────────────────────────── */

/**
 * Seeds one content table for a locale by replacing its rows.
 *
 * @param {EntityManager} em - Transaction-scoped entity manager
 * @param {string} locale - Locale code
 * @param {SyncTarget} target - Table to seed
 * @returns {Promise<number>} Rows written
 */
async function seedContent(
  em: EntityManager,
  locale: string,
  target: SyncTarget,
): Promise<number> {
  const result = await syncTable(em, locale, target, { allowDeletion: true });
  return result.inserted + result.updated + result.skipped;
}

async function seedLocale(orm: MikroORM, locale: string): Promise<void> {
  const em = orm.em.fork();

  await em.transactional(async (tx) => {
    const counts: string[] = [];
    for (const [type, target] of Object.entries(SYNC_TARGETS)) {
      const n = await seedContent(tx as EntityManager, locale, target);
      counts.push(`${type}=${n}`);
    }
    console.log(`  ✅  ${locale}:  ${counts.join('  ')}`);
  });
}

/**
 * Script entry point — initialises MikroORM and seeds each requested locale.
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
        BloodlineEntity,
        BloodlineBoonEntity,
        BloodlineBoonOptionEntity,
        BloodlineFeatureEntity,
        MonsterEntity,
        MonsterFeatureEntity,
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
        RuleEntity,
        WorldEntity,
        VocationEntity,
        VocationFeatureEntity,
        VocationSkillProficienciesEmbed,
        VocationSpellcastingEmbed,
        SpecializationEntity,
        SpecializationFeatureEntity,
        SpecializationPreparedSpellEntity,
        SpecializationSpellcastingEmbed,
        FeatEntity,
        FeatAbilityIncreaseEmbed,
        FeatFeatureEntity,
        CorrectionsUserEntity,
        SchemaMigrationEntity,
      ],
      debug: false,
    }),
  );

  try {
    const arg = process.argv[2];
    const locales = arg ? [arg] : SUPPORTED_LOCALES;

    console.log(`🌱  Seeding locales: ${locales.join(', ')}`);
    for (const locale of locales) {
      await seedLocale(orm, locale);
    }
    console.log('🏁  Seed complete.');
  } finally {
    await orm.close();
  }
}

guardDeployWrites('metadata seed');

main().catch((err) => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
