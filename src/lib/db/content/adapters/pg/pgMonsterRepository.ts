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
    MonsterAC,
    MonsterHP,
    MonsterIndexEntry,
    MonsterMetadata,
    MonsterSaves,
    MonsterScores,
    MonsterSenses,
    MonsterSpeed,
} from '../../schemas/monsterMetadata';
import { PgMetadataRepository } from './PgMetadataRepository';
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
  walk: orUndef(row.speed.walk),
  fly: orUndef(row.speed.fly),
  climb: orUndef(row.speed.climb),
  swim: orUndef(row.speed.swim),
  burrow: orUndef(row.speed.burrow),
  hover: orUndef(row.speed.hover),
});

/**
 * Maps the Score embed to domain `MonsterScores`.
 *
 * @param {MonsterEntity} row - Monster entity row
 * @returns {MonsterScores} Six flat ability scores
 */
const mapScores = (row: MonsterEntity): MonsterScores => ({
  str: orUndef(row.scores.str),
  dex: orUndef(row.scores.dex),
  con: orUndef(row.scores.con),
  int: orUndef(row.scores.int),
  wis: orUndef(row.scores.wis),
  cha: orUndef(row.scores.cha),
});

/**
 * Maps the Save embed to domain `MonsterSaves`.
 *
 * @param {MonsterEntity} row - Monster entity row
 * @returns {MonsterSaves | undefined} Saving throw bonuses or undefined
 */
const mapSaves = (row: MonsterEntity): MonsterSaves | undefined => {
  const s = row.saves;
  const saves: MonsterSaves = {};
  let hasAny = false;
  for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const) {
    const val = s[key];
    if (val != null) {
      saves[key] = val;
      hasAny = true;
    }
  }
  return hasAny ? saves : undefined;
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
  scores: mapScores(row),
  saves: mapSaves(row),
  senses: mapSenses(row),
  skills: nonEmpty(row.skills),
  damageResistances: nonEmpty(row.damageResistances),
  damageImmunities: nonEmpty(row.damageImmunities),
  damageVulnerabilities: nonEmpty(row.damageVulnerabilities),
  conditionImmunities: nonEmpty(row.conditionImmunities),
  languages: nonEmpty(row.languages),
  tags: nonEmpty(row.tags),
  image: orUndef(row.image),
  description: orUndef(row.description),
  indexVersion: orUndef(row.indexVersion),
});

/* ──────────────────────────────  Repository  ─────────────────────────── */

/**
 * MikroORM-backed monster repository.
 *
 * @class PgMonsterRepository
 * @extends {PgMetadataRepository<MonsterEntity, MonsterMetadata>}
 * @implements {MonsterRepository}
 */
class PgMonsterRepository
  extends PgMetadataRepository<MonsterEntity, MonsterMetadata>
  implements MonsterRepository
{
  protected readonly entityClass = MonsterEntity;

  protected override orderBy(): Record<string, 'asc' | 'desc'> {
    return { slug: 'asc' };
  }

  protected override toMetadata(row: MonsterEntity): MonsterMetadata {
    return rowToMonster(row);
  }

  /**
   * Returns a lightweight index of all monsters for use in dropdowns and search.
   *
   * @param {string} locale - Locale code
   * @returns {Promise<MonsterIndexEntry[]>} Index entries, or `[]` on error
   */
  async listIndex(locale: string): Promise<MonsterIndexEntry[]> {
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
  }

  /**
   * Overrides `getBySlug` to match on either `slug` or `subSlug`.
   *
   * @param {string} locale - Locale code
   * @param {string} slug - Slug or subSlug to look up
   * @returns {Promise<MonsterMetadata | null>} Matched monster or `null`
   */
  override async getBySlug(
    locale: string,
    slug: string,
  ): Promise<MonsterMetadata | null> {
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
  }
}

/** @type {MonsterRepository} */
export const pgMonsterRepository: MonsterRepository = new PgMonsterRepository();
