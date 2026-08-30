/**
 * @fileoverview PostgreSQL Rule Repository (MikroORM)
 * @description Implements `RuleRepository` via MikroORM against the `rules`
 * table.
 *
 * @module lib/db/content/adapters/pg/pgRuleRepository
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { RuleEntity } from '@/lib/db/orm/entities/RuleEntity';
import { nonEmpty, orUndef } from '@/lib/db/orm/helpers';
import type { RuleRepository } from '../../repositories/ruleRepository';
import type { RuleMetadata } from '../../schemas/ruleMetadata';
import { PgMetadataRepository } from './PgMetadataRepository';

/* ──────────────────────────────  Row mapper  ─────────────────────────── */

/**
 * Maps a MikroORM `RuleEntity` row to the `RuleMetadata` domain object.
 *
 * @param {RuleEntity} row - MikroORM rule entity
 * @returns {RuleMetadata} Domain model
 */
const rowToRule = (row: RuleEntity): RuleMetadata => ({
  slug: row.slug,
  title: row.title,
  file: row.file,
  link: row.link,
  category: orUndef(row.category),
  tags: nonEmpty(row.tags),
  produces: nonEmpty(row.produces),
  consumes: nonEmpty(row.consumes),
  consumers: nonEmpty(row.consumers),
  description: orUndef(row.description),
  readingTime: orUndef(row.readingTime),
  versionHash: orUndef(row.versionHash),
});

/* ──────────────────────────────  Repository  ─────────────────────────── */

/**
 * MikroORM-backed rule repository.
 *
 * @class PgRuleRepository
 * @extends {PgMetadataRepository<RuleEntity, RuleMetadata>}
 * @implements {RuleRepository}
 */
class PgRuleRepository
  extends PgMetadataRepository<RuleEntity, RuleMetadata>
  implements RuleRepository
{
  protected readonly entityClass = RuleEntity;

  protected override orderBy(): Record<string, 'asc' | 'desc'> {
    return { title: 'asc' };
  }

  protected override toMetadata(row: RuleEntity): RuleMetadata {
    return rowToRule(row);
  }
}

/** @type {RuleRepository} */
export const pgRuleRepository: RuleRepository = new PgRuleRepository();
