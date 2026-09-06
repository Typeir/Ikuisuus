/**
 * @fileoverview Rule Metadata Schema
 * @description Metadata for a rules chapter page.
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
