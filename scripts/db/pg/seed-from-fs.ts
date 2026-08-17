/**
 * @fileoverview PostgreSQL Seed Script — FS → Postgres (MikroORM)
 * @module scripts/db/pg/seed-from-fs
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 * @description Reads every `.metadata.json` sidecar file from the local content
 * tree and seeds it into PostgreSQL via MikroORM entity manager.
 *
 * Safe to run multiple times: each locale is fully replaced per run (DELETE
 * then bulk INSERT inside a transaction), so stale rows never accumulate.
 *
 * Uses MikroORM entities directly — schema changes (add/rename/drop a column)
 * are handled by updating the entity class; no positional $1…$N arrays to maintain.
 *
 * Tables populated:
 *   monsters, heirlooms, spells + spell_lists, trinkets, bloodlines + bloodline_boons
 *
 * Usage:
 *   npx tsx scripts/db/pg/seed-from-fs.ts [locale]
 *   npx tsx scripts/db/pg/seed-from-fs.ts en
 *   npx tsx scripts/db/pg/seed-from-fs.ts        # seeds all supported locales
 *
 * Required env:
 *   DATABASE_URL — Neon / Postgres connection string
 */

import {
    defineConfig,
    MikroORM,
    type EntityClass,
    type EntityManager,
    type MetadataStorage,
} from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { existsSync, readdirSync, readFileSync } from 'fs';
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
import { recordToEntityInit } from '../../../src/lib/db/orm/reflect';
import { contentHash } from '../../../src/lib/metadata/contentHash';

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

const SUPPORTED_LOCALES = ['en', 'es', 'fi'];

/* ─────────────────────  Filesystem helpers  ────────────────────────── */

/**
 * Returns the content directory for a given locale.
 *
 * @param {string} locale - Locale code
 * @returns Absolute path to `src/content/{locale}`
 */
const contentDir = (locale: string): string =>
  join(ROOT, 'src', 'content', locale);

/**
 * Returns the `.meta/` directory for a given locale.
 *
 * @param {string} locale - Locale code
 * @returns Absolute path to `.meta/{locale}`
 */
const metaDir = (locale: string): string => join(ROOT, '.meta', locale);

/**
 * Reads and flattens all `.metadata.json` sidecar files from a subdirectory.
 * Checks `.meta/{locale}/{subdir}` first, falls back to `src/content/{locale}/{subdir}`.
 * Recursively walks subdirectories.
 *
 * @param {string} locale - Locale code
 * @param {string} subdir - Subdirectory (e.g. 'monsters', 'items/heirlooms')
 * @returns Flattened metadata records
 */
const readMetadata = <T>(locale: string, subdir: string): T[] => {
  const metaDirPath = join(metaDir(locale), subdir);
  const contentDirPath = join(contentDir(locale), subdir);
  const dir = existsSync(metaDirPath) ? metaDirPath : contentDirPath;
  if (!existsSync(dir)) return [];

  const results: T[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.metadata.json')) {
        const parsed = JSON.parse(readFileSync(full, 'utf8'));
        results.push(...(Array.isArray(parsed) ? parsed : [parsed]));
      }
    }
  };
  walk(dir);
  return results;
};

/* ────────────────────  Generic Seeder  ────────────────────────────── */

/**
 * Configuration for a single-table content seed pass.
 *
 * @interface ContentSeedConfig
 * @property {EntityClass<object>} entityClass - MikroORM entity constructor
 * @property {string} subdir - Content subdirectory path within the locale folder
 * @property {Function} [seedChildren] - Creates child entities (relations) after the parent row
 */
interface ContentSeedConfig {
  entityClass: EntityClass<object>;
  subdir: string;
  /** Optional filter to separate entity types sharing a subdir (e.g. vocations vs specializations) */
  filter?: (raw: Record<string, unknown>) => boolean;
  seedChildren?: (
    em: EntityManager,
    allMeta: MetadataStorage,
    parent: object,
    raw: Record<string, unknown>,
  ) => void;
}

