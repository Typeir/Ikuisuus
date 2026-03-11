/**
 * @fileoverview PostgreSQL Seed Script — FS → Postgres (raw SQL)
 * @description Reads every `.metadata.json` sidecar file from the local content
 * tree and upserts it into the corresponding Postgres table via raw pg queries.
 *
 * Safe to run multiple times: each locale is fully replaced per run (DELETE
 * then INSERT inside a transaction), so stale rows never accumulate.
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
import pg from 'pg';
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

/* ─────────────────────  SQL helpers  ──────────────────────────────── */

/**
 * Converts a JS value to a Postgres-compatible parameter.
 * Arrays become `{a,b,c}` text format.
 *
 * @param {unknown} v - Value to convert
 * @returns {unknown} Postgres-safe parameter
 */
const pgVal = (v) => {
  if (v === undefined) return null;
  return v;
};

/* ─────────────────────────  Seeders  ───────────────────────────────── */

/**
 * Seeds the `monsters` table for one locale.
 *
 * @param {pg.PoolClient} client - Transaction-bound pg client
 * @param {string} locale - Locale code
 * @returns {Promise<number>} Number of rows inserted
 */
async function seedMonsters(client, locale) {
  const records = readMetadata(locale, 'monsters');
  if (records.length === 0) return 0;

  await client.query('DELETE FROM monsters WHERE locale = $1', [locale]);

  for (const m of records) {
    const ab = m.abilities ?? {};
    const st = m.savingThrows ?? {};
    const sp = m.speed ?? {};
    const modes = sp.modes ?? {};
    const senses = m.senses ?? {};
    const ac = m.ac ?? {};
    const hp = m.hp ?? {};

    await client.query(
      `INSERT INTO monsters (
        locale, slug, sub_slug, title, file, link, size, creature_type, alignment, cr,
        proficiency_bonus, ac_value, ac_notes, ac_raw, hp_average, hp_formula, hp_raw,
        speed_raw, speed_walk, speed_fly, speed_climb, speed_swim, speed_burrow, speed_hover,
        score_str, score_dex, score_con, score_int, score_wis, score_cha,
        save_str, save_dex, save_con, save_int, save_wis, save_cha,
        sense_raw, sense_passive_perception, sense_darkvision, sense_blindsight, sense_tremorsense, sense_truesight,
        skills, damage_resistances, damage_immunities, damage_vulnerabilities,
        condition_immunities, languages, tags, index_version
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,
        $39,$40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50
      )`,
      [
        locale,
        m.slug ?? '',
        pgVal(m.subSlug),
        m.title ?? '',
        m.file ?? '',
        m.link ?? '',
        pgVal(m.size),
        pgVal(m.creatureType),
        pgVal(m.alignment),
        pgVal(m.cr),
        pgVal(m.proficiencyBonus),
        pgVal(ac.value),
        pgVal(ac.notes),
        pgVal(ac.raw),
        pgVal(hp.average),
        pgVal(hp.formula),
        pgVal(hp.raw),
        pgVal(sp.raw),
        pgVal(modes.walk),
        pgVal(modes.fly),
        pgVal(modes.climb),
        pgVal(modes.swim),
        pgVal(modes.burrow),
        pgVal(modes.hover),
        pgVal(ab.str?.score),
        pgVal(ab.dex?.score),
        pgVal(ab.con?.score),
        pgVal(ab.int?.score),
        pgVal(ab.wis?.score),
        pgVal(ab.cha?.score),
        pgVal(st.str),
        pgVal(st.dex),
        pgVal(st.con),
        pgVal(st.int),
        pgVal(st.wis),
        pgVal(st.cha),
        pgVal(senses.raw),
        pgVal(senses.passivePerception),
        pgVal(senses.darkvision),
        pgVal(senses.blindsight),
        pgVal(senses.tremorsense),
        pgVal(senses.truesight),
        m.skills ?? [],
        m.damageResistances ?? [],
        m.damageImmunities ?? [],
        m.damageVulnerabilities ?? [],
        m.conditionImmunities ?? [],
        m.languages ?? [],
        m.tags ?? [],
        pgVal(m.indexVersion),
      ],
    );
  }

  return records.length;
}

/**
 * Seeds the `heirlooms` table for one locale.
 *
 * @param {pg.PoolClient} client - Transaction-bound pg client
 * @param {string} locale - Locale code
 * @returns {Promise<number>} Number of rows inserted
 */
