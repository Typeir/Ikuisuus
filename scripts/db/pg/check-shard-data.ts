/**
 * @fileoverview Checks shard data in PostgreSQL.
 *
 * Queries bloodline_boons, vocation_features, specialization_features, and
 * feat_features tables for row counts and rows with null line anchors
 * (start_line / end_line).
 *
 * @module check-shard-data
 * @version 1.0.0
 * @since 1.0.0
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../');

try {
  const raw = readFileSync(join(ROOT, '.env.local'), 'utf8');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (t === '' || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    const val = t
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (process.env[key] === undefined) process.env[key] = val;
  }
} catch {
  /* absent */
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/**
 * Queries each shard-related table and prints counts and missing line anchors.
 *
 * @returns {Promise<void>}
 */
async function main(): Promise<void> {
  try {
    const r1 = await pool.query('SELECT COUNT(*)::int AS cnt FROM bloodline_boons');
    console.log('Total bloodline_boons:', r1.rows[0].cnt);

    const r2 = await pool.query(
      'SELECT COUNT(*)::int AS cnt FROM bloodline_boons WHERE start_line IS NULL OR end_line IS NULL',
    );
    console.log('  Missing line anchors:', r2.rows[0].cnt);

    const r3 = await pool.query('SELECT COUNT(*)::int AS cnt FROM vocation_features');
    console.log('Total vocation_features:', r3.rows[0].cnt);

    const r4 = await pool.query(
      'SELECT COUNT(*)::int AS cnt FROM vocation_features WHERE start_line IS NULL OR end_line IS NULL',
    );
    console.log('  Missing line anchors:', r4.rows[0].cnt);

    const r5 = await pool.query(
      'SELECT COUNT(*)::int AS cnt FROM specialization_features',
    );
    console.log('Total specialization_features:', r5.rows[0].cnt);

    const r6 = await pool.query(
      'SELECT COUNT(*)::int AS cnt FROM specialization_features WHERE start_line IS NULL OR end_line IS NULL',
    );
    console.log('  Missing line anchors:', r6.rows[0].cnt);

    const r7 = await pool.query('SELECT COUNT(*)::int AS cnt FROM feat_features');
    console.log('Total feat_features:', r7.rows[0].cnt);

    const r8 = await pool.query(
      'SELECT COUNT(*)::int AS cnt FROM feat_features WHERE start_line IS NULL OR end_line IS NULL',
    );
    console.log('  Missing line anchors:', r8.rows[0].cnt);

    const r9 = await pool.query(`
      SELECT b.name, bl.slug AS bloodline
      FROM bloodline_boons b
      JOIN bloodlines bl ON b.bloodline_id = bl.id
      WHERE bl.slug = 'bilupine'
      ORDER BY b.sort_order
    `);
    console.log('\nBilupine boons sample:', r9.rows);

  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('DB Error:', message);
  } finally {
    await pool.end();
  }
}

main().catch((e: unknown) => {
  console.error('Fatal:', e instanceof Error ? e.message : String(e));
  process.exit(1);
});
