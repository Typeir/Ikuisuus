/**
 * @fileoverview PostgreSQL Specialization Repository (MikroORM)
 * @description Implements `SpecializationRepository` via MikroORM against the
 * `specializations`, `specialization_features`, and
 * `specialization_prepared_spells` tables.
 *
 * @module lib/db/content/adapters/pg/pgSpecializationRepository
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import { SpecializationEntity } from '@/lib/db/orm/entities/SpecializationEntity';
import { nonEmpty, orUndef } from '@/lib/db/orm/helpers';
import { getEM } from '@/lib/db/orm/orm';
import { logger } from '@/lib/logging/logger';
import type { SpecializationRepository } from '../../repositories/specializationRepository';
import type {
    AlwaysPreparedSpells,
    SpecializationFeature,
    SpecializationMetadata,
    SpecializationSpellcasting,
} from '../../schemas/specializationMetadata';
import { PgMetadataRepository } from './PgMetadataRepository';

const log = logger.child({ module: 'PGSpecializationRepo' });

/* ──────────────────────────────  Row mapper  ─────────────────────────── */

/**
 * Maps a MikroORM `SpecializationEntity` (with populated children) to a
 * `SpecializationMetadata` domain object.
 *
 * @param {SpecializationEntity} row - MikroORM entity with loaded relations
 * @returns {SpecializationMetadata} Domain model
 */
const rowToSpecialization = (
  row: SpecializationEntity,
): SpecializationMetadata => {
  const features: SpecializationFeature[] = row.features
    .getItems()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((f) => ({
      level: f.level,
      name: f.name,
      startLine: f.startLine ?? undefined,
      endLine: f.endLine ?? undefined,
      grants: nonEmpty(f.grants ?? []),
    }));

  const spellcasting: SpecializationSpellcasting | undefined =
    row.spellcasting?.ability && row.spellcasting?.progression
      ? {
          ability: row.spellcasting.ability,
          progression: row.spellcasting.progression,
        }
      : undefined;

  const preparedItems = row.preparedSpells
    .getItems()
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const preparedSpells: AlwaysPreparedSpells[] | undefined =
    preparedItems.length > 0
      ? preparedItems.map((p) => ({
          level: p.level,
          spells: p.spells,
        }))
      : undefined;

  return {
    slug: row.slug,
    title: row.title,
    file: row.file,
    link: row.link,
    vocation: row.vocation,
    specializationType: row.specializationType,
    flavor: orUndef(row.flavor),
    description: orUndef(row.description),
    spellcasting,
    preparedSpells,
    features,
    tags: nonEmpty(row.tags) ?? [],
    indexVersion: orUndef(row.indexVersion),
  };
};

/** @property {string[]} populateFields - Relations to populate on queries. */
const populateFields = ['features', 'preparedSpells'] as const;

/* ──────────────────────────────  Repository  ─────────────────────────── */

/**
 * MikroORM-backed specialization repository.
 *
 * @class PgSpecializationRepository
 * @extends {PgMetadataRepository<SpecializationEntity, SpecializationMetadata>}
 * @implements {SpecializationRepository}
 */
class PgSpecializationRepository
  extends PgMetadataRepository<SpecializationEntity, SpecializationMetadata>
  implements SpecializationRepository
{
  protected readonly entityClass = SpecializationEntity;

  protected override populate(): string[] {
    return [...populateFields];
  }

  protected override orderBy(): Record<string, 'asc' | 'desc'> {
    return { title: 'asc' };
  }

  protected override toMetadata(
    row: SpecializationEntity,
  ): SpecializationMetadata {
    return rowToSpecialization(row);
  }

  /**
   * Returns all specializations belonging to a given vocation.
   *
   * @param {string} locale - Locale code
   * @param {string} vocation - Vocation slug to filter by
   * @returns {Promise<SpecializationMetadata[]>} Matching specializations, or `[]` on error
   */
  async listByVocation(
    locale: string,
    vocation: string,
  ): Promise<SpecializationMetadata[]> {
    try {
      const em = await getEM();
      const rows = await em.find(
        SpecializationEntity,
        { locale, vocation },
        { populate: [...populateFields], orderBy: { title: 'asc' } },
      );
      return rows.map(rowToSpecialization);
    } catch (error) {
      log.error('Error reading specializations by vocation from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        vocation,
      });
      return [];
    }
  }
}

/** @type {SpecializationRepository} */
export const pgSpecializationRepository: SpecializationRepository =
  new PgSpecializationRepository();
