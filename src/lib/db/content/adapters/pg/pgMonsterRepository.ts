/**
 * @fileoverview PostgreSQL Monster Repository (Prisma)
 * @description Implements `MonsterRepository` via Prisma ORM against the
 * normalised `monsters` table. Replaces raw `pg` SQL with type-safe Prisma
 * queries. Every stat-block is one row; multi-block source files are
 * distinguished by `subSlug` (the canonical lookup key).
 *
 * Ability modifiers are NOT stored in the DB — consumers compute them:
 *   `mod = Math.floor((score - 10) / 2)`
 *
 * @module lib/db/content/adapters/pg/pgMonsterRepository
 * @version 3.0.0
 * @author Typeir
 * @since 4.0.0
 */

import { prisma } from '@/lib/db/prisma/client';
import type { Monster } from '@/lib/db/prisma/generated/sql';
import { logger } from '@/lib/logging/logger';
import type { MonsterRepository } from '../../repositories/monsterRepository';
import type {
  AbilityScores,
  MonsterAC,
  MonsterHP,
  MonsterIndexEntry,
  MonsterMetadata,
  MonsterSenses,
  MonsterSpeed,
} from '../../schemas/monsterMetadata';
import { nonEmpty, orUndef } from './rowParsers';

const log = logger.child({ module: 'PGMonsterRepo' });

/* ─────────────────────  Sub-object builders  ─────────────────────────── */

/**
 * Builds an `MonsterAC` value object from flat row columns.
 *
 * @param {Monster} row - Prisma monster row
 * @returns {MonsterAC} Armor class value object
 */
const buildAC = (row: Monster): MonsterAC => ({
  value: row.acValue ?? 0,
  notes: orUndef(row.acNotes),
  raw: orUndef(row.acRaw),
});

/**
 * Builds a `MonsterHP` value object from flat row columns.
 *
 * @param {Monster} row - Prisma monster row
 * @returns {MonsterHP} Hit points value object
 */
const buildHP = (row: Monster): MonsterHP => ({
  average: row.hpAverage ?? 0,
  formula: orUndef(row.hpFormula),
  raw: orUndef(row.hpRaw),
});

/**
 * Builds a `MonsterSpeed` value object from flat row columns.
 *
 * @param {Monster} row - Prisma monster row
 * @returns {MonsterSpeed} Speed value object with parsed modes
 */
const buildSpeed = (row: Monster): MonsterSpeed => ({
  raw: row.speedRaw ?? '',
  modes: {
    walk: orUndef(row.speedWalk),
    fly: orUndef(row.speedFly),
    climb: orUndef(row.speedClimb),
    swim: orUndef(row.speedSwim),
    burrow: orUndef(row.speedBurrow),
    hover: orUndef(row.speedHover),
  },
});

/**
 * Builds `AbilityScores` from the six flat score columns.
 * Modifiers are NOT stored — consumers derive them:
 *   `mod = Math.floor((score - 10) / 2)`
 *
 * @param {Monster} row - Prisma monster row
 * @returns {AbilityScores} Six ability scores
 */
const buildAbilities = (row: Monster): AbilityScores => ({
  str: { score: orUndef(row.strScore) },
  dex: { score: orUndef(row.dexScore) },
  con: { score: orUndef(row.conScore) },
  int: { score: orUndef(row.intScore) },
  wis: { score: orUndef(row.wisScore) },
  cha: { score: orUndef(row.chaScore) },
});

/**
 * Builds a saving throws map from the six flat save columns.
 * Only entries with non-null values are included.
 *
 * @param {Monster} row - Prisma monster row
 * @returns {Record<string, number> | undefined} Saving throws or undefined
 */
const buildSavingThrows = (
  row: Monster,
): Record<string, number> | undefined => {
  const entries: [string, number | null][] = [
    ['str', row.saveStr],
    ['dex', row.saveDex],
    ['con', row.saveCon],
    ['int', row.saveInt],
    ['wis', row.saveWis],
    ['cha', row.saveCha],
  ];
  const throws: Record<string, number> = {};
  let hasAny = false;
  for (const [key, val] of entries) {
    if (val != null) {
      throws[key] = val;
      hasAny = true;
    }
  }
  return hasAny ? throws : undefined;
};

/**
 * Builds a `MonsterSenses` value object from flat row columns.
 *
 * @param {Monster} row - Prisma monster row
 * @returns {MonsterSenses} Senses value object
 */
const buildSenses = (row: Monster): MonsterSenses => ({
  raw: row.sensesRaw ?? '',
  passivePerception: orUndef(row.passivePerception),
  darkvision: orUndef(row.darkvision),
  blindsight: orUndef(row.blindsight),
  tremorsense: orUndef(row.tremorsense),
  truesight: orUndef(row.truesight),
});

/* ─────────────────────────────  Row mapper  ──────────────────────────── */

/**
 * Maps a Prisma `Monster` row to a typed `MonsterMetadata` domain object.
 * Delegates nested sub-objects to dedicated builder functions.
 *
 * @param {Monster} row - Prisma monster row (camelCase from schema)
 * @returns {MonsterMetadata} Domain model
 */
const rowToMonster = (row: Monster): MonsterMetadata => ({
  slug: row.slug,
  subSlug: orUndef(row.subSlug),
  title: row.title,
  file: row.file,
  link: row.link,
  size: orUndef(row.size),
  creatureType: orUndef(row.creatureType),
  alignment: orUndef(row.alignment),
  cr: orUndef(row.cr),
  proficiencyBonus: orUndef(row.proficiencyBonus),
  ac: buildAC(row),
  hp: buildHP(row),
  speed: buildSpeed(row),
  abilities: buildAbilities(row),
  savingThrows: buildSavingThrows(row),
  senses: buildSenses(row),
  skills: nonEmpty(row.skills),
  damageResistances: nonEmpty(row.damageResistances),
  damageImmunities: nonEmpty(row.damageImmunities),
  damageVulnerabilities: nonEmpty(row.damageVulnerabilities),
  conditionImmunities: nonEmpty(row.conditionImmunities),
  languages: nonEmpty(row.languages),
  tags: nonEmpty(row.tags),
  indexVersion: orUndef(row.indexVersion),
});

/* ──────────────────────────────  Repository  ─────────────────────────── */

/**
 * Prisma-backed monster repository.
 *
 * Queries the `monsters` table via the shared Prisma client.
 */
export const pgMonsterRepository: MonsterRepository = {
  list: async (locale: string): Promise<MonsterMetadata[]> => {
    try {
      const rows = await prisma.monster.findMany({
        where: { locale },
        orderBy: { slug: 'asc' },
      });
      return rows.map(rowToMonster);
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
      const rows = await prisma.monster.findMany({
        where: { locale },
        orderBy: { slug: 'asc' },
        select: {
          slug: true,
          subSlug: true,
          title: true,
          cr: true,
          size: true,
          creatureType: true,
        },
      });
      return rows.map((r) => ({
        slug: r.subSlug ?? r.slug,
        title: r.title,
        cr: r.cr ?? undefined,
        size: r.size ?? undefined,
        creatureType: r.creatureType ?? undefined,
      }));
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
      const row = await prisma.monster.findFirst({
        where: {
          locale,
          OR: [{ subSlug: slug }, { slug }],
        },
      });
      return row ? rowToMonster(row) : null;
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
