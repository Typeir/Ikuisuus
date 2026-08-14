/**
 * @fileoverview MikroORM Entity — Draft
 * @description Decorator-based entity for the `drafts` table.
 * Stores temporary .mdx draft content prior to revalidation.
 *
 * @module lib/db/orm/entities/DraftEntity
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

import {
    OrmEntity,
    OrmIndex,
    OrmPrimaryKey,
    OrmProperty,
} from '@/lib/db/orm/schema';

/**
 * Valid draft lifecycle statuses.
 *
 * @property {'active'} active - Current candidate for its slug
 * @property {'pending'} pending - Submitted by non-admin; awaits review before merge
 * @property {'archived'} archived - Archived after successful revalidation
 */
export type DraftStatus = 'active' | 'pending' | 'archived';

/**
 * MikroORM entity for the `drafts` table.
 *
 * @property {number} id - Auto-incrementing primary key
 * @property {string} locale - Content locale (e.g. 'en', 'es')
 * @property {string} slug - Content slug path (e.g. 'monsters/albedo')
 * @property {string} content - Raw MDX content of the draft
 * @property {DraftStatus} status - Lifecycle status: 'active', 'pending', or 'archived'
 * @property {Date} createdAt - Timestamp when the draft was created
 * @property {Date} updatedAt - Timestamp of the last update
 * @property {string | null} versionHash - FNV-1a content hash derived from locale+slug+content
 */
@OrmEntity('DraftEntity', { tableName: 'drafts' })
@OrmIndex({
  properties: ['locale', 'slug', 'status'],
  name: 'drafts_locale_slug_status_idx',
})
export class DraftEntity {
  /** @property {number} id - Auto-incrementing primary key */
  @OrmPrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  /** @property {string} locale - Content locale code */
  @OrmProperty({ type: 'string', default: 'en' })
  locale!: string;

  /** @property {string} slug - Content slug path */
  @OrmProperty({ type: 'string' })
  slug!: string;

  /** @property {string} content - Raw MDX content */
  @OrmProperty({ type: 'string', columnType: 'text' })
  content!: string;

  /** @property {DraftStatus} status - Lifecycle status: 'active', 'pending', or 'archived' */
  @OrmProperty({ type: 'string', default: 'active' })
  status!: DraftStatus;

  /** @property {Date} createdAt - Creation timestamp */
  @OrmProperty({
    type: 'Date',
    fieldName: 'created_at',
    columnType: 'timestamptz',
    defaultRaw: 'now()',
  })
  createdAt!: Date;

  /** @property {Date} updatedAt - Last update timestamp */
  @OrmProperty({
    type: 'Date',
    fieldName: 'updated_at',
    columnType: 'timestamptz',
    defaultRaw: 'now()',
    onUpdate: () => new Date(),
  })
  updatedAt!: Date;

  /** @property {string | null} versionHash - Optional content hash */
  @OrmProperty({ type: 'string', fieldName: 'version_hash', nullable: true })
  versionHash?: string | null;
}
