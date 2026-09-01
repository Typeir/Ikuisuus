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

import 'server-only';

import { VocationEntity } from '@/lib/db/orm/entities/VocationEntity';
import { nonEmpty, orUndef } from '@/lib/db/orm/helpers';
import type { VocationRepository } from '../../repositories/vocationRepository';
import type {
    VocationFeature,
    VocationMetadata,
    VocationSpellcasting,
} from '../../schemas/vocationMetadata';
import { PgMetadataRepository } from './PgMetadataRepository';

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
      heading: f.heading ?? undefined,
      anchor: f.anchor ?? undefined,
      tags: nonEmpty(f.tags ?? []),
      startLine: f.startLine ?? undefined,
      endLine: f.endLine ?? undefined,
      grants: nonEmpty(f.grants ?? []),
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
    description: orUndef(row.description),
    indexVersion: orUndef(row.indexVersion),
  };
};

/* ──────────────────────────────  Repository  ─────────────────────────── */

/**
 * MikroORM-backed vocation repository.
 *
 * @class PgVocationRepository
 * @extends {PgMetadataRepository<VocationEntity, VocationMetadata>}
 * @implements {VocationRepository}
 */
class PgVocationRepository
  extends PgMetadataRepository<VocationEntity, VocationMetadata>
  implements VocationRepository
{
  protected readonly entityClass = VocationEntity;

  protected override populate(): string[] {
    return ['features'];
  }

  protected override orderBy(): Record<string, 'asc' | 'desc'> {
    return { title: 'asc' };
  }

  protected override toMetadata(row: VocationEntity): VocationMetadata {
    return rowToVocation(row);
  }
}

/** @type {VocationRepository} */
export const pgVocationRepository: VocationRepository =
  new PgVocationRepository();
