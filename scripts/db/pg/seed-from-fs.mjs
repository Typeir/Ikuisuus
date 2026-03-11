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
import { contentHash } from '../../core/contentHash.mjs';
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

/**
 * Loads existing version hashes for a table + locale into a Map.
 *
 * @param {pg.PoolClient} client - Transaction-bound pg client
 * @param {string} table - Table name
 * @param {string} locale - Locale code
 * @param {string} [slugExpr] - SQL expression for the slug key (default: 'slug')
 * @returns {Promise<Map<string, string>>} Map of slug → version_hash
 */
async function loadExistingHashes(client, table, locale, slugExpr = 'slug') {
  const { rows } = await client.query(
    `SELECT ${slugExpr} AS slug_key, version_hash FROM ${table} WHERE locale = $1`,
    [locale],
  );
  return new Map(rows.map((r) => [r.slug_key, r.version_hash]));
}

/* ─────────────────────────  Seeders  ───────────────────────────────── */

/**
 * Seeds the `monsters` table for one locale using hash-based change detection.
 * Only inserts/updates rows whose content has changed, and removes rows
 * that no longer appear in the metadata files.
 *
 * @param {pg.PoolClient} client - Transaction-bound pg client
 * @param {string} locale - Locale code
 * @returns {Promise<{inserted: number, updated: number, skipped: number, deleted: number}>} Change stats
 */
async function seedMonsters(client, locale) {
  const records = readMetadata(locale, 'monsters');
  if (records.length === 0) return { inserted: 0, updated: 0, skipped: 0, deleted: 0 };

  const existing = await loadExistingHashes(
    client,
    'monsters',
    locale,
    "COALESCE(sub_slug, slug)",
  );

  const incomingSlugs = new Set();
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const m of records) {
    const hash = contentHash(m);
    const displaySlug = m.subSlug ?? m.slug ?? '';
    incomingSlugs.add(displaySlug);

    const existingHash = existing.get(displaySlug);
    if (existingHash === hash) {
      skipped++;
      continue;
    }

    const ab = m.abilities ?? {};
    const st = m.savingThrows ?? {};
    const sp = m.speed ?? {};
    const modes = sp.modes ?? {};
    const senses = m.senses ?? {};
    const ac = m.ac ?? {};
    const hp = m.hp ?? {};

    const params = [
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
      hash,
    ];

    if (existingHash !== undefined) {
      await client.query(
        `UPDATE monsters SET
          slug=$2, sub_slug=$3, title=$4, file=$5, link=$6, size=$7, creature_type=$8,
          alignment=$9, cr=$10, proficiency_bonus=$11, ac_value=$12, ac_notes=$13, ac_raw=$14,
          hp_average=$15, hp_formula=$16, hp_raw=$17, speed_raw=$18, speed_walk=$19,
          speed_fly=$20, speed_climb=$21, speed_swim=$22, speed_burrow=$23, speed_hover=$24,
          score_str=$25, score_dex=$26, score_con=$27, score_int=$28, score_wis=$29, score_cha=$30,
          save_str=$31, save_dex=$32, save_con=$33, save_int=$34, save_wis=$35, save_cha=$36,
          sense_raw=$37, sense_passive_perception=$38, sense_darkvision=$39, sense_blindsight=$40,
          sense_tremorsense=$41, sense_truesight=$42, skills=$43, damage_resistances=$44,
          damage_immunities=$45, damage_vulnerabilities=$46, condition_immunities=$47,
          languages=$48, tags=$49, index_version=$50, version_hash=$51
        WHERE locale=$1 AND COALESCE(sub_slug, slug) = $52`,
        [...params, displaySlug],
      );
      updated++;
    } else {
      await client.query(
        `INSERT INTO monsters (
          locale, slug, sub_slug, title, file, link, size, creature_type, alignment, cr,
          proficiency_bonus, ac_value, ac_notes, ac_raw, hp_average, hp_formula, hp_raw,
          speed_raw, speed_walk, speed_fly, speed_climb, speed_swim, speed_burrow, speed_hover,
          score_str, score_dex, score_con, score_int, score_wis, score_cha,
          save_str, save_dex, save_con, save_int, save_wis, save_cha,
          sense_raw, sense_passive_perception, sense_darkvision, sense_blindsight, sense_tremorsense, sense_truesight,
          skills, damage_resistances, damage_immunities, damage_vulnerabilities,
          condition_immunities, languages, tags, index_version, version_hash
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
          $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,
          $39,$40,$41,$42,$43,$44,$45,$46,$47,$48,$49,$50,$51
        )`,
        params,
      );
      inserted++;
    }
  }

  const stale = [...existing.keys()].filter((s) => !incomingSlugs.has(s));
  if (stale.length > 0) {
    await client.query(
      `DELETE FROM monsters WHERE locale = $1 AND COALESCE(sub_slug, slug) = ANY($2)`,
      [locale, stale],
    );
  }

  return { inserted, updated, skipped, deleted: stale.length };
}

