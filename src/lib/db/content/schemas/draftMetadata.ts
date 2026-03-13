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
 * @property {'active'} active - Draft is the current candidate for its slug
 * @property {'archived'} archived - Draft was archived after successful revalidation
 */
export type DraftStatus = 'active' | 'archived';

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
 */
export interface DraftMetadata {
  id: number;
  locale: string;
  slug: string;
  content: string;
  status: DraftStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating or updating a draft.
 *
 * @property {string} locale - Content locale
 * @property {string} slug - Content slug path
 * @property {string} content - Raw MDX content
 */
export interface DraftInput {
  locale: string;
  slug: string;
  content: string;
}
