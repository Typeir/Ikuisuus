/**
 * @fileoverview PostgreSQL Monster Repository (MikroORM)
 * @description Implements `MonsterRepository` via MikroORM `EntityManager`
 * against the `monsters` table. Embedded value objects (AC, HP, Speed,
 * Scores, Saves, Senses) are mapped directly from the entity — no manual
 * field-by-field reconstruction needed.
 *
 * Ability modifiers are NOT stored — consumers compute them:
 *   `mod = Math.floor((score - 10) / 2)`
 *
 * @module lib/db/content/adapters/pg/pgMonsterRepository
 * @version 5.0.0
 * @author Typeir
 * @since 5.0.0
 */

import { MonsterEntity } from '@/lib/db/orm/entities/MonsterEntity';
import { nonEmpty, orUndef } from '@/lib/db/orm/helpers';
import { getEM } from '@/lib/db/orm/orm';
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

const log = logger.child({ module: 'PGMonsterRepo' });

/* ─────────────────────  Embed → Domain mappers  ─────────────────────── */

/**
 * Maps the AC embed to a domain `MonsterAC`.
 *
 * @param {MonsterEntity} row - Monster entity row
 * @returns {MonsterAC} Armor class value object
 */
const mapAC = (row: MonsterEntity): MonsterAC => ({
  value: row.ac.value ?? 0,
  notes: orUndef(row.ac.notes),
  raw: orUndef(row.ac.raw),
});

/**
 * Maps the HP embed to a domain `MonsterHP`.
 *
 * @param {MonsterEntity} row - Monster entity row
 * @returns {MonsterHP} Hit points value object
 */
const mapHP = (row: MonsterEntity): MonsterHP => ({
  average: row.hp.average ?? 0,
  formula: orUndef(row.hp.formula),
  raw: orUndef(row.hp.raw),
});

/**
 * Maps the Speed embed to a domain `MonsterSpeed`.
 *
 * @param {MonsterEntity} row - Monster entity row
 * @returns {MonsterSpeed} Speed value object
 */
const mapSpeed = (row: MonsterEntity): MonsterSpeed => ({
  raw: row.speed.raw ?? '',
  modes: {
    walk: orUndef(row.speed.walk),
    fly: orUndef(row.speed.fly),
    climb: orUndef(row.speed.climb),
    swim: orUndef(row.speed.swim),
    burrow: orUndef(row.speed.burrow),
    hover: orUndef(row.speed.hover),
  },
});

/**
 * Maps the Score embed to domain `AbilityScores`.
 *
 * @param {MonsterEntity} row - Monster entity row
 * @returns {AbilityScores} Six ability scores
 */
const mapAbilities = (row: MonsterEntity): AbilityScores => ({
  str: { score: orUndef(row.scores.str) },
  dex: { score: orUndef(row.scores.dex) },
  con: { score: orUndef(row.scores.con) },
  int: { score: orUndef(row.scores.int) },
  wis: { score: orUndef(row.scores.wis) },
  cha: { score: orUndef(row.scores.cha) },
});

/**
 * Maps the Save embed to a saving-throws record.
 *
 * @param {MonsterEntity} row - Monster entity row
 * @returns {Record<string, number> | undefined} Saving throws or undefined
 */
const mapSavingThrows = (
  row: MonsterEntity,
): Record<string, number> | undefined => {
  const s = row.saves;
  const throws: Record<string, number> = {};
  let hasAny = false;
  for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const) {
    const val = s[key];
    if (val != null) {
      throws[key] = val;
      hasAny = true;
    }
  }
  return hasAny ? throws : undefined;
};

/**
 * Maps the Sense embed to a domain `MonsterSenses`.
 *
 * @param {MonsterEntity} row - Monster entity row
 * @returns {MonsterSenses} Senses value object
 */
const mapSenses = (row: MonsterEntity): MonsterSenses => ({
  raw: row.senses.raw ?? '',
  passivePerception: orUndef(row.senses.passivePerception),
  darkvision: orUndef(row.senses.darkvision),
  blindsight: orUndef(row.senses.blindsight),
  tremorsense: orUndef(row.senses.tremorsense),
  truesight: orUndef(row.senses.truesight),
});

/* ─────────────────────────────  Row mapper  ──────────────────────────── */

/**
 * Maps a MikroORM `Monster` entity to a typed `MonsterMetadata` domain object.
 *
 * @param {MonsterEntity} row - MikroORM entity row
 * @returns {MonsterMetadata} Domain model
 */
const rowToMonster = (row: MonsterEntity): MonsterMetadata => ({
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
  ac: mapAC(row),
  hp: mapHP(row),
  speed: mapSpeed(row),
  abilities: mapAbilities(row),
  savingThrows: mapSavingThrows(row),
  senses: mapSenses(row),
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
 * MikroORM-backed monster repository.
 */
export const pgMonsterRepository: MonsterRepository = {
  list: async (locale: string): Promise<MonsterMetadata[]> => {
    try {
      const em = await getEM();
      const rows = await em.find(
        MonsterEntity,
        { locale },
        { orderBy: { slug: 'asc' } },
      );
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
      const em = await getEM();
      const rows = await em.find(
        MonsterEntity,
        { locale },
        {
          fields: ['slug', 'subSlug', 'title', 'cr', 'size', 'creatureType'],
          orderBy: { slug: 'asc' },
        },
      );
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
      const em = await getEM();
      const row = await em.findOne(MonsterEntity, {
        locale,
        $or: [{ subSlug: slug }, { slug }],
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
