/**
 * @fileoverview Migration 009 — Create audit_logs + banned_ips tables
 * @description Adds persistence tables for the audit trail and IP ban system,
 * replacing the previous Vercel Edge Config KV storage with portable PostgreSQL.
 *
 * @module scripts/db/migrations/009_create_audit_and_banned_ips_tables
 */

import type { PoolClient } from 'pg';

/**
 * Applies the migration: creates `audit_logs` and `banned_ips` tables
 * with supporting indexes.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called).
 * @returns {Promise<void>}
 */
export async function up(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id              serial       PRIMARY KEY,
      content_path    text         NOT NULL,
      base_sha        text         NOT NULL,
      pr_url          text,
      status          text         NOT NULL,
      token_id        text         NOT NULL,
      timestamp       timestamptz  NOT NULL DEFAULT now()
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS banned_ips (
      id              serial       PRIMARY KEY,
      range           text         NOT NULL UNIQUE,
      reason          text         NOT NULL,
      banned_at       timestamptz  NOT NULL DEFAULT now(),
      source_ip       text
    )
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS audit_logs_timestamp_idx
      ON audit_logs (timestamp DESC)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS audit_logs_token_id_idx
      ON audit_logs (token_id)
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS banned_ips_range_idx
      ON banned_ips (range)
  `);
}

/**
 * Reverses the migration: drops both tables and their indexes.
 *
 * @param {PoolClient} client - Transactional pg client (BEGIN already called).
 * @returns {Promise<void>}
 */
export async function down(client: PoolClient): Promise<void> {
  await client.query(`DROP INDEX IF EXISTS banned_ips_range_idx`);
  await client.query(`DROP TABLE IF EXISTS banned_ips`);

  await client.query(`DROP INDEX IF EXISTS audit_logs_token_id_idx`);
  await client.query(`DROP INDEX IF EXISTS audit_logs_timestamp_idx`);
  await client.query(`DROP TABLE IF EXISTS audit_logs`);
}