/**
 * Generic seeder: reads all `.metadata.json` sidecar files for `config.subdir`,
 * deletes existing rows for the locale, and inserts fresh rows using
 * `recordToEntityInit` driven by ORM reflection metadata.
 *
 * Field selection is entirely reflection-driven — no property names are enumerated
 * here. The optional `seedChildren` handles child tables after each parent row.
 *
 * Version hash is always recomputed from the raw payload to
 * stay consistent with `backfillTable` in `backfill-version-hashes.ts`.
 *
 * @param {EntityManager} em - Transaction-scoped entity manager
 * @param {MetadataStorage} allMeta - ORM metadata from `orm.getMetadata()`
 * @param {string} locale - Locale being seeded
 * @param {ContentSeedConfig} config - Entity class, subdirectory, and optional children seeder
 * @returns {Promise<number>} Number of parent rows inserted
 */
async function seedContent(
  em: EntityManager,
  allMeta: MetadataStorage,
  locale: string,
  config: ContentSeedConfig,
): Promise<number> {
  const records = readMetadata<Record<string, unknown>>(locale, config.subdir);
  const filtered = config.filter ? records.filter(config.filter) : records;
  if (filtered.length === 0) return 0;

  await em.nativeDelete(config.entityClass, { locale } as never);

  for (const raw of filtered.filter(Boolean)) {
    const hashPayload: Record<string, unknown> = { ...raw };
    delete hashPayload['versionHash'];
    const versionHash = contentHash(hashPayload);
    const init = recordToEntityInit(allMeta, config.entityClass.name, {
      locale,
      ...raw,
      versionHash,
    });
    const parent = em.create(config.entityClass, init as never);
    config.seedChildren?.(em, allMeta, parent, raw);
  }

  await em.flush();
  return filtered.length;
}

/**
 * Seed configurations for all content entity types, ordered to respect FK
 * constraints (parent entities before child entities).
 */
