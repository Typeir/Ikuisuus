/**
 * @fileoverview PostgreSQL Bloodline Repository (MikroORM)
 * @description Implements `BloodlineRepository` via MikroORM against the
 * `bloodlines` and `bloodline_boons` tables.
 *
 * @module lib/db/content/adapters/pg/pgBloodlineRepository
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import { BloodlineEntity } from '@/lib/db/orm/entities/BloodlineEntity';
import { nonEmpty, orUndef } from '@/lib/db/orm/helpers';
import { getEM } from '@/lib/db/orm/orm';
import { logger } from '@/lib/logging/logger';
import type { BloodlineRepository } from '../../repositories/bloodlineRepository';
import type {
  BloodlineBoon,
  BloodlineMetadata,
} from '../../schemas/bloodlineMetadata';

const log = logger.child({ module: 'PGBloodlineRepo' });

/* ──────────────────────────────  Row mapper  ─────────────────────────── */

/**
 * Maps a MikroORM `BloodlineEntity` (with populated boons) to a
 * `BloodlineMetadata` domain object.
 *
 * @param {BloodlineEntity} row - MikroORM bloodline entity with loaded boons
 * @returns {BloodlineMetadata} Domain model
 */
const rowToBloodline = (row: BloodlineEntity): BloodlineMetadata => {
  const boons: BloodlineBoon[] = row.boons
    .getItems()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((b) => ({
      name: b.name,
      bpLabel: b.bpLabel,
      bpValue: orUndef(b.bpValue),
      sortOrder: b.sortOrder,
      tags: b.tags,
    }));

  return {
    slug: row.slug,
    title: row.title,
    file: row.file,
    link: row.link,
    description: orUndef(row.description),
    coreFeatures: {
      abilityScores: row.abilityScores,
      movementSpeeds: row.movementSpeeds,
      senses: row.senses,
      size: row.size,
      creatureTypes: row.creatureTypes,
      age: orUndef(row.age),
    },
    boonBudget: orUndef(row.boonBudget),
    boons,
    tags: nonEmpty(row.tags),
    indexVersion: orUndef(row.indexVersion),
  };
};

/* ──────────────────────────────  Repository  ─────────────────────────── */

/**
 * MikroORM-backed bloodline repository.
 */
export const pgBloodlineRepository: BloodlineRepository = {
  list: async (locale: string): Promise<BloodlineMetadata[]> => {
    try {
      const em = await getEM();
      const rows = await em.find(
        BloodlineEntity,
        { locale },
        { populate: ['boons'], orderBy: { title: 'asc' } },
      );
      return rows.map(rowToBloodline);
    } catch (error) {
      log.error('Error reading bloodline metadata from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
      });
      return [];
    }
  },

  getBySlug: async (
    locale: string,
    slug: string,
  ): Promise<BloodlineMetadata | null> => {
    try {
      const em = await getEM();
      const row = await em.findOne(
        BloodlineEntity,
        { locale, slug },
        { populate: ['boons'] },
      );
      return row ? rowToBloodline(row) : null;
    } catch (error) {
      log.error('Error reading single bloodline from PostgreSQL', {
        error: error instanceof Error ? error.message : String(error),
        locale,
        slug,
      });
      return null;
    }
  },
};