/**
 * Seeds the `heirlooms` table for one locale using hash-based change detection.
 *
 * @param {pg.PoolClient} client - Transaction-bound pg client
 * @param {string} locale - Locale code
 * @returns {Promise<{inserted: number, updated: number, skipped: number, deleted: number}>} Change stats
 */
async function seedHeirlooms(client, locale) {
  const records = readMetadata(locale, join('items', 'heirlooms'));
  if (records.length === 0) return { inserted: 0, updated: 0, skipped: 0, deleted: 0 };

  const existing = await loadExistingHashes(client, 'heirlooms', locale);
  const incomingSlugs = new Set();
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const h of records) {
    const hash = contentHash(h);
    const slug = h.slug ?? '';
    incomingSlugs.add(slug);

    const existingHash = existing.get(slug);
    if (existingHash === hash) {
      skipped++;
      continue;
    }

    const wd = h.weaponDamage ?? {};
    const ch = h.charges ?? {};

    const params = [
      locale,
      slug,
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
      hash,
    ];

    if (existingHash !== undefined) {
      await client.query(
        `UPDATE heirlooms SET
          title=$3, file=$4, link=$5, rarity=$6, item_type=$7, weapon_type=$8,
          requires_attunement=$9, attunement_requirements=$10,
          weapon_damage=$11, weapon_damage_type=$12, versatile_damage=$13,
          hit_modifier=$14, range=$15, weight=$16,
          charges_initial=$17, charges_recharge=$18, charges_depletes=$19,
          mastery=$20, weapon_properties=$21, damage_types_dealt=$22,
          saving_throw_types=$23, tags=$24, index_version=$25, version_hash=$26
        WHERE locale=$1 AND slug=$2`,
        params,
      );
      updated++;
    } else {
      await client.query(
        `INSERT INTO heirlooms (
          locale, slug, title, file, link, rarity, item_type, weapon_type,
          requires_attunement, attunement_requirements,
          weapon_damage, weapon_damage_type, versatile_damage,
          hit_modifier, range, weight,
          charges_initial, charges_recharge, charges_depletes,
          mastery, weapon_properties, damage_types_dealt,
          saving_throw_types, tags, index_version, version_hash
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
          $20,$21,$22,$23,$24,$25,$26
        )`,
        params,
      );
      inserted++;
    }
  }

  const stale = [...existing.keys()].filter((s) => !incomingSlugs.has(s));
  if (stale.length > 0) {
    await client.query(
      `DELETE FROM heirlooms WHERE locale = $1 AND slug = ANY($2)`,
      [locale, stale],
    );
  }

  return { inserted, updated, skipped, deleted: stale.length };
}

/**
 * Seeds the `spells` and `spell_lists` tables for one locale using
 * hash-based change detection. When a spell's hash changes, its child
 * spell_lists are replaced as well.
 *
 * @param {pg.PoolClient} client - Transaction-bound pg client
 * @param {string} locale - Locale code
 * @returns {Promise<{inserted: number, updated: number, skipped: number, deleted: number}>} Change stats
 */