const SEED_CONFIGS: ContentSeedConfig[] = [
  {
    entityClass: MonsterEntity,
    subdir: 'monsters',
    seedChildren: (em, allMeta, parent, raw) => {
      const features = (raw.features ?? []) as Array<Record<string, unknown>>;
      for (let i = 0; i < features.length; i++) {
        const feature = features[i];
        const source = (feature.source ?? {}) as Record<string, unknown>;
        const init = recordToEntityInit(
          allMeta,
          MonsterFeatureEntity.name,
          feature,
        );
        em.create(MonsterFeatureEntity, {
          ...init,
          monster: parent,
          featureId: feature.id as string,
          sortOrder: i,
          startLine: source.start as number | undefined,
          endLine: source.end as number | undefined,
        } as never);
      }
    },
  },
  {
    entityClass: HeirloomEntity,
    subdir: join('items', 'heirlooms'),
  },
  {
    entityClass: SpellEntity,
    subdir: 'spells',
    seedChildren: (em, allMeta, parent, raw) => {
      for (const ref of (raw.spellLists ?? []) as Array<
        Record<string, unknown>
      >) {
        const init = recordToEntityInit(allMeta, SpellListEntity.name, ref);
        em.create(SpellListEntity, { spell: parent, ...init } as never);
      }
    },
  },
  {
    entityClass: TrinketEntity,
    subdir: join('items', 'trinkets'),
  },
  {
    entityClass: RuleEntity,
    subdir: 'rules',
  },
  {
    entityClass: WorldEntity,
    subdir: 'world',
  },
  {
    entityClass: BloodlineEntity,
    subdir: join('character-creation', 'bloodlines'),
    seedChildren: (em, allMeta, parent, raw) => {
      for (const boon of (raw.boons ?? []) as Array<Record<string, unknown>>) {
        const init = recordToEntityInit(
          allMeta,
          BloodlineBoonEntity.name,
          boon,
        );
        const boonEntity = em.create(BloodlineBoonEntity, {
          bloodline: parent,
          ...init,
        } as never) as unknown as BloodlineBoonEntity;
        const options = (boon.subOptions ?? []) as Array<Record<string, unknown>>;
        for (let i = 0; i < options.length; i++) {
          const option = options[i];
          em.create(BloodlineBoonOptionEntity, {
            boon: boonEntity,
            name: option.name as string,
            anchor: (option.anchor as string | undefined) ?? null,
            bpValue: (option.bpValue as number | undefined) ?? 0,
            effect: (option.effect as string | undefined) ?? null,
            tags: (option.tags as string[] | undefined) ?? [],
            sortOrder: i,
          } as never);
        }
      }
      const features = (raw.features ?? []) as Array<Record<string, unknown>>;
      for (let i = 0; i < features.length; i++) {
        const feature = features[i];
        const source = (feature.source ?? {}) as Record<string, unknown>;
        const init = recordToEntityInit(
          allMeta,
          BloodlineFeatureEntity.name,
          feature,
        );
        em.create(BloodlineFeatureEntity, {
          ...init,
          bloodline: parent,
          featureId: feature.id as string,
          sortOrder: i,
          startLine: source.start as number | undefined,
          endLine: source.end as number | undefined,
        } as never);
      }
    },
  },
  {
    filter: (raw) => !!raw.archetype,
    entityClass: VocationEntity,
    subdir: join('character-creation', 'vocations'),
    seedChildren: (em, allMeta, parent, raw) => {
      const features = (raw.features ?? []) as Array<Record<string, unknown>>;
      for (let i = 0; i < features.length; i++) {
        const init = recordToEntityInit(
          allMeta,
          VocationFeatureEntity.name,
          features[i],
        );
        em.create(VocationFeatureEntity, {
          ...init,
          vocation: parent,
          sortOrder: i,
        } as never);
      }
    },
  },
  {
    filter: (raw) => !raw.archetype,
    entityClass: SpecializationEntity,
    subdir: join('character-creation', 'vocations'),
    seedChildren: (em, allMeta, parent, raw) => {
      const features = (raw.features ?? []) as Array<Record<string, unknown>>;
      for (let i = 0; i < features.length; i++) {
        const init = recordToEntityInit(
          allMeta,
          SpecializationFeatureEntity.name,
          features[i],
        );
        em.create(SpecializationFeatureEntity, {
          ...init,
          specialization: parent,
          sortOrder: i,
        } as never);
      }
      const prepared = (raw.preparedSpells ?? []) as Array<
        Record<string, unknown>
      >;
      for (let i = 0; i < prepared.length; i++) {
        const init = recordToEntityInit(
          allMeta,
          SpecializationPreparedSpellEntity.name,
          prepared[i],
        );
        em.create(SpecializationPreparedSpellEntity, {
          ...init,
          specialization: parent,
          sortOrder: i,
        } as never);
      }
    },
  },
  {
    entityClass: FeatEntity,
    subdir: join('character-creation', 'feats'),
    seedChildren: (em, allMeta, parent, raw) => {
      const features = (raw.features ?? []) as Array<Record<string, unknown>>;
      for (let i = 0; i < features.length; i++) {
        const init = recordToEntityInit(
          allMeta,
          FeatFeatureEntity.name,
          features[i],
        );
        em.create(FeatFeatureEntity, {
          ...init,
          feat: parent,
          sortOrder: i,
        } as never);
      }
    },
  },
];

/* ────────────────────────  Orchestrator  ───────────────────────────── */

/**
 * Seeds all content tables for a single locale inside one transaction.
 *
 * @param {MikroORM} orm - MikroORM instance
 * @param {string} locale - Locale code
 */
async function seedLocale(orm: MikroORM, locale: string): Promise<void> {
  const allMeta = orm.getMetadata();
  const em = orm.em.fork();

  await em.transactional(async (tx) => {
    const counts: string[] = [];
    for (const cfg of SEED_CONFIGS) {
      const n = await seedContent(tx, allMeta, locale, cfg);
      counts.push(`${allMeta.get(cfg.entityClass.name).collection}=${n}`);
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

main().catch((err) => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
