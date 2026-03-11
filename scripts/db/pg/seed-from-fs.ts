/**
 * @fileoverview PostgreSQL Seed Script — FS → Postgres (MikroORM)
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
 *   monsters, heirlooms, spells + spell_lists, trinkets
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
    type EntityManager,
} from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
    CorrectionsUserEntity,
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
    SpellComponentEmbed,
    SpellEntity,
    SpellListEntity,
    TrinketEntity,
    TrinketSavingThrowEmbed,
} from '../../../src/lib/db/orm/entities/index';

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

/* ────────────────────  Metadata JSON Interfaces  ──────────────────── */

/**
 * @description Monster metadata shape produced by generateMonsterMetadata.mjs.
 */
interface MonsterMeta {
  slug: string;
  subSlug?: string;
  title: string;
  file: string;
  link: string;
  size?: string;
  creatureType?: string;
  alignment?: string;
  cr?: string;
  proficiencyBonus?: number;
  ac?: { value?: number; notes?: string; raw?: string };
  hp?: { average?: number; formula?: string; raw?: string };
  speed?: {
    raw?: string;
    modes?: {
      walk?: number;
      fly?: number;
      climb?: number;
      swim?: number;
      burrow?: number;
      hover?: boolean;
    };
  };
  abilities?: Record<string, { score?: number }>;
  savingThrows?: Record<string, number>;
  senses?: {
    raw?: string;
    passivePerception?: number;
    darkvision?: number;
    blindsight?: number;
    tremorsense?: number;
    truesight?: number;
  };
  skills?: string[];
  damageResistances?: string[];
  damageImmunities?: string[];
  damageVulnerabilities?: string[];
  conditionImmunities?: string[];
  languages?: string[];
  tags?: string[];
  indexVersion?: number;
}

/**
 * @description Spell metadata shape produced by generateSpellMetadata.mjs.
 */
interface SpellMeta {
  slug: string;
  title: string;
  file: string;
  link: string;
  level?: number;
  school?: string;
  quality?: string;
  castingTimeRaw?: string;
  castingTime?: string[];
  range?: string;
  concentration?: boolean;
  duration?: string;
  verbal?: boolean;
  somatic?: boolean;
  material?: boolean;
  materialDescription?: string;
  hasRitual?: boolean;
  tags?: string[];
  spellLists?: { name: string; link: string }[];
}

/**
 * @description Heirloom metadata shape produced by generateHeirloomMetadata.mjs.
 */
interface HeirloomMeta {
  slug: string;
  title: string;
  file: string;
  link: string;
  rarity?: string;
  itemType?: string;
  weaponType?: string;
  requiresAttunement?: boolean;
  attunementRequirements?: string;
  weaponDamage?: {
    damage?: string;
    damageType?: string;
    versatileDamage?: string;
  };
  hitModifier?: number;
  range?: string;
  weight?: string;
  charges?: { initial?: string; recharge?: string; depletes?: boolean };
  mastery?: string[];
  weaponProperties?: string[];
  damageTypesDealt?: string[];
  savingThrowTypes?: string[];
  tags?: string[];
  indexVersion?: number;
}

/**
 * @description Trinket metadata shape produced by generateTrinketMetadata.mjs.
 */
interface TrinketMeta {
  slug: string;
  title: string;
  file: string;
  link: string;
  itemType: string;
  damage?: string;
  damageType?: string;
  range?: string;
  weight?: string;
  savingThrowDC?: number;
  savingThrowAbility?: string;
  properties?: string[];
  specialEffects?: string[];
  inflictsConditions?: string[];
  tags?: string[];
}

/* ─────────────────────  Filesystem helpers  ────────────────────────── */

/**
 * Returns the content directory for a given locale.
 *
 * @param locale - Locale code
 * @returns Absolute path to `src/content/{locale}`
 */
const contentDir = (locale: string): string =>
  join(ROOT, 'src', 'content', locale);

/**
 * Returns the `.meta/` directory for a given locale.
 *
 * @param locale - Locale code
 * @returns Absolute path to `.meta/{locale}`
 */
const metaDir = (locale: string): string => join(ROOT, '.meta', locale);

