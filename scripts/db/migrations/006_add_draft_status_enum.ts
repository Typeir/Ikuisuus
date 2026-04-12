/**
 * @fileoverview Migration 006 — Add draft_status enum
 * @description Converts `drafts.status` from unconstrained `text` to a native
 * PostgreSQL enum type and introduces the `pending` status for non-admin
 * submissions that require review before becoming visible.
 *
 * Status semantics after migration:
 *   active   — Current editing candidate; shown by DraftOverlay; auto-archived on revalidation.
 *   pending  — Submitted by a non-admin user; NOT auto-archived; awaits review/approval.
 *   archived — Retired after successful ISR revalidation or manual rejection.
 *
 * The partial unique index on `(locale, slug) WHERE status = 'active'` is
 * intentionally NOT extended to `pending`. Multiple editors may queue
 * concurrent corrections for the same slug; only one active draft is allowed.
 *
 * @module scripts/db/migrations/006_add_draft_status_enum
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

import type { PoolClient } from 'pg';

/**
 * Applies the migration: creates the `draft_status` enum type, converts the
 * `drafts.status` column, and rebuilds the affected indexes.
 * Each statement is issued as a separate query so the column type is fully
 * committed before the index predicate is evaluated.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called).
 * @returns {Promise<void>}
 */
export async function up(client: PoolClient): Promise<void> {
  await client.query(
    `CREATE TYPE draft_status AS ENUM ('active', 'pending', 'archived')`,
  );

  await client.query(`DROP INDEX IF EXISTS drafts_one_active_per_slug_idx`);
  await client.query(`DROP INDEX IF EXISTS drafts_locale_slug_status_idx`);

  await client.query(`ALTER TABLE drafts ALTER COLUMN status DROP DEFAULT`);

  await client.query(
    `ALTER TABLE drafts
       ALTER COLUMN status TYPE draft_status
       USING status::draft_status`,
  );

  await client.query(
    `ALTER TABLE drafts ALTER COLUMN status SET DEFAULT 'active'::draft_status`,
  );

  await client.query(
    `CREATE INDEX IF NOT EXISTS drafts_locale_slug_status_idx
       ON drafts (locale, slug, status)`,
  );

  await client.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS drafts_one_active_per_slug_idx
       ON drafts (locale, slug) WHERE status = 'active'::draft_status`,
  );
}

/**
 * Reverses the migration: converts `drafts.status` back to plain `text`,
 * drops the `draft_status` enum type, and restores the original text-based
 * indexes.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called).
 * @returns {Promise<void>}
 */
export async function down(client: PoolClient): Promise<void> {
  await client.query(`DROP INDEX IF EXISTS drafts_one_active_per_slug_idx`);
  await client.query(`DROP INDEX IF EXISTS drafts_locale_slug_status_idx`);

  await client.query(`ALTER TABLE drafts ALTER COLUMN status DROP DEFAULT`);

  await client.query(
    `ALTER TABLE drafts
       ALTER COLUMN status TYPE text
       USING status::text`,
  );

  await client.query(
    `ALTER TABLE drafts ALTER COLUMN status SET DEFAULT 'active'`,
  );

  await client.query(`DROP TYPE IF EXISTS draft_status`);

  await client.query(
    `CREATE INDEX IF NOT EXISTS drafts_locale_slug_status_idx
       ON drafts (locale, slug, status)`,
  );

  await client.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS drafts_one_active_per_slug_idx
       ON drafts (locale, slug) WHERE status = 'active'`,
  );
}
