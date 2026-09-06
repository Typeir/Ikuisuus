/**
 * @fileoverview Draft repository port contract and factory-resolved instance.
 * @description Drafts always persist to PostgreSQL.
 *
 * @module lib/db/content/repositories/draftRepository
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

import 'server-only';

import { pgDraftRepository } from '../adapters/pg/pgDraftRepository';
import type {
  DraftConcurrencyExpectation,
  DraftInput,
  DraftMetadata,
} from '../schemas/draftMetadata';

/**
 * Repository contract for draft persistence.
 */
export interface DraftRepository {
  /**
   * Creates or replaces the active draft for a locale+slug pair.
   *
   * @param {DraftInput} input - Draft content to upsert
   * @returns {Promise<DraftMetadata>} The created or updated draft
   */
  upsert(input: DraftInput): Promise<DraftMetadata>;

  /**
   * Upserts the active draft only if the provided cursor matches the
   * current active draft state.
   *
   * @param {DraftInput} input - Draft payload to upsert
   * @param {DraftConcurrencyExpectation} expectation - Last-seen draft cursor
   * @returns {Promise<DraftMetadata>} The created or updated draft
   */
  upsertIfUnchanged(
    input: DraftInput,
    expectation: DraftConcurrencyExpectation,
  ): Promise<DraftMetadata>;

  /**
   * Returns the latest active draft for a locale+slug pair, or null.
   * @param {string} locale - Locale code (e.g. 'en')
   * @param {string} slug - Content slug path
   * @returns {Promise<DraftMetadata | null>} Active draft or null
   */
  findActive(locale: string, slug: string): Promise<DraftMetadata | null>;

  /**
   * Archives the active draft for a locale+slug pair.
   *
   * @param {string} locale - Locale code
   * @param {string} slug - Content slug path
   * @returns {Promise<boolean>} True if a draft was archived, false if none existed
   */
  archive(locale: string, slug: string): Promise<boolean>;
}

/**
 * Resolved draft repository instance, backed by PostgreSQL.
 *
 * @property {DraftRepository} draftRepository - Singleton draft repository
 */
export const draftRepository: DraftRepository = pgDraftRepository;
