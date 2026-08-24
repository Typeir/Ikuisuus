/**
 * @fileoverview Rule Metadata Schema
 * @description Metadata for a rules chapter page. Rules are prose documents, so
 * the record adds only the chapter grouping on top of the shared base.
 *
 * @module lib/db/content/schemas/ruleMetadata
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { BaseMetadata } from './baseMetadata';

/**
 * A rules chapter page.
 *
 * @interface RuleMetadata
 * @extends BaseMetadata
 * @property {string} [category] - Chapter the page belongs to, from its parent directory
 */
export interface RuleMetadata extends BaseMetadata {
  category?: string;
}
