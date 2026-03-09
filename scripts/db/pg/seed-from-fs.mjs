/**
 * @fileoverview PostgreSQL Seed Script — FS → Prisma (Postgres)
 * @description Reads every `.metadata.json` sidecar file from the local content
 * tree and upserts it into the corresponding Postgres table via Prisma ORM.
 *
 * Safe to run multiple times: each locale is fully replaced per run (deleteMany
 * then createMany inside a Prisma interactive transaction), so stale rows never
 * accumulate.
 *
 * Tables populated:
 *   monsters, heirlooms, spells + spell_lists, trinkets
 *
 * Usage:
 *   node scripts/db/pg/seed-from-fs.mjs [locale]
 *   node scripts/db/pg/seed-from-fs.mjs en
 *   node scripts/db/pg/seed-from-fs.mjs        # seeds all supported locales
 *
 * Required env:
 *   DATABASE_URL — Neon / Postgres connection string
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from '../../core/logger.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../');
const log = createLogger({ script: 'seed-from-fs' });

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
  log.error('❌  DATABASE_URL is not set.');
  process.exit(1);
}

const SUPPORTED_LOCALES = ['en', 'es', 'fi'];

/* ─────────────────────  Filesystem helpers  ────────────────────────── */

/**
 * Returns the content directory for a given locale.
 *
 * @param {string} locale - Locale code
 * @returns {string} Absolute path to `src/content/{locale}`
 */
const contentDir = (locale) => join(ROOT, 'src', 'content', locale);

/**
 * Returns the `.meta/` directory for a given locale.
 *
 * @param {string} locale - Locale code
 * @returns {string} Absolute path to `.meta/{locale}`
 */
const metaDir = (locale) => join(ROOT, '.meta', locale);

/**
 * Reads and flattens all `.metadata.json` sidecar files from a subdirectory.
 * Checks `.meta/{locale}/{subdir}` first, falls back to `src/content/{locale}/{subdir}`.
 *
 * @param {string} locale - Locale code
 * @param {string} subdir - Subdirectory (e.g. 'monsters', 'items/heirlooms')
 * @returns {unknown[]} Flattened metadata records
 */
