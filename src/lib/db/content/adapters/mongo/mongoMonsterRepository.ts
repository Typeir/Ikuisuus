/**
 * @fileoverview MongoDB Monster Repository (Prisma)
 * @description Implements `MonsterRepository` via Prisma ORM against the
 * `monsters` MongoDB collection. Maps documents to the same domain types
 * used by the PostgreSQL adapter, preserving interface compatibility.
 *
 * Ability modifiers are NOT stored — consumers compute them:
 *   `mod = Math.floor((score - 10) / 2)`
 *
 * @module lib/db/content/adapters/mongo/mongoMonsterRepository
 * @version 1.0.0
 * @author Typeir
 * @since 4.0.0
 */

import { mongoPrisma } from '@/lib/db/prisma/mongoClient';
import type { Monster } from '@/lib/db/prisma/generated/mongo';
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
import { nonEmpty, orUndef } from '../pg/rowParsers';

const log = logger.child({ module: 'MongoMonsterRepo' });

/* ─────────────────────  Sub-object builders  ─────────────────────────── */

/**
 * Builds a `MonsterAC` value object from flat document fields.
 *
 * @param {Monster} doc - Prisma monster document
 * @returns {MonsterAC} Armor class value object
 */
const buildAC = (doc: Monster): MonsterAC => ({
  value: doc.acValue ?? 0,
  notes: orUndef(doc.acNotes),
  raw: orUndef(doc.acRaw),
});

/**
 * Builds a `MonsterHP` value object from flat document fields.
 *
 * @param {Monster} doc - Prisma monster document
 * @returns {MonsterHP} Hit points value object
 */
const buildHP = (doc: Monster): MonsterHP => ({
  average: doc.hpAverage ?? 0,
  formula: orUndef(doc.hpFormula),
  raw: orUndef(doc.hpRaw),
});

/**
 * Builds a `MonsterSpeed` value object from flat document fields.
 *
 * @param {Monster} doc - Prisma monster document
 * @returns {MonsterSpeed} Speed value object with parsed modes
 */
const buildSpeed = (doc: Monster): MonsterSpeed => ({
  raw: doc.speedRaw ?? '',
  modes: {
    walk: orUndef(doc.speedWalk),
    fly: orUndef(doc.speedFly),
    climb: orUndef(doc.speedClimb),
    swim: orUndef(doc.speedSwim),
    burrow: orUndef(doc.speedBurrow),
    hover: orUndef(doc.speedHover),
  },
});

/**
 * Builds `AbilityScores` from the six flat score fields.
 *
 * @param {Monster} doc - Prisma monster document
 * @returns {AbilityScores} Six ability scores
 */
const buildAbilities = (doc: Monster): AbilityScores => ({
  str: { score: orUndef(doc.strScore) },
  dex: { score: orUndef(doc.dexScore) },
  con: { score: orUndef(doc.conScore) },
  int: { score: orUndef(doc.intScore) },
  wis: { score: orUndef(doc.wisScore) },
  cha: { score: orUndef(doc.chaScore) },
});

/**
 * Builds a saving throws map from the six flat save fields.
 *
 * @param {Monster} doc - Prisma monster document
 * @returns {Record<string, number> | undefined} Saving throws or undefined
 */
const buildSavingThrows = (
  doc: Monster,
): Record<string, number> | undefined => {
  const entries: [string, number | null][] = [
    ['str', doc.saveStr],
    ['dex', doc.saveDex],
    ['con', doc.saveCon],
    ['int', doc.saveInt],
    ['wis', doc.saveWis],
    ['cha', doc.saveCha],
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
 * Builds a `MonsterSenses` value object from flat document fields.
 *
 * @param {Monster} doc - Prisma monster document
 * @returns {MonsterSenses} Senses value object
 */
const buildSenses = (doc: Monster): MonsterSenses => ({
  raw: doc.sensesRaw ?? '',
  passivePerception: orUndef(doc.passivePerception),
  darkvision: orUndef(doc.darkvision),
  blindsight: orUndef(doc.blindsight),
  tremorsense: orUndef(doc.tremorsense),
  truesight: orUndef(doc.truesight),
});

/* ─────────────────────────────  Doc mapper  ──────────────────────────── */

/**
 * Maps a Prisma MongoDB `Monster` document to a `MonsterMetadata` domain object.
 *
 * @param {Monster} doc - Prisma monster document
 * @returns {MonsterMetadata} Domain model
 */
const docToMonster = (doc: Monster): MonsterMetadata => ({
  slug: doc.slug,
  subSlug: orUndef(doc.subSlug),
  title: doc.title,
  file: doc.file,
  link: doc.link,
  size: orUndef(doc.size),
  creatureType: orUndef(doc.creatureType),
  alignment: orUndef(doc.alignment),
  cr: orUndef(doc.cr),
  proficiencyBonus: orUndef(doc.proficiencyBonus),
  ac: buildAC(doc),
  hp: buildHP(doc),
  speed: buildSpeed(doc),
  abilities: buildAbilities(doc),
  savingThrows: buildSavingThrows(doc),
  senses: buildSenses(doc),
  skills: nonEmpty(doc.skills),
  damageResistances: nonEmpty(doc.damageResistances),
  damageImmunities: nonEmpty(doc.damageImmunities),
  damageVulnerabilities: nonEmpty(doc.damageVulnerabilities),
  conditionImmunities: nonEmpty(doc.conditionImmunities),
  languages: nonEmpty(doc.languages),
  tags: nonEmpty(doc.tags),
  indexVersion: orUndef(doc.indexVersion),
});

/* ──────────────────────────────  Repository  ─────────────────────────── */

/**
 * Prisma-backed monster repository for MongoDB.
 *
 * Queries the `monsters` collection via the shared MongoDB Prisma client.
 */
export const mongoMonsterRepository: MonsterRepository = {
  list: async (locale: string): Promise<MonsterMetadata[]> => {
    try {
      const docs = await mongoPrisma.monster.findMany({
        where: { locale },
        orderBy: { slug: 'asc' },
      });
      return docs.map(docToMonster);
    } catch (error) {
      log.error('Error reading monster metadata from MongoDB', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  },

  listIndex: async (locale: string): Promise<MonsterIndexEntry[]> => {
    try {
      const docs = await mongoPrisma.monster.findMany({
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
      return docs.map((d) => ({
        slug: d.subSlug ?? d.slug,
        title: d.title,
        cr: d.cr ?? undefined,
        size: d.size ?? undefined,
        creatureType: d.creatureType ?? undefined,
      }));
    } catch (error) {
      log.error('Error reading monster index from MongoDB', {
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
      const doc = await mongoPrisma.monster.findFirst({
        where: {
          locale,
          OR: [{ subSlug: slug }, { slug }],
        },
      });
      return doc ? docToMonster(doc) : null;
    } catch (error) {
      log.error('Error reading single monster from MongoDB', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slug,
      });
      return null;
    }
  },
};
