/**
 * @fileoverview Migration 021 — Add specialization ownership to spell lists
 * @description Adds a nullable `specialization text` column to `spell_lists`,
 * matching `SpellListEntity.specialization`. A spell list may belong to a
 * vocation (`Wizard`, `Revenant`) or to a single specialization (`Want of
 * Knowledge`); specialization lists are far smaller — commonly a quarter the
 * size — and live inside the specialization's own MDX file rather than a
 * standalone `spells.list.mdx`. The column records the owning specialization's
 * slug so both backends can distinguish the two kinds of list without parsing
 * `link` at read time, keeping the pg adapter at parity with the filesystem
 * adapter.
 *
 * Nullable because vocation lists — the large majority of rows — own no
 * specialization. The metadata generator emits `specialization` only when a
 * spell's "Spell Lists" footer links a `.specialization` page.
 *
 * Existing rows are backfilled from `link`, which already encodes the owner, so
 * no re-seed is required to populate the column. A later
 * `npx tsx scripts/db/pg/seed-from-fs.ts` remains the way to pick up new list
 * memberships from the `.metadata.json` sidecars.
 *
 * @module scripts/db/migrations/021_add_specialization_to_spell_lists
 * @author Typeir
 * @version 1.0.0
 * @since 10.0.0
 */

import type { PoolClient } from 'pg';

/**
 * Applies migration 021: adds `spell_lists.specialization` and backfills it for
 * rows whose `link` targets a `.specialization` page, deriving the slug from the
 * link's basename (`…/want-of-knowledge.specialization` → `want-of-knowledge`).
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called by the runner).
 * @returns {Promise<void>}
 */
export async function up(client: PoolClient): Promise<void> {
  await client.query(`
    ALTER TABLE IF EXISTS spell_lists
      ADD COLUMN IF NOT EXISTS specialization text
  `);

  await client.query(`
    UPDATE spell_lists
       SET specialization = substring(link from '([^/]+)[.]specialization$')
     WHERE specialization IS NULL
       AND link LIKE '%.specialization'
  `);
}

/**
 * Reverts migration 021: drops the `specialization` column. The ownership data
 * is recoverable from `link`, so no data is permanently lost.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called by the runner).
 * @returns {Promise<void>}
 */
export async function down(client: PoolClient): Promise<void> {
  await client.query(`
    ALTER TABLE IF EXISTS spell_lists
      DROP COLUMN IF EXISTS specialization
  `);
}
