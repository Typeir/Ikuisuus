/**
 * @fileoverview Database Seed Script — FS → Postgres
 * @description Reads every `.metadata.json` sidecar file from the local content
 * tree and upserts it into the corresponding Postgres table.
 *
 * Safe to run multiple times: each locale is fully replaced per run (DELETE then
 * INSERT inside a transaction), so stale rows never accumulate.
 *
 * Tables populated:
 *   monsters, heirlooms, spells + spell_lists, trinkets
 *
 * Usage:
 *   node scripts/db/seed-from-fs.mjs [locale]
 *   node scripts/db/seed-from-fs.mjs en
 *   node scripts/db/seed-from-fs.mjs        # seeds all supported locales
 *
 * Required env:
 *   DATABASE_URL — Neon / Postgres connection string
 */

import { existsSync, readFileSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../');

// ---------------------------------------------------------------------------
// Env — load .env.local if present
// ---------------------------------------------------------------------------
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
  /* absent — rely on system env */
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌  DATABASE_URL is not set.');
  process.exit(1);
}

const pool = new Pool({ connectionString, max: 3 });

const SUPPORTED_LOCALES = ['en', 'es', 'fi'];

// ---------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Seeders — one per content type
// ---------------------------------------------------------------------------

/**
 * Seeds the `monsters` table for one locale.
 *
 * @param {object} client - Connected pg client (inside a transaction)
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
        locale, slug, sub_slug, title, file, link,
        size, creature_type, alignment, cr, proficiency_bonus,
        ac_value, ac_notes, ac_raw,
        hp_average, hp_formula, hp_raw,
        speed_raw, speed_walk, speed_fly, speed_climb, speed_swim, speed_burrow, speed_land, speed_hover,
        str_score, str_mod, dex_score, dex_mod, con_score, con_mod,
        int_score, int_mod, wis_score, wis_mod, cha_score, cha_mod,
        save_str, save_dex, save_con, save_int, save_wis, save_cha,
        senses_raw, passive_perception, darkvision, blindsight, tremorsense, truesight,
        skills, damage_resistances, damage_immunities, damage_vulnerabilities,
        condition_immunities, languages, tags, index_version
      ) VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,$10,$11,
        $12,$13,$14,
        $15,$16,$17,
        $18,$19,$20,$21,$22,$23,$24,$25,
        $26,$27,$28,$29,$30,$31,
        $32,$33,$34,$35,$36,$37,
        $38,$39,$40,$41,$42,$43,
        $44,$45,$46,$47,$48,$49,
        $50,$51,$52,$53,$54,$55,$56,$57
      )`,
      [
        locale,
        m.slug ?? null,
        m.subSlug ?? null,
        m.title ?? '',
        m.file ?? '',
        m.link ?? '',
        // descriptor
        m.size ?? null,
        m.creatureType ?? null,
        m.alignment ?? null,
        m.cr ?? null,
        m.proficiencyBonus ?? null,
        // AC
        ac.value ?? null,
        ac.notes ?? null,
        ac.raw ?? null,
        // HP
        hp.average ?? null,
        hp.formula ?? null,
        hp.raw ?? null,
        // Speed
        sp.raw ?? null,
        modes.walk ?? null,
        modes.fly ?? null,
        modes.climb ?? null,
        modes.swim ?? null,
        modes.burrow ?? null,
        modes.land ?? null,
        modes.hover ?? null,
        // Ability Scores
        ab.str?.score ?? null,
        ab.str?.mod ?? null,
        ab.dex?.score ?? null,
        ab.dex?.mod ?? null,
        ab.con?.score ?? null,
        ab.con?.mod ?? null,
        ab.int?.score ?? null,
        ab.int?.mod ?? null,
        ab.wis?.score ?? null,
        ab.wis?.mod ?? null,
        ab.cha?.score ?? null,
        ab.cha?.mod ?? null,
        // Saving Throws
        st.str ?? null,
        st.dex ?? null,
        st.con ?? null,
        st.int ?? null,
        st.wis ?? null,
        st.cha ?? null,
        // Senses
        senses.raw ?? null,
        senses.passivePerception ?? null,
        senses.darkvision ?? null,
        senses.blindsight ?? null,
        senses.tremorsense ?? null,
        senses.truesight ?? null,
        // Arrays
        m.skills ?? null,
        m.damageResistances ?? null,
        m.damageImmunities ?? null,
        m.damageVulnerabilities ?? null,
        m.conditionImmunities ?? null,
        m.languages ?? null,
        m.tags ?? null,
        m.indexVersion ?? null,
      ],
    );
  }

  return records.length;
}

/**
 * Seeds the `heirlooms` table for one locale.
 *
 * @param {object} client - Connected pg client (inside a transaction)
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
        locale, slug, title, file, link,
        rarity, item_type, weapon_type,
        requires_attunement, attunement_requirements,
        weapon_damage, weapon_damage_type, versatile_damage,
        hit_modifier, range, weight,
        charges_initial, charges_recharge, charges_depletes,
        mastery, weapon_properties, damage_types_dealt, saving_throw_types,
        tags, index_version
      ) VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,
        $9,$10,
        $11,$12,$13,
        $14,$15,$16,
        $17,$18,$19,
        $20,$21,$22,$23,
        $24,$25
      )`,
      [
        locale,
        h.slug ?? null,
        h.title ?? '',
        h.file ?? '',
        h.link ?? '',
        h.rarity ?? null,
        h.itemType ?? null,
        h.weaponType ?? null,
        h.requiresAttunement ?? null,
        h.attunementRequirements ?? null,
        wd.damage ?? null,
        wd.damageType ?? null,
        wd.versatileDamage ?? null,
        h.hitModifier ?? null,
        h.range ?? null,
        h.weight ?? null,
        ch.initial ?? null,
        ch.recharge ?? null,
        ch.depletes ?? null,
        h.mastery ?? null,
        h.weaponProperties ?? null,
        h.damageTypesDealt ?? null,
        h.savingThrowTypes ?? null,
        h.tags ?? null,
        h.indexVersion ?? null,
      ],
    );
  }

  return records.length;
}

/**
 * Seeds the `spells` and `spell_lists` tables for one locale.
 * spell_lists rows are cascade-deleted when the parent spell row is deleted.
 *
 * @param {object} client - Connected pg client (inside a transaction)
 * @param {string} locale - Locale code
 * @returns {Promise<number>} Number of spell rows inserted
 */
