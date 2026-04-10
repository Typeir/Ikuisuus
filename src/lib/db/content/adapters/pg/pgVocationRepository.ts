/**
 * @fileoverview PostgreSQL Vocation Repository (MikroORM)
 * @description Implements `VocationRepository` via MikroORM against the
 * `vocations` and `vocation_features` tables.
 *
 * @module lib/db/content/adapters/pg/pgVocationRepository
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import { VocationEntity } from '@/lib/db/orm/entities/VocationEntity';
import { nonEmpty, orUndef } from '@/lib/db/orm/helpers';
import { getEM } from '@/lib/db/orm/orm';
import { logger } from '@/lib/logging/logger';
import type { VocationRepository } from '../../repositories/vocationRepository';
import type {
    VocationFeature,
    VocationMetadata,
    VocationSpellcasting,
} from '../../schemas/vocationMetadata';

const log = logger.child({ module: 'PGVocationRepo' });

/* ──────────────────────────────  Row mapper  ─────────────────────────── */

/**
 * Maps a MikroORM `VocationEntity` (with populated features) to a
 * `VocationMetadata` domain object.
 *
 * @param {VocationEntity} row - MikroORM vocation entity with loaded features
 * @returns {VocationMetadata} Domain model
 */
const rowToVocation = (row: VocationEntity): VocationMetadata => {
  const features: VocationFeature[] = row.features
    .getItems()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((f) => ({
      level: f.level,
      name: f.name,
    }));

  const spellcasting: VocationSpellcasting | undefined =
    row.spellcasting?.ability && row.spellcasting?.progression
      ? {
          ability: row.spellcasting.ability,
          progression: row.spellcasting.progression,
        }
      : undefined;

  return {
    slug: row.slug,
    title: row.title,
    file: row.file,
    link: row.link,
    archetype: row.archetype,
    primaryAbility: row.primaryAbility,
    hitDie: row.hitDie,
    savingThrows: row.savingThrows,
    armorProficiencies: row.armorProficiencies,
    weaponProficiencies: row.weaponProficiencies,
    toolProficiencies: row.toolProficiencies,
    skillProficiencies: {
      count: row.skillProficiencies.count,
      choices: row.skillProficiencies.choices,
    },
    spellcasting,
    specializations: row.specializations,
    features,
    tags: nonEmpty(row.tags) ?? [],
    indexVersion: orUndef(row.indexVersion),
  };
};

/* ──────────────────────────────  Repository  ─────────────────────────── */

/**
 * MikroORM-backed vocation repository.
 */
export const pgVocationRepository: VocationRepository = {
  list: async (locale: string): Promise<VocationMetadata[]> => {
    try {
      const em = await getEM();
      const rows = await em.find(
        VocationEntity,
        { locale },
        { populate: ['features'], orderBy: { title: 'asc' } },
      );
      return rows.map(rowToVocation);
    } catch (error) {
      log.error('Error reading vocation metadata from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  },

  getBySlug: async (
    locale: string,
    slug: string,
  ): Promise<VocationMetadata | null> => {
    try {
      const em = await getEM();
      const row = await em.findOne(
        VocationEntity,
        { locale, slug },
        { populate: ['features'] },
      );
      return row ? rowToVocation(row) : null;
    } catch (error) {
      log.error('Error reading single vocation from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slug,
      });
      return null;
    }
  },
};