/**
 * Reads and flattens all `.metadata.json` sidecar files from a subdirectory.
 * Checks `.meta/{locale}/{subdir}` first, falls back to `src/content/{locale}/{subdir}`.
 *
 * @param locale - Locale code
 * @param subdir - Subdirectory (e.g. 'monsters', 'items/heirlooms')
 * @returns Flattened metadata records
 */
const readMetadata = <T>(locale: string, subdir: string): T[] => {
  const metaDirPath = join(metaDir(locale), subdir);
  const contentDirPath = join(contentDir(locale), subdir);
  const dir = existsSync(metaDirPath) ? metaDirPath : contentDirPath;
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.metadata.json'))
    .flatMap((f) => {
      const parsed = JSON.parse(readFileSync(join(dir, f), 'utf8'));
      return Array.isArray(parsed) ? parsed : [parsed];
    });
};

/* ─────────────────────────  Seeders  ───────────────────────────────── */

/**
 * Seeds the `monsters` table for one locale.
 *
 * @param em - Transaction-scoped entity manager
 * @param locale - Locale code
 * @returns Number of rows inserted
 */
async function seedMonsters(
  em: EntityManager,
  locale: string,
): Promise<number> {
  const records = readMetadata<MonsterMeta>(locale, 'monsters');
  if (records.length === 0) return 0;

  await em.nativeDelete(MonsterEntity, { locale });

  for (const m of records) {
    const modes = m.speed?.modes ?? {};

    em.create(MonsterEntity, {
      locale,
      slug: m.slug,
      subSlug: m.subSlug,
      title: m.title,
      file: m.file,
      link: m.link,
      size: m.size,
      creatureType: m.creatureType,
      alignment: m.alignment,
      cr: m.cr,
      proficiencyBonus: m.proficiencyBonus,
      ac: { value: m.ac?.value, notes: m.ac?.notes, raw: m.ac?.raw },
      hp: { average: m.hp?.average, formula: m.hp?.formula, raw: m.hp?.raw },
      speed: {
        raw: m.speed?.raw,
        walk: modes.walk,
        fly: modes.fly,
        climb: modes.climb,
        swim: modes.swim,
        burrow: modes.burrow,
        hover: modes.hover,
      },
      scores: {
        str: m.abilities?.str?.score,
        dex: m.abilities?.dex?.score,
        con: m.abilities?.con?.score,
        int: m.abilities?.int?.score,
        wis: m.abilities?.wis?.score,
        cha: m.abilities?.cha?.score,
      },
      saves: {
        str: m.savingThrows?.str,
        dex: m.savingThrows?.dex,
        con: m.savingThrows?.con,
        int: m.savingThrows?.int,
        wis: m.savingThrows?.wis,
        cha: m.savingThrows?.cha,
      },
      senses: {
        raw: m.senses?.raw,
        passivePerception: m.senses?.passivePerception,
        darkvision: m.senses?.darkvision,
        blindsight: m.senses?.blindsight,
        tremorsense: m.senses?.tremorsense,
        truesight: m.senses?.truesight,
      },
      skills: m.skills ?? [],
      damageResistances: m.damageResistances ?? [],
      damageImmunities: m.damageImmunities ?? [],
      damageVulnerabilities: m.damageVulnerabilities ?? [],
      conditionImmunities: m.conditionImmunities ?? [],
      languages: m.languages ?? [],
      tags: m.tags ?? [],
      indexVersion: m.indexVersion,
    });
  }

  await em.flush();
  return records.length;
}

/**
 * Seeds the `heirlooms` table for one locale.
 *
 * @param em - Transaction-scoped entity manager
 * @param locale - Locale code
 * @returns Number of rows inserted
 */