async function seedHeirlooms(client, locale) {
  const records = readMetadata(locale, join('items', 'heirlooms'));
  if (records.length === 0) return 0;

  await client.query('DELETE FROM heirlooms WHERE locale = $1', [locale]);

  for (const h of records) {
    const wd = h.weaponDamage ?? {};
    const ch = h.charges ?? {};

    await client.query(
      `INSERT INTO heirlooms (
        locale, slug, title, file, link, rarity, item_type, weapon_type,
        requires_attunement, attunement_requirements,
        weapon_damage, weapon_damage_type, versatile_damage,
        hit_modifier, range, weight,
        charges_initial, charges_recharge, charges_depletes,
        mastery, weapon_properties, damage_types_dealt,
        saving_throw_types, tags, index_version
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
        $20,$21,$22,$23,$24,$25
      )`,
      [
        locale,
        h.slug ?? '',
        h.title ?? '',
        h.file ?? '',
        h.link ?? '',
        pgVal(h.rarity),
        pgVal(h.itemType),
        pgVal(h.weaponType),
        pgVal(h.requiresAttunement),
        pgVal(h.attunementRequirements),
        pgVal(wd.damage),
        pgVal(wd.damageType),
        pgVal(wd.versatileDamage),
        pgVal(h.hitModifier),
        pgVal(h.range),
        pgVal(h.weight),
        pgVal(ch.initial),
        pgVal(ch.recharge),
        pgVal(ch.depletes),
        h.mastery ?? [],
        h.weaponProperties ?? [],
        h.damageTypesDealt ?? [],
        h.savingThrowTypes ?? [],
        h.tags ?? [],
        pgVal(h.indexVersion),
      ],
    );
  }

  return records.length;
}

/**
 * Seeds the `spells` and `spell_lists` tables for one locale.
 * Inserts each spell, retrieves its generated ID, then batch-inserts
 * its spell_lists children.
 *
 * @param {pg.PoolClient} client - Transaction-bound pg client
 * @param {string} locale - Locale code
 * @returns {Promise<number>} Number of spell rows inserted
 */
async function seedSpells(client, locale) {
  const records = readMetadata(locale, 'spells');
  if (records.length === 0) return 0;

  await client.query(
    'DELETE FROM spell_lists WHERE spell_id IN (SELECT id FROM spells WHERE locale = $1)',
    [locale],
  );
  await client.query('DELETE FROM spells WHERE locale = $1', [locale]);

  for (const s of records) {
    const { rows } = await client.query(
      `INSERT INTO spells (
        locale, slug, title, file, link, level, school, quality,
        casting_time_raw, casting_time, range, concentration, duration,
        component_verbal, component_somatic, component_material, component_material_description, has_ritual, tags
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
      ) RETURNING id`,
      [
        locale,
        s.slug ?? '',
        s.title ?? '',
        s.file ?? '',
        s.link ?? '',
        pgVal(s.level),
        pgVal(s.school),
        pgVal(s.quality),
        pgVal(s.castingTimeRaw),
        s.castingTime ?? [],
        pgVal(s.range),
        pgVal(s.concentration),
        pgVal(s.duration),
        pgVal(s.verbal),
        pgVal(s.somatic),
        pgVal(s.material),
        pgVal(s.materialDescription),
        pgVal(s.hasRitual),
        s.tags ?? [],
      ],
    );

    const spellId = rows[0].id;
    const lists = s.spellLists ?? [];
    for (const ref of lists) {
      await client.query(
        'INSERT INTO spell_lists (spell_id, name, link) VALUES ($1, $2, $3)',
        [spellId, ref.name, ref.link],
      );
    }
  }

  return records.length;
}

/**
 * Seeds the `trinkets` table for one locale.
 *
 * @param {pg.PoolClient} client - Transaction-bound pg client
 * @param {string} locale - Locale code
 * @returns {Promise<number>} Number of rows inserted
 */
async function seedTrinkets(client, locale) {
  const records = readMetadata(locale, join('items', 'trinkets'));
  if (records.length === 0) return 0;

  await client.query('DELETE FROM trinkets WHERE locale = $1', [locale]);

  for (const t of records) {
    await client.query(
      `INSERT INTO trinkets (
        locale, slug, title, file, link, item_type,
        damage, damage_type, range, weight,
        saving_throw_dc, saving_throw_ability,
        properties, special_effects, inflicts_conditions, tags
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
      )`,
      [
        locale,
        t.slug ?? '',
        t.title ?? '',
        t.file ?? '',
        t.link ?? '',
        t.itemType ?? '',
        pgVal(t.damage),
        pgVal(t.damageType),
        pgVal(t.range),
        pgVal(t.weight),
        pgVal(t.savingThrowDC),
        pgVal(t.savingThrowAbility),
        t.properties ?? [],
        t.specialEffects ?? [],
        t.inflictsConditions ?? [],
        t.tags ?? [],
      ],
    );
  }

  return records.length;
}

/* ────────────────────────  Orchestrator  ───────────────────────────── */

/**
 * Seeds all content tables for a single locale inside one transaction.
 *
 * @param {pg.Pool} pool - pg connection pool
 * @param {string} locale - Locale code
 * @returns {Promise<void>}
 */
async function seedLocale(pool, locale) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const monsters = await seedMonsters(client, locale);
    const heirlooms = await seedHeirlooms(client, locale);
    const spells = await seedSpells(client, locale);
    const trinkets = await seedTrinkets(client, locale);

    await client.query('COMMIT');

    log.message(
      `  ✅  ${locale}:  monsters=${monsters}  heirlooms=${heirlooms}  spells=${spells}  trinkets=${trinkets}`,
    );
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    connectionTimeoutMillis: 10_000,
  });

  try {
    const arg = process.argv[2];
    const locales = arg ? [arg] : SUPPORTED_LOCALES;

    log.message(`🌱  Seeding locales: ${locales.join(', ')}`);
    for (const locale of locales) {
      await seedLocale(pool, locale);
    }
    log.message('🏁  Seed complete.');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  log.error('❌  Seed failed:', err.message);
  process.exit(1);
});
