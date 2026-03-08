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
    if (row[col] != null) {
      throws[key] = Number(row[col]);
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
  subSlug: row.sub_slug != null ? String(row.sub_slug) : undefined,
  title: String(row.title),
  file: String(row.file),
  link: String(row.link),
  size: row.size != null ? String(row.size) : undefined,
  creatureType: row.creature_type != null ? String(row.creature_type) : undefined,
  alignment: row.alignment != null ? String(row.alignment) : undefined,
  cr: row.cr != null ? String(row.cr) : undefined,
  proficiencyBonus: row.proficiency_bonus != null ? Number(row.proficiency_bonus) : undefined,

  ac:
    row.ac_value != null
      ? {
          value: Number(row.ac_value),
          notes: row.ac_notes != null ? String(row.ac_notes) : undefined,
          raw: row.ac_raw != null ? String(row.ac_raw) : undefined,
        }
      : undefined,

  hp:
    row.hp_average != null
      ? {
          average: Number(row.hp_average),
          formula: row.hp_formula != null ? String(row.hp_formula) : undefined,
          raw: row.hp_raw != null ? String(row.hp_raw) : undefined,
        }
      : undefined,

  speed:
    row.speed_raw != null
      ? {
          raw: String(row.speed_raw),
          modes: {
            walk: row.speed_walk != null ? Number(row.speed_walk) : undefined,
            fly: row.speed_fly != null ? Number(row.speed_fly) : undefined,
            climb: row.speed_climb != null ? Number(row.speed_climb) : undefined,
            swim: row.speed_swim != null ? Number(row.speed_swim) : undefined,
            burrow: row.speed_burrow != null ? Number(row.speed_burrow) : undefined,
            land: row.speed_land != null ? Number(row.speed_land) : undefined,
            hover: row.speed_hover === true,
          },
        }
      : undefined,

  abilities:
    row.str_score != null ||
    row.dex_score != null ||
    row.con_score != null ||
    row.int_score != null ||
    row.wis_score != null ||
    row.cha_score != null
      ? {
          str: { score: row.str_score != null ? Number(row.str_score) : undefined, mod: row.str_mod != null ? Number(row.str_mod) : undefined },
          dex: { score: row.dex_score != null ? Number(row.dex_score) : undefined, mod: row.dex_mod != null ? Number(row.dex_mod) : undefined },
          con: { score: row.con_score != null ? Number(row.con_score) : undefined, mod: row.con_mod != null ? Number(row.con_mod) : undefined },
          int: { score: row.int_score != null ? Number(row.int_score) : undefined, mod: row.int_mod != null ? Number(row.int_mod) : undefined },
          wis: { score: row.wis_score != null ? Number(row.wis_score) : undefined, mod: row.wis_mod != null ? Number(row.wis_mod) : undefined },
          cha: { score: row.cha_score != null ? Number(row.cha_score) : undefined, mod: row.cha_mod != null ? Number(row.cha_mod) : undefined },
        }
      : undefined,

  savingThrows: buildSavingThrows(row),

  senses:
    row.senses_raw != null
      ? {
          raw: String(row.senses_raw),
          passivePerception: row.passive_perception != null ? Number(row.passive_perception) : undefined,
          darkvision: row.darkvision != null ? Number(row.darkvision) : undefined,
          blindsight: row.blindsight != null ? Number(row.blindsight) : undefined,
          tremorsense: row.tremorsense != null ? Number(row.tremorsense) : undefined,
          truesight: row.truesight != null ? Number(row.truesight) : undefined,
        }
      : undefined,

  skills: (row.skills as string[] | null) ?? undefined,
  damageResistances: (row.damage_resistances as string[] | null) ?? undefined,
  damageImmunities: (row.damage_immunities as string[] | null) ?? undefined,
  damageVulnerabilities: (row.damage_vulnerabilities as string[] | null) ?? undefined,
  conditionImmunities: (row.condition_immunities as string[] | null) ?? undefined,
  languages: (row.languages as string[] | null) ?? undefined,
  tags: (row.tags as string[] | null) ?? undefined,
  indexVersion: row.index_version != null ? Number(row.index_version) : undefined,
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