async function seedSpells(client, locale) {
  const records = readMetadata(locale, 'spells');
  if (records.length === 0) return 0;

  await client.query('DELETE FROM spells WHERE locale = $1', [locale]);

  for (const s of records) {
    const { rows } = await client.query(
      `INSERT INTO spells (
        locale, slug, title, file, link,
        level, school, quality,
        casting_time_raw, casting_time, range,
        concentration, duration,
        verbal, somatic, material, material_description, has_ritual,
        tags
      ) VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,
        $9,$10,$11,
        $12,$13,
        $14,$15,$16,$17,$18,
        $19
      ) RETURNING id`,
      [
        locale,
        s.slug ?? null,
        s.title ?? '',
        s.file ?? '',
        s.link ?? '',
        s.level ?? null,
        s.school ?? null,
        s.quality ?? null,
        s.castingTimeRaw ?? null,
        s.castingTime ?? null,
        s.range ?? null,
        s.concentration ?? null,
        s.duration ?? null,
        s.verbal ?? null,
        s.somatic ?? null,
        s.material ?? null,
        s.materialDescription ?? null,
        s.hasRitual ?? null,
        s.tags ?? null,
      ],
    );

    const spellId = rows[0].id;
    for (const ref of s.spellLists ?? []) {
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
 * @param {object} client - Connected pg client (inside a transaction)
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
        locale, slug, title, file, link,
        item_type, damage, damage_type, range, weight,
        saving_throw_dc, saving_throw_ability,
        properties, special_effects, inflicts_conditions, tags
      ) VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,$9,$10,
        $11,$12,
        $13,$14,$15,$16
      )`,
      [
        locale,
        t.slug ?? null,
        t.title ?? '',
        t.file ?? '',
        t.link ?? '',
        t.itemType ?? '',
        t.damage ?? null,
        t.damageType ?? null,
        t.range ?? null,
        t.weight ?? null,
        t.savingThrowDC ?? null,
        t.savingThrowAbility ?? null,
        t.properties ?? null,
        t.specialEffects ?? null,
        t.inflictsConditions ?? null,
        t.tags ?? null,
      ],
    );
  }

  return records.length;
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

async function seedLocale(locale) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const monsters = await seedMonsters(client, locale);
    const heirlooms = await seedHeirlooms(client, locale);
    const spells = await seedSpells(client, locale);
    const trinkets = await seedTrinkets(client, locale);

    await client.query('COMMIT');

    console.log(
      `  ✅  ${locale}:  monsters=${monsters}  heirlooms=${heirlooms}  spells=${spells}  trinkets=${trinkets}`,
    );
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(`  ❌  ${locale}: rolled back —`, err.message);
    throw err;
  } finally {
    client.release();
  }
}

async function main() {
  const arg = process.argv[2];
  const locales = arg ? [arg] : SUPPORTED_LOCALES;

  console.log(`🌱  Seeding locales: ${locales.join(', ')}`);
  for (const locale of locales) {
    await seedLocale(locale);
  }
  console.log('🏁  Seed complete.');
  await pool.end();
}

main().catch((err) => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
