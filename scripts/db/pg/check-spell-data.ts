/**
 * @fileoverview Diagnostic script to check spell and spell_list data in PostgreSQL
 *
 * @module check-spell-data
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

try {
  const r1 = await pool.query('SELECT COUNT(*)::int as cnt FROM spells');
  console.log('Total spells:', r1.rows[0].cnt);

  const r2 = await pool.query('SELECT COUNT(*)::int as cnt FROM spell_lists');
  console.log('Total spell_lists:', r2.rows[0].cnt);

  const r3 = await pool.query(
    'SELECT DISTINCT name FROM spell_lists ORDER BY name',
  );
  console.log(
    'Spell list names:',
    r3.rows.map((r) => r.name),
  );

  const r4 = await pool.query(
    'SELECT slug FROM spells WHERE locale = $1 ORDER BY slug LIMIT 10',
    ['en'],
  );
  console.log(
    'Sample spell slugs:',
    r4.rows.map((r) => r.slug),
  );

  const r5 = await pool.query(
    'SELECT COUNT(*)::int as cnt FROM spells WHERE locale = $1',
    ['en'],
  );
  console.log('English spells:', r5.rows[0].cnt);

  const r6 = await pool.query(`
    SELECT sl.name, COUNT(*)::int as cnt
    FROM spell_lists sl
    JOIN spells s ON sl.spell_id = s.id
    WHERE s.locale = 'en'
    GROUP BY sl.name
    ORDER BY sl.name
  `);
  console.log('Spell lists by vocation:', r6.rows);

  const r7 = await pool.query(`
    SELECT s.slug, s.title, s.level, s.school
    FROM spells s
    WHERE s.locale = 'en'
    AND s.slug IN ('fireball', 'acid-splash', 'shield', 'cure-wounds', 'abominable-grasp')
  `);
  console.log('Known spell check:', r7.rows);
} catch (e: unknown) {
  const message = e instanceof Error ? e.message : String(e);
  console.error('DB Error:', message);
} finally {
  await pool.end();
}