const readMetadata = (locale, subdir) => {
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
 * Seeds the `monsters` table for one locale via Prisma `createMany`.
 *
 * @param {import('@prisma/client').Prisma.TransactionClient} tx - Prisma transaction client
 * @param {string} locale - Locale code
 * @returns {Promise<number>} Number of rows inserted
 */
async function seedMonsters(tx, locale) {
  const records = readMetadata(locale, 'monsters');
  if (records.length === 0) return 0;

  await tx.monster.deleteMany({ where: { locale } });

  await tx.monster.createMany({
    data: records.map((m) => {
      const ab = m.abilities ?? {};
      const st = m.savingThrows ?? {};
      const sp = m.speed ?? {};
      const modes = sp.modes ?? {};
      const senses = m.senses ?? {};
      const ac = m.ac ?? {};
      const hp = m.hp ?? {};

      return {
        locale,
        slug: m.slug ?? '',
        subSlug: m.subSlug ?? null,
        title: m.title ?? '',
        file: m.file ?? '',
        link: m.link ?? '',
        size: m.size ?? null,
        creatureType: m.creatureType ?? null,
        alignment: m.alignment ?? null,
        cr: m.cr ?? null,
        proficiencyBonus: m.proficiencyBonus ?? null,
        acValue: ac.value ?? null,
        acNotes: ac.notes ?? null,
        acRaw: ac.raw ?? null,
        hpAverage: hp.average ?? null,
        hpFormula: hp.formula ?? null,
        hpRaw: hp.raw ?? null,
        speedRaw: sp.raw ?? null,
        speedWalk: modes.walk ?? null,
        speedFly: modes.fly ?? null,
        speedClimb: modes.climb ?? null,
        speedSwim: modes.swim ?? null,
        speedBurrow: modes.burrow ?? null,
        speedHover: modes.hover ?? null,
        strScore: ab.str?.score ?? null,
        dexScore: ab.dex?.score ?? null,
        conScore: ab.con?.score ?? null,
        intScore: ab.int?.score ?? null,
        wisScore: ab.wis?.score ?? null,
        chaScore: ab.cha?.score ?? null,
        saveStr: st.str ?? null,
        saveDex: st.dex ?? null,
        saveCon: st.con ?? null,
        saveInt: st.int ?? null,
        saveWis: st.wis ?? null,
        saveCha: st.cha ?? null,
        sensesRaw: senses.raw ?? null,
        passivePerception: senses.passivePerception ?? null,
        darkvision: senses.darkvision ?? null,
        blindsight: senses.blindsight ?? null,
        tremorsense: senses.tremorsense ?? null,
        truesight: senses.truesight ?? null,
        skills: m.skills ?? [],
        damageResistances: m.damageResistances ?? [],
        damageImmunities: m.damageImmunities ?? [],
        damageVulnerabilities: m.damageVulnerabilities ?? [],
        conditionImmunities: m.conditionImmunities ?? [],
        languages: m.languages ?? [],
        tags: m.tags ?? [],
        indexVersion: m.indexVersion ?? null,
      };
    }),
  });

  return records.length;
}

/**
 * Seeds the `heirlooms` table for one locale via Prisma `createMany`.
 *
 * @param {import('@prisma/client').Prisma.TransactionClient} tx - Prisma transaction client
 * @param {string} locale - Locale code
 * @returns {Promise<number>} Number of rows inserted
 */
async function seedHeirlooms(tx, locale) {
  const records = readMetadata(locale, join('items', 'heirlooms'));
  if (records.length === 0) return 0;

  await tx.heirloom.deleteMany({ where: { locale } });

  await tx.heirloom.createMany({
    data: records.map((h) => {
      const wd = h.weaponDamage ?? {};
      const ch = h.charges ?? {};
      return {
        locale,
        slug: h.slug ?? '',
        title: h.title ?? '',
        file: h.file ?? '',
        link: h.link ?? '',
        rarity: h.rarity ?? null,
        itemType: h.itemType ?? null,
        weaponType: h.weaponType ?? null,
        requiresAttunement: h.requiresAttunement ?? null,
        attunementRequirements: h.attunementRequirements ?? null,
        weaponDamage: wd.damage ?? null,
        weaponDamageType: wd.damageType ?? null,
        versatileDamage: wd.versatileDamage ?? null,
        hitModifier: h.hitModifier ?? null,
        range: h.range ?? null,
        weight: h.weight ?? null,
        chargesInitial: ch.initial ?? null,
        chargesRecharge: ch.recharge ?? null,
        chargesDepletes: ch.depletes ?? null,
        mastery: h.mastery ?? [],
        weaponProperties: h.weaponProperties ?? [],
        damageTypesDealt: h.damageTypesDealt ?? [],
        savingThrowTypes: h.savingThrowTypes ?? [],
        tags: h.tags ?? [],
        indexVersion: h.indexVersion ?? null,
      };
    }),
  });

  return records.length;
}

/**
 * Seeds the `spells` and `spell_lists` tables for one locale.
 * Uses Prisma nested writes so each spell is inserted along with its
 * spell_lists children in a single operation.
 *
 * @param {import('@prisma/client').Prisma.TransactionClient} tx - Prisma transaction client
 * @param {string} locale - Locale code
 * @returns {Promise<number>} Number of spell rows inserted
 */
async function seedSpells(tx, locale) {
  const records = readMetadata(locale, 'spells');
  if (records.length === 0) return 0;

  await tx.spell.deleteMany({ where: { locale } });

  for (const s of records) {
    await tx.spell.create({
      data: {
        locale,
        slug: s.slug ?? '',
        title: s.title ?? '',
        file: s.file ?? '',
        link: s.link ?? '',
        level: s.level ?? null,
        school: s.school ?? null,
        quality: s.quality ?? null,
        castingTimeRaw: s.castingTimeRaw ?? null,
        castingTime: s.castingTime ?? [],
        range: s.range ?? null,
        concentration: s.concentration ?? null,
        duration: s.duration ?? null,
        verbal: s.verbal ?? null,
        somatic: s.somatic ?? null,
        material: s.material ?? null,
        materialDescription: s.materialDescription ?? null,
        hasRitual: s.hasRitual ?? null,
        tags: s.tags ?? [],
        spellLists: {
          create: (s.spellLists ?? []).map((ref) => ({
            name: ref.name,
            link: ref.link,
          })),
        },
      },
    });
  }

  return records.length;
}

/**
 * Seeds the `trinkets` table for one locale via Prisma `createMany`.
 *
 * @param {import('@prisma/client').Prisma.TransactionClient} tx - Prisma transaction client
 * @param {string} locale - Locale code
 * @returns {Promise<number>} Number of rows inserted
 */
async function seedTrinkets(tx, locale) {
  const records = readMetadata(locale, join('items', 'trinkets'));
  if (records.length === 0) return 0;

  await tx.trinket.deleteMany({ where: { locale } });

  await tx.trinket.createMany({
    data: records.map((t) => ({
      locale,
      slug: t.slug ?? '',
      title: t.title ?? '',
      file: t.file ?? '',
      link: t.link ?? '',
      itemType: t.itemType ?? '',
      damage: t.damage ?? null,
      damageType: t.damageType ?? null,
      range: t.range ?? null,
      weight: t.weight ?? null,
      savingThrowDc: t.savingThrowDC ?? null,
      savingThrowAbility: t.savingThrowAbility ?? null,
      properties: t.properties ?? [],
      specialEffects: t.specialEffects ?? [],
      inflictsConditions: t.inflictsConditions ?? [],
      tags: t.tags ?? [],
    })),
  });

  return records.length;
}

/* ────────────────────────  Orchestrator  ───────────────────────────── */

/**
 * Seeds all content tables for a single locale inside one transaction.
 *
 * @param {import('@prisma/client').PrismaClient} prisma - Prisma client
 * @param {string} locale - Locale code
 * @returns {Promise<void>}
 */
async function seedLocale(prisma, locale) {
  await prisma.$transaction(async (tx) => {
    const monsters = await seedMonsters(tx, locale);
    const heirlooms = await seedHeirlooms(tx, locale);
    const spells = await seedSpells(tx, locale);
    const trinkets = await seedTrinkets(tx, locale);

    log.message(
      `  ✅  ${locale}:  monsters=${monsters}  heirlooms=${heirlooms}  spells=${spells}  trinkets=${trinkets}`,
    );
  });
}

async function main() {
  const { PrismaClient } = await import(
    '../../../src/lib/db/prisma/generated/sql/index.js'
  );
  const prisma = new PrismaClient();

  try {
    const arg = process.argv[2];
    const locales = arg ? [arg] : SUPPORTED_LOCALES;

    log.message(`🌱  Seeding locales: ${locales.join(', ')}`);
    for (const locale of locales) {
      await seedLocale(prisma, locale);
    }
    log.message('🏁  Seed complete.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  log.error('❌  Seed failed:', err.message);
  process.exit(1);
});
