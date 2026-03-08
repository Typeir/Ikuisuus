/**
 * @fileoverview PostgreSQL Monster Repository
 * @description Implements `MonsterRepository` against the normalised `monsters`
 * table. Every stat-block is one row; multi-block source files are distinguished
 * by `sub_slug` (the canonical lookup key) alongside `slug` (the source file).
 *
 * @module lib/db/content/adapters/pg/pgMonsterRepository
 * @version 2.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { query } from '@/lib/db/postgres/pool';
import { logger } from '@/lib/logging/logger';
import type { MonsterRepository } from '../../repositories/monsterRepository';
import type {
  MonsterIndexEntry,
  MonsterMetadata,
} from '../../schemas/monsterMetadata';
import { asBoolean, asNumber, asString, asStringArray } from './rowParsers';

const log = logger.child({ module: 'PGMonsterRepo' });

/* ─────────────────────────────  Row mapper  ──────────────────────────── */

/**
 * Builds a `Record<string, number>` of saving throws from flat DB columns.
 *
 * @param {Record<string, unknown>} row - Raw DB row
 * @returns {Record<string, number> | undefined} Saving throws map, or undefined if none set
 */
const buildSavingThrows = (
  row: Record<string, unknown>,
): Record<string, number> | undefined => {
  const map = [
    ['save_str', 'str'],
    ['save_dex', 'dex'],
    ['save_con', 'con'],
    ['save_int', 'int'],
    ['save_wis', 'wis'],
    ['save_cha', 'cha'],
  ] as const;
  const throws: Record<string, number> = {};
  let hasAny = false;
  for (const [col, key] of map) {
    const n = asNumber(row[col]);
    if (n !== undefined) {
      throws[key] = n;
      hasAny = true;
    }
  }
  return hasAny ? throws : undefined;
};

/**
 * Maps a flat `monsters` row to a typed `MonsterMetadata` object.
 *
 * @param {Record<string, unknown>} row - Raw row from the `monsters` table
 * @returns {MonsterMetadata} Fully typed monster metadata
 */
const rowToMonster = (row: Record<string, unknown>): MonsterMetadata => ({
  slug: String(row.slug),
  subSlug: asString(row.sub_slug),
  title: String(row.title),
  file: String(row.file),
  link: String(row.link),
  size: asString(row.size),
  creatureType: asString(row.creature_type),
  alignment: asString(row.alignment),
  cr: asString(row.cr),
  proficiencyBonus: asNumber(row.proficiency_bonus),

  ac: {
    value: asNumber(row.ac_value) ?? 0,
    notes: asString(row.ac_notes),
    raw: asString(row.ac_raw),
  },

  hp: {
    average: asNumber(row.hp_average) ?? 0,
    formula: asString(row.hp_formula),
    raw: asString(row.hp_raw),
  },

  speed: {
    raw: asString(row.speed_raw) ?? '',
    modes: {
      walk: asNumber(row.speed_walk),
      fly: asNumber(row.speed_fly),
      climb: asNumber(row.speed_climb),
      swim: asNumber(row.speed_swim),
      burrow: asNumber(row.speed_burrow),
      land: asNumber(row.speed_land),
      hover: asBoolean(row.speed_hover),
    },
  },

  abilities: {
    str: { score: asNumber(row.str_score), mod: asNumber(row.str_mod) },
    dex: { score: asNumber(row.dex_score), mod: asNumber(row.dex_mod) },
    con: { score: asNumber(row.con_score), mod: asNumber(row.con_mod) },
    int: { score: asNumber(row.int_score), mod: asNumber(row.int_mod) },
    wis: { score: asNumber(row.wis_score), mod: asNumber(row.wis_mod) },
    cha: { score: asNumber(row.cha_score), mod: asNumber(row.cha_mod) },
  },

  savingThrows: buildSavingThrows(row),

  senses: {
    raw: asString(row.senses_raw) ?? '',
    passivePerception: asNumber(row.passive_perception),
    darkvision: asNumber(row.darkvision),
    blindsight: asNumber(row.blindsight),
    tremorsense: asNumber(row.tremorsense),
    truesight: asNumber(row.truesight),
  },

  skills: asStringArray(row.skills),
  damageResistances: asStringArray(row.damage_resistances),
  damageImmunities: asStringArray(row.damage_immunities),
  damageVulnerabilities: asStringArray(row.damage_vulnerabilities),
  conditionImmunities: asStringArray(row.condition_immunities),
  languages: asStringArray(row.languages),
  tags: asStringArray(row.tags),
  indexVersion: asNumber(row.index_version),
});

/* ──────────────────────────────  Repository  ─────────────────────────── */

/**
 * PostgreSQL-backed monster repository.
 *
 * Queries the normalised `monsters` table — one row per stat block.
 */
export const pgMonsterRepository: MonsterRepository = {
  list: async (locale: string): Promise<MonsterMetadata[]> => {
    try {
      const result = await query(
        'SELECT * FROM monsters WHERE locale = $1 ORDER BY slug ASC',
        [locale],
      );
      return result.rows.map(rowToMonster);
    } catch (error) {
      log.error('Error reading monster metadata from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  },

  listIndex: async (locale: string): Promise<MonsterIndexEntry[]> => {
    try {
      const result = await query(
        `SELECT
           COALESCE(sub_slug, slug) AS slug,
           title,
           cr,
           size,
           creature_type AS "creatureType"
         FROM monsters
         WHERE locale = $1
         ORDER BY slug ASC`,
        [locale],
      );
      return result.rows as MonsterIndexEntry[];
    } catch (error) {
      log.error('Error reading monster index from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  },

  getBySlug: async (
    locale: string,
    slug: string,
  ): Promise<MonsterMetadata | null> => {
    try {
      const result = await query(
        `SELECT * FROM monsters
         WHERE locale = $1
           AND (sub_slug = $2 OR slug = $2)
         LIMIT 1`,
        [locale, slug],
      );
      return result.rows.length > 0 ? rowToMonster(result.rows[0]) : null;
    } catch (error) {
      log.error('Error reading single monster from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slug,
      });
      return null;
    }
  },
};
