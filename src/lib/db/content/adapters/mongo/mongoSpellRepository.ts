/**
 * @fileoverview MongoDB Spell Repository (Prisma)
 * @description Implements `SpellRepository` via Prisma ORM against the
 * `spells` MongoDB collection. Spell lists are embedded as a composite type
 * (`SpellListEmbed[]`) rather than a separate relation, so no `include` is needed.
 *
 * @module lib/db/content/adapters/mongo/mongoSpellRepository
 * @version 1.0.0
 * @author Typeir
 * @since 4.0.0
 */

import { mongoPrisma } from '@/lib/db/prisma/mongoClient';
import type { Spell } from '@/lib/db/prisma/generated/mongo';
import { logger } from '@/lib/logging/logger';
import type { SpellRepository } from '../../repositories/spellRepository';
import type {
  SpellIndexEntry,
  SpellListRef,
  SpellMetadata,
} from '../../schemas/spellMetadata';
import { nonEmpty, orUndef } from '../pg/rowParsers';

const log = logger.child({ module: 'MongoSpellRepo' });

/* ─────────────────────  Sub-object builders  ─────────────────────────── */

/**
 * Maps embedded `SpellListEmbed` documents to domain `SpellListRef` objects.
 * Returns `undefined` when the spell has no associated class lists.
 *
 * @param {Spell['spellLists']} lists - Embedded spell list documents
 * @returns {SpellListRef[] | undefined} Spell list refs or undefined
 */
const buildSpellLists = (lists: Spell['spellLists']): SpellListRef[] | undefined => {
  if (lists.length === 0) return undefined;
  return lists.map((sl): SpellListRef => ({ name: sl.name, link: sl.link }));
};

/* ─────────────────────────────  Doc mapper  ──────────────────────────── */

/**
 * Maps a Prisma MongoDB `Spell` document to a `SpellMetadata` domain object.
 * Spell lists are embedded, so no join/include required.
 *
 * @param {Spell} doc - Prisma spell document
 * @returns {SpellMetadata} Domain model
 */
const docToSpell = (doc: Spell): SpellMetadata => ({
  slug: doc.slug,
  title: doc.title,
  file: doc.file,
  link: doc.link,
  level: orUndef(doc.level),
  school: orUndef(doc.school),
  quality: orUndef(doc.quality),
  castingTimeRaw: orUndef(doc.castingTimeRaw),
  castingTime: nonEmpty(doc.castingTime),
  range: orUndef(doc.range),
  concentration: orUndef(doc.concentration),
  duration: orUndef(doc.duration),
  verbal: orUndef(doc.verbal),
  somatic: orUndef(doc.somatic),
  material: orUndef(doc.material),
  materialDescription: orUndef(doc.materialDescription),
  hasRitual: orUndef(doc.hasRitual),
  tags: nonEmpty(doc.tags),
  spellLists: buildSpellLists(doc.spellLists),
});

/* ──────────────────────────────  Repository  ─────────────────────────── */

/**
 * Prisma-backed spell repository for MongoDB.
 *
 * Queries the `spells` collection via the shared MongoDB Prisma client.
 */
export const mongoSpellRepository: SpellRepository = {
  list: async (locale: string): Promise<SpellMetadata[]> => {
    try {
      const docs = await mongoPrisma.spell.findMany({
        where: { locale },
        orderBy: { title: 'asc' },
      });
      return docs.map(docToSpell);
    } catch (error) {
      log.error('Error reading spell metadata from MongoDB', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  },

  listIndex: async (locale: string): Promise<SpellIndexEntry[]> => {
    try {
      const docs = await mongoPrisma.spell.findMany({
        where: { locale },
        orderBy: { title: 'asc' },
        select: { slug: true, title: true, level: true, school: true },
      });
      return docs.map((d) => ({
        slug: d.slug,
        title: d.title,
        level: d.level ?? undefined,
        school: d.school ?? undefined,
      }));
    } catch (error) {
      log.error('Error reading spell index from MongoDB', {
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
      return mongoSpellRepository.list(locale);
    }
    try {
      const docs = await mongoPrisma.spell.findMany({
        where: { locale, slug: { in: slugs } },
        orderBy: { slug: 'asc' },
      });
      return docs.map(docToSpell);
    } catch (error) {
      log.error('Error reading spells by slugs from MongoDB', {
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
      const doc = await mongoPrisma.spell.findUnique({
        where: { locale_slug: { locale, slug } },
      });
      return doc ? docToSpell(doc) : null;
    } catch (error) {
      log.error('Error reading single spell from MongoDB', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slug,
      });
      return null;
    }
  },
};
