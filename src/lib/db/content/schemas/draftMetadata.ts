/**
 * @fileoverview Draft Metadata Schema
 * @description Domain types for draft content. These types define the shape
 * of data returned to consumers — decoupled from the ORM entity layer.
 *
 * @module lib/db/content/schemas/draftMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

/**
 * Valid draft lifecycle statuses.
 *
 * @property {'active'} active - Draft is the current candidate for its slug; shown by DraftOverlay
 * @property {'pending'} pending - Submitted by a non-admin user; awaits explicit review before auto-merge
 * @property {'archived'} archived - Draft was archived after successful revalidation
 */
export type DraftStatus = 'active' | 'pending' | 'archived';

/**
 * Domain representation of a draft record.
 *
 * @property {number} id - Unique identifier
 * @property {string} locale - Content locale (e.g. 'en')
 * @property {string} slug - Content slug path (e.g. 'monsters/albedo')
 * @property {string} content - Raw MDX content
 * @property {DraftStatus} status - Lifecycle status
 * @property {string} createdAt - ISO 8601 timestamp
 * @property {string} updatedAt - ISO 8601 timestamp
 * @property {string | null} [versionHash] - FNV-1a content hash; null for legacy rows predating hash population
 */
export interface DraftMetadata {
  id: number;
  locale: string;
  slug: string;
  content: string;
  status: DraftStatus;
  createdAt: string;
  updatedAt: string;
  versionHash?: string | null;
}

/**
 * Input for creating or updating a draft.
 *
 * @property {string} locale - Content locale
 * @property {string} slug - Content slug path
 * @property {string} content - Raw MDX content
 * @property {DraftStatus} [status] - Override lifecycle status; defaults to 'active' when omitted
 */
export interface DraftInput {
  locale: string;
  slug: string;
  content: string;
  status?: DraftStatus;
}

/**
 * Concurrency cursor for optimistic draft updates.
 *
 * @property {string | null} [updatedAt] - Last seen active draft update timestamp (ISO 8601)
 * @property {string | null} [versionHash] - Last seen active draft content hash
 */
export interface DraftConcurrencyExpectation {
  updatedAt?: string | null;
  versionHash?: string | null;
}