async function seedHeirlooms(
  em: EntityManager,
  locale: string,
): Promise<number> {
  const records = readMetadata<HeirloomMeta>(
    locale,
    join('items', 'heirlooms'),
  );
  if (records.length === 0) return 0;

  await em.nativeDelete(HeirloomEntity, { locale });

  for (const h of records) {
    const wd = h.weaponDamage ?? {};
    const ch = h.charges ?? {};

    em.create(HeirloomEntity, {
      locale,
      slug: h.slug,
      title: h.title,
      file: h.file,
      link: h.link,
      rarity: h.rarity,
      itemType: h.itemType,
      weaponType: h.weaponType,
      requiresAttunement: h.requiresAttunement,
      attunementRequirements: h.attunementRequirements,
      weaponDamage: wd.damage,
      weaponDamageType: wd.damageType,
      versatileDamage: wd.versatileDamage,
      hitModifier: h.hitModifier,
      range: h.range,
      weight: h.weight,
      charges: {
        initial: ch.initial,
        recharge: ch.recharge,
        depletes: ch.depletes,
      },
      mastery: h.mastery ?? [],
      weaponProperties: h.weaponProperties ?? [],
      damageTypesDealt: h.damageTypesDealt ?? [],
      savingThrowTypes: h.savingThrowTypes ?? [],
      tags: h.tags ?? [],
      indexVersion: h.indexVersion,
    });
  }

  await em.flush();
  return records.length;
}

/**
 * Seeds the `spells` + `spell_lists` tables for one locale.
 * MikroORM handles FK assignment and insert ordering automatically.
 *
 * @param em - Transaction-scoped entity manager
 * @param locale - Locale code
 * @returns Number of spell rows inserted
 */
async function seedSpells(em: EntityManager, locale: string): Promise<number> {
  const records = readMetadata<SpellMeta>(locale, 'spells');
  if (records.length === 0) return 0;

  await em.nativeDelete(SpellEntity, { locale });

  for (const s of records) {
    const spell = em.create(SpellEntity, {
      locale,
      slug: s.slug,
      title: s.title,
      file: s.file,
      link: s.link,
      level: s.level,
      school: s.school,
      quality: s.quality,
      castingTimeRaw: s.castingTimeRaw,
      castingTime: s.castingTime ?? [],
      range: s.range,
      concentration: s.concentration,
      duration: s.duration,
      components: {
        verbal: s.verbal,
        somatic: s.somatic,
        material: s.material,
        materialDescription: s.materialDescription,
      },
      hasRitual: s.hasRitual,
      tags: s.tags ?? [],
    });

    for (const ref of s.spellLists ?? []) {
      em.create(SpellListEntity, {
        spell,
        name: ref.name,
        link: ref.link,
      });
    }
  }

  await em.flush();
  return records.length;
}

/**
 * Seeds the `trinkets` table for one locale.
 *
 * @param em - Transaction-scoped entity manager
 * @param locale - Locale code
 * @returns Number of rows inserted
 */
async function seedTrinkets(
  em: EntityManager,
  locale: string,
): Promise<number> {
  const records = readMetadata<TrinketMeta>(locale, join('items', 'trinkets'));
  if (records.length === 0) return 0;

  await em.nativeDelete(TrinketEntity, { locale });

  for (const t of records) {
    em.create(TrinketEntity, {
      locale,
      slug: t.slug,
      title: t.title,
      file: t.file,
      link: t.link,
      itemType: t.itemType,
      damage: t.damage,
      damageType: t.damageType,
      range: t.range,
      weight: t.weight,
      savingThrow: {
        dc: t.savingThrowDC,
        ability: t.savingThrowAbility,
      },
      properties: t.properties ?? [],
      specialEffects: t.specialEffects ?? [],
      inflictsConditions: t.inflictsConditions ?? [],
      tags: t.tags ?? [],
    });
  }

  await em.flush();
  return records.length;
}

/* ────────────────────────  Orchestrator  ───────────────────────────── */

/**
 * Seeds all content tables for a single locale inside one transaction.
 *
 * @param orm - MikroORM instance
 * @param locale - Locale code
 */
async function seedLocale(orm: MikroORM, locale: string): Promise<void> {
  const em = orm.em.fork();

  await em.transactional(async (tx) => {
    const monsters = await seedMonsters(tx, locale);
    const heirlooms = await seedHeirlooms(tx, locale);
    const spells = await seedSpells(tx, locale);
    const trinkets = await seedTrinkets(tx, locale);

    console.log(
      `  ✅  ${locale}:  monsters=${monsters}  heirlooms=${heirlooms}  spells=${spells}  trinkets=${trinkets}`,
    );
  });
}

async function main(): Promise<void> {
  const orm = await MikroORM.init(
    defineConfig({
      clientUrl: process.env.DATABASE_URL,
      metadataProvider: TsMorphMetadataProvider,
      driverOptions: { connection: { ssl: true } },
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
