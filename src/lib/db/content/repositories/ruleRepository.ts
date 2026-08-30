/**
 * @fileoverview Rule Repository Port + Factory
 * @description Selects the rule metadata repository from `METADATA_BACKEND`
 * and exports a resolved instance.
 *
 * @module lib/db/content/repositories/ruleRepository
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { fsRuleRepository } from '../adapters/fs/fsRuleRepository';
import { pgRuleRepository } from '../adapters/pg/pgRuleRepository';
import type { RuleMetadata } from '../schemas/ruleMetadata';

/**
 * Repository contract for rules metadata.
 *
 * Implementations MUST be safe to call even when the backing store is
 * unavailable — return empty arrays or null rather than throwing.
 */
export interface RuleRepository {
  /**
   * Returns all rule metadata records for a locale.
   *
   * @param {string} locale - Locale code (e.g. 'en', 'es')
   * @returns {Promise<RuleMetadata[]>} Full metadata array
   */
  list(locale: string): Promise<RuleMetadata[]>;

  /**
   * Returns a single rules page by slug.
   *
   * @param {string} locale - Locale code
   * @param {string} slug - Rule slug identifier
   * @returns {Promise<RuleMetadata | null>} Matched record or null
   */
  getBySlug(locale: string, slug: string): Promise<RuleMetadata | null>;
}

/** @property {string} metadataBackend - Active backend: `'fs'` (default) or `'pg'`. */
const metadataBackend = process.env.METADATA_BACKEND || 'fs';

/**
 * Resolves the rule repository for the active backend.
 *
 * @returns {RuleRepository} Rule metadata repository
 * @throws {Error} If `METADATA_BACKEND` is not `'fs'` or `'pg'`
 */
const createRuleRepository = (): RuleRepository => {
  switch (metadataBackend) {
    case 'pg':
      return pgRuleRepository;
    case 'fs':
      return fsRuleRepository;
    default:
      throw new Error(`Unsupported metadata backend: ${metadataBackend}`);
  }
};

/** @property {RuleRepository} ruleRepository - Resolved rule repository instance. */
export const ruleRepository = createRuleRepository();
