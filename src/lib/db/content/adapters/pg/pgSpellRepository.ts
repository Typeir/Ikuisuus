/**
 * @fileoverview PostgreSQL Spell Repository
 * @description Implements `SpellRepository` against the normalised `spells` +
 * `spell_lists` tables. `spellLists` (SpellListRef[]) is reconstructed via a
 * LEFT JOIN + json_agg so each query is a single round-trip.
 *
 * @module lib/db/content/adapters/pg/pgSpellRepository
 * @version 2.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { query } from '@/lib/db/postgres/pool';
import { logger } from '@/lib/logging/logger';
import type { SpellRepository } from '../../repositories/spellRepository';
import type {
    SpellIndexEntry,
    SpellListRef,
    SpellMetadata,
} from '../../schemas/spellMetadata';
import { asBoolean, asNumber, asString, asStringArray } from './rowParsers';

const log = logger.child({ module: 'PGSpellRepo' });

/* ─────────────────────────────  Row mapper  ──────────────────────────── */

/**
 * Maps a flat `spells` row (with aggregated spell_lists) to `SpellMetadata`.
 *
 * @param {Record<string, unknown>} row - Raw row from the spells+spell_lists query
 * @returns {SpellMetadata} Fully typed spell metadata
 */
const rowToSpell = (row: Record<string, unknown>): SpellMetadata => ({
  slug: String(row.slug),
  title: String(row.title),
  file: String(row.file),
  link: String(row.link),
  level: asNumber(row.level),
  school: asString(row.school),
  quality: asString(row.quality),
  castingTimeRaw: asString(row.casting_time_raw),
  castingTime: asStringArray(row.casting_time),
  range: asString(row.range),
  concentration: asBoolean(row.concentration),
  duration: asString(row.duration),
  verbal: asBoolean(row.verbal),
  somatic: asBoolean(row.somatic),
  material: asBoolean(row.material),
  materialDescription: asString(row.material_description),
  hasRitual: asBoolean(row.has_ritual),
  tags: asStringArray(row.tags),
  spellLists:
    Array.isArray(row.spell_lists) && (row.spell_lists as unknown[]).length > 0
      ? (row.spell_lists as SpellListRef[])
      : undefined,
});

/**
 * Base SELECT that aggregates `spell_lists` rows into a JSON array so the
 * caller gets a complete `SpellMetadata` from a single query.
 */
const BASE_SELECT = /* sql */ `
  SELECT
    s.*,
    COALESCE(
      json_agg(json_build_object('name', sl.name, 'link', sl.link))
        FILTER (WHERE sl.id IS NOT NULL),
      '[]'
    ) AS spell_lists
  FROM spells s
  LEFT JOIN spell_lists sl ON sl.spell_id = s.id
`;

/* ──────────────────────────────  Repository  ─────────────────────────── */

/**
 * PostgreSQL-backed spell repository.
 *
 * Queries the normalised `spells` / `spell_lists` tables.
 */
export const pgSpellRepository: SpellRepository = {
  list: async (locale: string): Promise<SpellMetadata[]> => {
    try {
      const result = await query(
        `${BASE_SELECT}
         WHERE s.locale = $1
         GROUP BY s.id
         ORDER BY s.title ASC`,
        [locale],
      );
      return result.rows.map(rowToSpell);
    } catch (error) {
      log.error('Error reading spell metadata from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  },

  listIndex: async (locale: string): Promise<SpellIndexEntry[]> => {
    try {
      const result = await query(
        `SELECT slug, title, level, school
         FROM spells
         WHERE locale = $1
         ORDER BY title ASC`,
        [locale],
      );
      return result.rows as SpellIndexEntry[];
    } catch (error) {
      log.error('Error reading spell index from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  },

  listBySlugs: async (
    locale: string,
    slugs: string[],
  ): Promise<SpellMetadata[]> => {
    if (slugs.length === 0) {
      return pgSpellRepository.list(locale);
    }
    try {
      const result = await query(
        `${BASE_SELECT}
         WHERE s.locale = $1 AND s.slug = ANY($2)
         GROUP BY s.id
         ORDER BY s.slug ASC`,
        [locale, slugs],
      );
      return result.rows.map(rowToSpell);
    } catch (error) {
      log.error('Error reading spells by slugs from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slugCount: slugs.length,
      });
      return [];
    }
  },

  getBySlug: async (
    locale: string,
    slug: string,
  ): Promise<SpellMetadata | null> => {
    try {
      const result = await query(
        `${BASE_SELECT}
         WHERE s.locale = $1 AND s.slug = $2
         GROUP BY s.id
         LIMIT 1`,
        [locale, slug],
      );
      return result.rows.length > 0 ? rowToSpell(result.rows[0]) : null;
    } catch (error) {
      log.error('Error reading single spell from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slug,
      });
      return null;
    }
  },
};
