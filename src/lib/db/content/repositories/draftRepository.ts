/**
 * @fileoverview Draft Repository Port + Factory
 * @description Defines the hexagonal port contract for draft persistence
 * and exports a factory-resolved instance. Unlike content metadata repos
 * that switch between fs/pg, drafts always use PG since they represent
 * transient editor state (not filesystem artifacts).
 *
 * @module lib/db/content/repositories/draftRepository
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

import { pgDraftRepository } from '../adapters/pg/pgDraftRepository';
import type {
  DraftConcurrencyExpectation,
  DraftInput,
  DraftMetadata,
} from '../schemas/draftMetadata';

/**
 * Repository contract for draft persistence.
 *
 * Implementations handle the active/archived lifecycle and ensure at most
 * one active draft exists per locale+slug pair (upsert semantics).
 */
export interface DraftRepository {
  /**
   * Creates or replaces the active draft for a locale+slug pair.
   * If an active draft already exists, its content and updatedAt are updated.
   *
   * @param {DraftInput} input - Draft content to upsert
   * @returns {Promise<DraftMetadata>} The created or updated draft
   */
  upsert(input: DraftInput): Promise<DraftMetadata>;

  /**
   * Creates or updates the active draft only if the provided cursor matches
   * the current active draft state.
   *
   * Use this to prevent stale concurrent editor submissions from overwriting
   * newer draft state.
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
   *
   * @param {string} locale - Locale code (e.g. 'en')
   * @param {string} slug - Content slug path
   * @returns {Promise<DraftMetadata | null>} Active draft or null
   */
  findActive(locale: string, slug: string): Promise<DraftMetadata | null>;

  /**
   * Archives the active draft for a locale+slug pair.
   * Sets status to 'archived'. No-op if no active draft exists.
   *
   * @param {string} locale - Locale code
   * @param {string} slug - Content slug path
   * @returns {Promise<boolean>} True if a draft was archived, false if none existed
   */
  archive(locale: string, slug: string): Promise<boolean>;
}

/**
 * Resolved draft repository instance.
 * Drafts are always backed by PostgreSQL — no filesystem adapter needed.
 *
 * @property {DraftRepository} draftRepository - Singleton draft repository
 */
export const draftRepository: DraftRepository = pgDraftRepository;
