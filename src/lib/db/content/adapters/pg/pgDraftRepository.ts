/**
 * @fileoverview PostgreSQL Draft Repository (MikroORM)
 * @description Implements `DraftRepository` via MikroORM `EntityManager`
 * against the `drafts` table. Enforces single-active-draft-per-slug
 * semantics using upsert logic and handles archival on revalidation.
 *
 * @module lib/db/content/adapters/pg/pgDraftRepository
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

import { DraftEntity } from '@/lib/db/orm/entities/DraftEntity';
import { getEM } from '@/lib/db/orm/orm';
import { logger } from '@/lib/logging/logger';
import { contentHash } from '@/lib/metadata/contentHash';
import type { DraftRepository } from '../../repositories/draftRepository';
import type {
  DraftConcurrencyExpectation,
  DraftInput,
  DraftMetadata,
} from '../../schemas/draftMetadata';

const log = logger.child({ module: 'PGDraftRepo' });

/**
 * Creates a stale-concurrency error.
 *
 * @returns {Error & { code: string }} Error with `code = 'STALE_DRAFT'`
 */
const createStaleDraftError = (): Error & { code: string } => {
  return Object.assign(
    new Error('Draft has changed since the editor loaded it'),
    {
      code: 'STALE_DRAFT',
    },
  );
};

/**
 * Checks whether a draft row satisfies a caller-provided concurrency cursor.
 *
 * @param {DraftEntity | null} existing - Current active draft row
 * @param {DraftConcurrencyExpectation} expectation - Last-seen cursor
 * @returns {boolean} True when expectation matches current state
 */
const matchesExpectation = (
  existing: DraftEntity | null,
  expectation: DraftConcurrencyExpectation,
): boolean => {
  const hasUpdatedAtExpectation = expectation.updatedAt !== undefined;
  const hasHashExpectation = expectation.versionHash !== undefined;

  if (!hasUpdatedAtExpectation && !hasHashExpectation) {
    return true;
  }

  const expectedUpdatedAt = expectation.updatedAt ?? null;
  const expectedHash = expectation.versionHash ?? null;

  if (!existing) {
    return expectedUpdatedAt === null && expectedHash === null;
  }

  const currentUpdatedAt = existing.updatedAt.toISOString();
  const currentHash = existing.versionHash ?? null;

  if (hasUpdatedAtExpectation && expectedUpdatedAt !== currentUpdatedAt) {
    return false;
  }

  if (hasHashExpectation && expectedHash !== currentHash) {
    return false;
  }

  return true;
};

/**
 * Maps a DraftEntity row to the domain DraftMetadata shape.
 *
 * @param {DraftEntity} row - MikroORM entity instance
 * @returns {DraftMetadata} Domain draft object with ISO date strings
 */
const rowToDraft = (row: DraftEntity): DraftMetadata => ({
  id: row.id,
  locale: row.locale,
  slug: row.slug,
  content: row.content,
  status: row.status,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
  versionHash: row.versionHash ?? null,
});

/**
 * PostgreSQL implementation of the DraftRepository port.
 *
 * Uses MikroORM EntityManager for all persistence operations.
 * Each method forks a fresh EntityManager.
 */
