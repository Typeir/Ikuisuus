/**
 * @fileoverview PostgreSQL Spell Repository (Prisma)
 * @description Implements `SpellRepository` via Prisma ORM against the
 * normalised `spells` + `spell_lists` tables. Prisma's `include` replaces
 * the previous LEFT JOIN + json_agg single-trip query.
 *
 * @module lib/db/content/adapters/pg/pgSpellRepository
 * @version 3.0.0
 * @author Typeir
 * @since 4.0.0
 */

import { prisma } from '@/lib/db/prisma/client';
import type { Spell, SpellList } from '@/lib/db/prisma/generated/sql';
import { logger } from '@/lib/logging/logger';
import type { SpellRepository } from '../../repositories/spellRepository';
import type {
    SpellIndexEntry,
    SpellListRef,
    SpellMetadata,
} from '../../schemas/spellMetadata';
import { nonEmpty, orUndef } from './rowParsers';

const log = logger.child({ module: 'PGSpellRepo' });

/* ─────────────────────  Sub-object builders  ─────────────────────────── */

/** Prisma spell row with spell_lists included. */
type SpellWithLists = Spell & { spellLists: SpellList[] };

/**
 * Maps Prisma `SpellList` relations to domain `SpellListRef` objects.
 * Returns `undefined` when the spell has no associated class lists.
 *
 * @param {SpellList[]} lists - Related spell_lists rows
 * @returns {SpellListRef[] | undefined} Spell list refs or undefined
 */
const buildSpellLists = (lists: SpellList[]): SpellListRef[] | undefined => {
  if (lists.length === 0) return undefined;
  return lists.map((sl): SpellListRef => ({ name: sl.name, link: sl.link }));
};

/* ─────────────────────────────  Row mapper  ──────────────────────────── */

/**
 * Maps a Prisma `Spell` row (with included `spellLists`) to `SpellMetadata`.
 * Delegates nested sub-objects to dedicated builder functions.
 *
 * @param {SpellWithLists} row - Prisma spell row with relations
 * @returns {SpellMetadata} Domain model
 */
const rowToSpell = (row: SpellWithLists): SpellMetadata => ({
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
  verbal: orUndef(row.verbal),
  somatic: orUndef(row.somatic),
  material: orUndef(row.material),
  materialDescription: orUndef(row.materialDescription),
  hasRitual: orUndef(row.hasRitual),
  tags: nonEmpty(row.tags),
  spellLists: buildSpellLists(row.spellLists),
});

/** Prisma include clause — always fetch related spell_lists. */
const WITH_LISTS = { spellLists: true } as const;

/* ──────────────────────────────  Repository  ─────────────────────────── */

/**
 * Prisma-backed spell repository.
 *
 * Queries the `spells` / `spell_lists` tables via the shared Prisma client.
 */
export const pgSpellRepository: SpellRepository = {
  list: async (locale: string): Promise<SpellMetadata[]> => {
    try {
      const rows = await prisma.spell.findMany({
        where: { locale },
        orderBy: { title: 'asc' },
        include: WITH_LISTS,
      });
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
      const rows = await prisma.spell.findMany({
        where: { locale },
        orderBy: { title: 'asc' },
        select: { slug: true, title: true, level: true, school: true },
      });
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
      const rows = await prisma.spell.findMany({
        where: { locale, slug: { in: slugs } },
        orderBy: { slug: 'asc' },
        include: WITH_LISTS,
      });
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

  getBySlug: async (
    locale: string,
    slug: string,
  ): Promise<SpellMetadata | null> => {
    try {
      const row = await prisma.spell.findUnique({
        where: { locale_slug: { locale, slug } },
        include: WITH_LISTS,
      });
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
