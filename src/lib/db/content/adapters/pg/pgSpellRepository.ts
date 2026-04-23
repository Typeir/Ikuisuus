/**
 * @fileoverview PostgreSQL Spell Repository (MikroORM)
 * @description Implements `SpellRepository` via MikroORM against the
 * `spells` and `spell_lists` tables. Uses `populate` to eagerly load
 * the SpellList one-to-many relation.
 *
 * @module lib/db/content/adapters/pg/pgSpellRepository
 * @version 4.0.0
 * @author Typeir
 * @since 5.0.0
 */

import {
    SpellEntity,
    SpellListEntity,
} from '@/lib/db/orm/entities/SpellEntity';
import { nonEmpty, orUndef } from '@/lib/db/orm/helpers';
import { getEM } from '@/lib/db/orm/orm';
import { logger } from '@/lib/logging/logger';
import type { SpellRepository } from '../../repositories/spellRepository';
import type {
    SpellIndexEntry,
    SpellListRef,
    SpellMetadata,
} from '../../schemas/spellMetadata';

const log = logger.child({ module: 'PGSpellRepo' });

/* ─────────────────────  Sub-object builders  ─────────────────────────── */

/**
 * Maps loaded SpellList entities to domain `SpellListRef` objects.
 *
 * @param {SpellListEntity[]} lists - Loaded spell list entities
 * @returns {SpellListRef[] | undefined} Spell list refs or undefined
 */
const buildSpellLists = (
  lists: SpellListEntity[],
): SpellListRef[] | undefined => {
  if (!lists || lists.length === 0) return undefined;
  return lists.map((sl): SpellListRef => ({ name: sl.name, link: sl.link }));
};

/* ─────────────────────────────  Row mapper  ──────────────────────────── */

/**
 * Maps a MikroORM `Spell` entity (with loaded spellLists) to `SpellMetadata`.
 *
 * @param {SpellEntity} row - MikroORM spell entity
 * @returns {SpellMetadata} Domain model
 */
const rowToSpell = (row: SpellEntity): SpellMetadata => ({
  slug: row.slug,
  title: row.title,
  file: row.file,
  link: row.link,
  level: orUndef(row.level),
  school: orUndef(row.school),
  quality: orUndef(row.quality),
  castingTimeRaw: orUndef(row.castingTimeRaw),
  castingTime: nonEmpty(row.castingTime),
  range: orUndef(row.range),
  concentration: orUndef(row.concentration),
  duration: orUndef(row.duration),
  verbal: orUndef(row.components.verbal),
  somatic: orUndef(row.components.somatic),
  material: orUndef(row.components.material),
  materialDescription: orUndef(row.components.materialDescription),
  hasRitual: orUndef(row.hasRitual),
  description: orUndef(row.description),
  tags: nonEmpty(row.tags),
  spellLists: buildSpellLists(row.spellLists.getItems()),
});

/* ──────────────────────────────  Repository  ─────────────────────────── */

/**
 * MikroORM-backed spell repository.
 */
export const pgSpellRepository: SpellRepository = {
  list: async (locale: string): Promise<SpellMetadata[]> => {
    try {
      const em = await getEM();
      const rows = await em.find(
        SpellEntity,
        { locale },
        { orderBy: { title: 'asc' }, populate: ['spellLists'] },
      );
      return rows.map(rowToSpell);
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
      const em = await getEM();
      const rows = await em.find(
        SpellEntity,
        { locale },
        {
          fields: ['slug', 'title', 'level', 'school'],
          orderBy: { title: 'asc' },
        },
      );
      return rows.map((r) => ({
        slug: r.slug,
        title: r.title,
        level: r.level ?? undefined,
        school: r.school ?? undefined,
      }));
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
      const em = await getEM();
      const rows = await em.find(
        SpellEntity,
        { locale, slug: { $in: slugs } },
        { orderBy: { slug: 'asc' }, populate: ['spellLists'] },
      );
      return rows.map(rowToSpell);
    } catch (error) {
      log.error('Error reading spells by slugs from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slugCount: slugs.length,
      });
      return [];
    }
  },

  listBySource: async (
    locale: string,
    source: string,
  ): Promise<SpellMetadata[]> => {
    try {
      const em = await getEM();
      const lists = await em.find(
        SpellListEntity,
        { name: source },
        { populate: ['spell', 'spell.spellLists'] },
      );
      return lists
        .map((sl) => sl.spell)
        .filter((s) => s.locale === locale)
        .map(rowToSpell);
    } catch (error) {
      log.error('Error reading spells by source from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        source,
      });
      return [];
    }
  },

  getBySlug: async (
    locale: string,
    slug: string,
  ): Promise<SpellMetadata | null> => {
    try {
      const em = await getEM();
      const row = await em.findOne(
        SpellEntity,
        { locale, slug },
        { populate: ['spellLists'] },
      );
      return row ? rowToSpell(row) : null;
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