export const pgDraftRepository: DraftRepository = {
  /**
   * Creates or replaces the active draft for a locale+slug pair.
   *
   * @param {DraftInput} input - Draft content to upsert
   * @param {string} input.locale - Content locale
   * @param {string} input.slug - Content slug path
   * @param {string} input.content - Raw MDX content
   * @param {DraftStatus} [input.status] - Override lifecycle status; defaults to 'active'
   * @returns {Promise<DraftMetadata>} The created or updated draft
   */
  async upsert(input: DraftInput): Promise<DraftMetadata> {
    const em = await getEM();
    const hash = contentHash({
      locale: input.locale,
      slug: input.slug,
      content: input.content,
    });

    try {
      const existing = await em.findOne(DraftEntity, {
        locale: input.locale,
        slug: input.slug,
        status: 'active',
      });

      if (existing) {
        existing.content = input.content;
        existing.versionHash = hash;
        existing.updatedAt = new Date();
        await em.flush();

        log.message('Updated existing draft', {
          id: existing.id,
          locale: input.locale,
          slug: input.slug,
        });

        return rowToDraft(existing);
      }

      const draft = em.create(DraftEntity, {
        locale: input.locale,
        slug: input.slug,
        content: input.content,
        status: input.status ?? 'active',
        versionHash: hash,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await em.flush();

      log.message('Created new draft', {
        id: draft.id,
        locale: input.locale,
        slug: input.slug,
        status: draft.status,
      });

      return rowToDraft(draft);
    } catch (err) {
      log.error('Failed to upsert draft', {
        locale: input.locale,
        slug: input.slug,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  },

  /**
   * Creates or updates an active draft using optimistic concurrency checks.
   *
   * @param {DraftInput} input - Draft payload to upsert
   * @param {DraftConcurrencyExpectation} expectation - Last-seen draft cursor
   * @returns {Promise<DraftMetadata>} Updated or created draft
   */
  async upsertIfUnchanged(
    input: DraftInput,
    expectation: DraftConcurrencyExpectation,
  ): Promise<DraftMetadata> {
    const em = await getEM();
    const hash = contentHash({
      locale: input.locale,
      slug: input.slug,
      content: input.content,
    });

    try {
      return await em.transactional(async (tx) => {
        const existing = await tx.findOne(DraftEntity, {
          locale: input.locale,
          slug: input.slug,
          status: 'active',
        });

        if (!matchesExpectation(existing, expectation)) {
          throw createStaleDraftError();
        }

        if (existing) {
          const nextStatus = input.status ?? existing.status;
          const originalUpdatedAt = existing.updatedAt;
          const now = new Date();

          const affected = await tx.nativeUpdate(
            DraftEntity,
            {
              id: existing.id,
              updatedAt: originalUpdatedAt,
              status: 'active',
            },
            {
              content: input.content,
              versionHash: hash,
              status: nextStatus,
              updatedAt: now,
            },
          );

          if (affected === 0) {
            throw createStaleDraftError();
          }

          const updated = await tx.findOne(DraftEntity, { id: existing.id });
          if (!updated) {
            throw new Error('Draft update completed but row was not found');
          }

          return rowToDraft(updated);
        }

        const draft = tx.create(DraftEntity, {
          locale: input.locale,
          slug: input.slug,
          content: input.content,
          status: input.status ?? 'active',
          versionHash: hash,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        try {
          await tx.flush();
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (message.includes('drafts_one_active_per_slug_idx')) {
            throw createStaleDraftError();
          }
          throw err;
        }

        return rowToDraft(draft);
      });
    } catch (err) {
      if ((err as { code?: string }).code === 'STALE_DRAFT') {
        throw err;
      }

      log.error('Failed to upsert draft with concurrency expectation', {
        locale: input.locale,
        slug: input.slug,
        expectation,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  },

  /**
   * Returns the latest active draft for a locale+slug pair.
   *
   * @param {string} locale - Locale code
   * @param {string} slug - Content slug path
   * @returns {Promise<DraftMetadata | null>} Active draft or null
   */
  async findActive(
    locale: string,
    slug: string,
  ): Promise<DraftMetadata | null> {
    const em = await getEM();

    try {
      const row = await em.findOne(DraftEntity, {
        locale,
        slug,
        status: 'active',
      });

      return row ? rowToDraft(row) : null;
    } catch (err) {
      log.error('Failed to find active draft', {
        locale,
        slug,
        error: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  },

  /**
   * Archives the active draft for a locale+slug pair.
   *
   * @param {string} locale - Locale code
   * @param {string} slug - Content slug path
   * @returns {Promise<boolean>} True if a draft was archived
   */
  async archive(locale: string, slug: string): Promise<boolean> {
    const em = await getEM();

    try {
      const row = await em.findOne(DraftEntity, {
        locale,
        slug,
        status: 'active',
      });

      if (!row) {
        log.message('No active draft to archive', { locale, slug });
        return false;
      }

      row.status = 'archived';
      row.updatedAt = new Date();
      await em.flush();

      log.message('Archived draft', { id: row.id, locale, slug });
      return true;
    } catch (err) {
      log.error('Failed to archive draft', {
        locale,
        slug,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  },
};
