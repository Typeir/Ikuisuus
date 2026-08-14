/**
 * @fileoverview Migration 020 — vocations.hit_die text → integer
 * @description Converts `vocations.hit_die` from die-notation text (`'d12'`) to
 * an integer face count (`12`). Idempotent: skipped when the column is already
 * integer. A `USING` clause extracts digits, turning digit-less rows into 0.
 * After applying, run `npm run db:seed` to refresh content from the regenerated
 * `.metadata.json` sidecars.
 *
 * @module scripts/db/migrations/020_hit_die_to_integer
 * @author Typeir
 * @version 1.0.0
 * @since 10.0.0
 */

import type { PoolClient } from 'pg';

/**
 * Reads the declared data type of a column in the public schema.
 *
 * @param {PoolClient} client - Transactional pg client
 * @param {string} table - Table name
 * @param {string} column - Column name
 * @returns {Promise<string | null>} The `data_type`, or `null` when absent
 */
async function columnType(
  client: PoolClient,
  table: string,
  column: string,
): Promise<string | null> {
  const result = await client.query<{ data_type: string }>(
    `SELECT data_type FROM information_schema.columns
     WHERE table_name = $1 AND column_name = $2`,
    [table, column],
  );
  return result.rows[0]?.data_type ?? null;
}

/**
 * Applies migration 020: rewrites `vocations.hit_die` as an integer face count,
 * salvaging the digits of each existing notation string.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called by the runner).
 * @returns {Promise<void>}
 */
export async function up(client: PoolClient): Promise<void> {
  const type = await columnType(client, 'vocations', 'hit_die');
  if (type === null || type === 'integer') return;

  await client.query(
    `ALTER TABLE vocations
       ALTER COLUMN hit_die DROP DEFAULT,
       ALTER COLUMN hit_die TYPE integer
         USING COALESCE(NULLIF(regexp_replace(hit_die, '\\D', '', 'g'), '')::integer, 0),
       ALTER COLUMN hit_die SET DEFAULT 0`,
  );
}

/**
 * Reverts migration 020: restores `vocations.hit_die` to `d{faces}` notation
 * held as text. A stored 0 becomes `'unknown'`, the sentinel the old generator
 * emitted for a vocation with no parseable die.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called by the runner).
 * @returns {Promise<void>}
 */
export async function down(client: PoolClient): Promise<void> {
  const type = await columnType(client, 'vocations', 'hit_die');
  if (type !== 'integer') return;

  await client.query(
    `ALTER TABLE vocations
       ALTER COLUMN hit_die DROP DEFAULT,
       ALTER COLUMN hit_die TYPE text
         USING CASE WHEN hit_die = 0 THEN 'unknown' ELSE 'd' || hit_die::text END,
       ALTER COLUMN hit_die SET DEFAULT 'unknown'`,
  );
}
