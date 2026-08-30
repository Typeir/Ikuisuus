/**
 * @fileoverview MikroORM Entity — Rule
 * @description One row per rules page (section hubs included).
 *
 * @module lib/db/orm/entities/RuleEntity
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import {
  OrmEntity,
  OrmIndex,
  OrmPrimaryKey,
  OrmProperty,
  OrmUnique,
} from '@/lib/db/orm/schema';

/**
 * MikroORM entity for the `rules` table.
 *
 * @property {string[]} produces - Shard ids this file defines
 * @property {string[]} consumes - Shard ids this file ingests
 * @property {string[]} consumers - Files ingesting a shard this one defines
 */
@OrmEntity('RuleEntity', { tableName: 'rules' })
@OrmUnique({ properties: ['locale', 'slug'] })
@OrmIndex({ properties: ['locale', 'category'], name: 'rules_locale_category_idx' })
export class RuleEntity {
  @OrmPrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  @OrmProperty({ type: 'string' })
  locale!: string;

  @OrmProperty({ type: 'string' })
  slug!: string;

  @OrmProperty({ type: 'string' })
  title!: string;

  @OrmProperty({ type: 'string' })
  file!: string;

  @OrmProperty({ type: 'string' })
  link!: string;

  @OrmProperty({ type: 'string', nullable: true })
  category?: string | null;

  @OrmProperty({ type: 'string[]' })
  tags: string[] = [];

  @OrmProperty({ type: 'string[]' })
  produces: string[] = [];

  @OrmProperty({ type: 'string[]' })
  consumes: string[] = [];

  @OrmProperty({ type: 'string[]' })
  consumers: string[] = [];

  /** @property {string | null} description - Prose description */
  @OrmProperty({ type: 'text', nullable: true })
  description?: string | null;

  /** @property {string | null} image - Image path */
  @OrmProperty({ type: 'string', nullable: true })
  image?: string | null;

  /** @property {string | null} readingTime - Locale-aware reading time label */
  @OrmProperty({ type: 'string', fieldName: 'reading_time', nullable: true })
  readingTime?: string | null;

  /** @property {string | null} versionHash - FNV-1a content hash for incremental sync */
  @OrmProperty({ type: 'string', fieldName: 'version_hash', nullable: true })
  versionHash?: string | null;
}
