/**
 * @fileoverview MikroORM Entity — Draft
 * @description Decorator-based entity for the `drafts` table.
 * Stores temporary .mdx draft content during the edit-revalidate cycle.
 * GitHub/Bucket remains the single source of truth; this table holds
 * candidate content that is archived once revalidation succeeds.
 *
 * @module lib/db/orm/entities/DraftEntity
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';

/**
 * Valid draft lifecycle statuses.
 *
 * @property {'active'} active - Draft is the current candidate for its slug; shown by DraftOverlay
 * @property {'pending'} pending - Submitted by a non-admin user; awaits explicit review before auto-merge
 * @property {'archived'} archived - Draft was archived after successful revalidation
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
@Entity({ tableName: 'drafts' })
@Index({
  properties: ['locale', 'slug', 'status'],
  name: 'drafts_locale_slug_status_idx',
})
export class DraftEntity {
  /** @property {number} id - Auto-incrementing primary key */
  @PrimaryKey({ type: 'number', autoincrement: true })
  id!: number;

  /** @property {string} locale - Content locale code */
  @Property({ type: 'string', default: 'en' })
  locale!: string;

  /** @property {string} slug - Content slug path */
  @Property({ type: 'string' })
  slug!: string;

  /** @property {string} content - Raw MDX content */
  @Property({ type: 'string', columnType: 'text' })
  content!: string;

  /** @property {DraftStatus} status - Lifecycle status: 'active', 'pending', or 'archived' */
  @Property({ type: 'string', default: 'active' })
  status!: DraftStatus;

  /** @property {Date} createdAt - Creation timestamp */
  @Property({
    type: 'Date',
    fieldName: 'created_at',
    columnType: 'timestamptz',
    defaultRaw: 'now()',
  })
  createdAt!: Date;

  /** @property {Date} updatedAt - Last update timestamp */
  @Property({
    type: 'Date',
    fieldName: 'updated_at',
    columnType: 'timestamptz',
    defaultRaw: 'now()',
    onUpdate: () => new Date(),
  })
  updatedAt!: Date;

  /** @property {string | null} versionHash - Optional content hash */
  @Property({ type: 'string', fieldName: 'version_hash', nullable: true })
  versionHash?: string | null;
}