async function seedSpells(client, locale) {
  const records = readMetadata(locale, 'spells');
  if (records.length === 0) return { inserted: 0, updated: 0, skipped: 0, deleted: 0 };

  const existing = await loadExistingHashes(client, 'spells', locale);

  /** Map slug → spell id for existing rows (needed for spell_lists FK) */
  const { rows: idRows } = await client.query(
    'SELECT slug, id FROM spells WHERE locale = $1',
    [locale],
  );
  const existingIds = new Map(idRows.map((r) => [r.slug, r.id]));

  const incomingSlugs = new Set();
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const s of records) {
    const hash = contentHash(s);
    const slug = s.slug ?? '';
    incomingSlugs.add(slug);

    const existingHash = existing.get(slug);
    if (existingHash === hash) {
      skipped++;
      continue;
    }

    const params = [
      locale,
      slug,
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
      hash,
    ];

    let spellId;

    if (existingHash !== undefined) {
      spellId = existingIds.get(slug);
      await client.query(
        `UPDATE spells SET
          title=$3, file=$4, link=$5, level=$6, school=$7, quality=$8,
          casting_time_raw=$9, casting_time=$10, range=$11, concentration=$12,
          duration=$13, component_verbal=$14, component_somatic=$15,
          component_material=$16, component_material_description=$17,
          has_ritual=$18, tags=$19, version_hash=$20
        WHERE locale=$1 AND slug=$2`,
        params,
      );
      await client.query('DELETE FROM spell_lists WHERE spell_id = $1', [spellId]);
      updated++;
    } else {
      const { rows } = await client.query(
        `INSERT INTO spells (
          locale, slug, title, file, link, level, school, quality,
          casting_time_raw, casting_time, range, concentration, duration,
          component_verbal, component_somatic, component_material,
          component_material_description, has_ritual, tags, version_hash
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20
        ) RETURNING id`,
        params,
      );
      spellId = rows[0].id;
      inserted++;
    }

    const lists = s.spellLists ?? [];
    for (const ref of lists) {
      await client.query(
        'INSERT INTO spell_lists (spell_id, name, link) VALUES ($1, $2, $3)',
        [spellId, ref.name, ref.link],
      );
    }
  }

  const stale = [...existing.keys()].filter((s) => !incomingSlugs.has(s));
  if (stale.length > 0) {
    await client.query(
      `DELETE FROM spells WHERE locale = $1 AND slug = ANY($2)`,
      [locale, stale],
    );
  }

  return { inserted, updated, skipped, deleted: stale.length };
}

/**
 * Seeds the `trinkets` table for one locale using hash-based change detection.
 *
 * @param {pg.PoolClient} client - Transaction-bound pg client
 * @param {string} locale - Locale code
 * @returns {Promise<{inserted: number, updated: number, skipped: number, deleted: number}>} Change stats
 */
async function seedTrinkets(client, locale) {
  const records = readMetadata(locale, join('items', 'trinkets'));
  if (records.length === 0) return { inserted: 0, updated: 0, skipped: 0, deleted: 0 };

  const existing = await loadExistingHashes(client, 'trinkets', locale);
  const incomingSlugs = new Set();
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const t of records) {
    const hash = contentHash(t);
    const slug = t.slug ?? '';
    incomingSlugs.add(slug);

    const existingHash = existing.get(slug);
    if (existingHash === hash) {
      skipped++;
      continue;
    }

    const params = [
      locale,
      slug,
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
      hash,
    ];

    if (existingHash !== undefined) {
      await client.query(
        `UPDATE trinkets SET
          title=$3, file=$4, link=$5, item_type=$6,
          damage=$7, damage_type=$8, range=$9, weight=$10,
          saving_throw_dc=$11, saving_throw_ability=$12,
          properties=$13, special_effects=$14, inflicts_conditions=$15, tags=$16,
          version_hash=$17
        WHERE locale=$1 AND slug=$2`,
        params,
      );
      updated++;
    } else {
      await client.query(
        `INSERT INTO trinkets (
          locale, slug, title, file, link, item_type,
          damage, damage_type, range, weight,
          saving_throw_dc, saving_throw_ability,
          properties, special_effects, inflicts_conditions, tags, version_hash
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
        )`,
        params,
      );
      inserted++;
    }
  }

  const stale = [...existing.keys()].filter((s) => !incomingSlugs.has(s));
  if (stale.length > 0) {
    await client.query(
      `DELETE FROM trinkets WHERE locale = $1 AND slug = ANY($2)`,
      [locale, stale],
    );
  }

  return { inserted, updated, skipped, deleted: stale.length };
}

/* ────────────────────────  Orchestrator  ───────────────────────────── */

/**
 * Seeds all content tables for a single locale inside one transaction.
 * Uses hash-based change detection to avoid unnecessary writes.
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

    const fmt = (label, s) => {
      const parts = [];
      if (s.inserted) parts.push(`+${s.inserted}`);
      if (s.updated) parts.push(`~${s.updated}`);
      if (s.deleted) parts.push(`-${s.deleted}`);
      if (s.skipped) parts.push(`=${s.skipped}`);
      return `${label}(${parts.join(' ') || '0'})`;
    };

    log.message(
      `  ✅  ${locale}:  ${fmt('monsters', monsters)}  ${fmt('heirlooms', heirlooms)}  ${fmt('spells', spells)}  ${fmt('trinkets', trinkets)}`,
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
