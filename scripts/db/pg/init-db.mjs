/**
 * @fileoverview PostgreSQL Database Initialisation Script (Prisma)
 * @description Pushes the Prisma SQL schema to the Neon/Postgres database via
 * `prisma db push`, then applies supplementary indexes that Prisma cannot model
 * (expression-based COALESCE unique index, GIN indexes on tags arrays).
 *
 * Safe to run multiple times — `prisma db push` is idempotent, and supplementary
 * indexes use IF NOT EXISTS.
 *
 * Usage:
 *   node scripts/db/pg/init-db.mjs
 *
 * Required env:
 *   DATABASE_URL — Neon / Postgres connection string
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from '../../core/logger.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../../');
const log = createLogger({ script: 'init-db' });

/* ─────────────────────────  Env  ──────────────────────────────────── */

try {
  const raw = readFileSync(resolve(ROOT, '.env.local'), 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed
      .slice(eqIdx + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  /* .env.local absent — rely on system env */
}

if (!process.env.DATABASE_URL) {
  log.error('❌  DATABASE_URL is not set.');
  process.exit(1);
}

/* ───────────────────  Supplementary DDL  ──────────────────────────── */

/**
 * Indexes that Prisma cannot model declaratively.
 * Expression-based COALESCE unique index and GIN indexes on array columns.
 *
 * @type {string[]}
 */
const SUPPLEMENTARY_INDEXES = [
  `CREATE UNIQUE INDEX IF NOT EXISTS monsters_locale_display_slug_uidx
     ON monsters (locale, COALESCE(sub_slug, slug));`,
  `CREATE INDEX IF NOT EXISTS monsters_tags_gin_idx
     ON monsters USING GIN (tags);`,
  `CREATE INDEX IF NOT EXISTS heirlooms_tags_gin_idx
     ON heirlooms USING GIN (tags);`,
  `CREATE INDEX IF NOT EXISTS spells_tags_gin_idx
     ON spells USING GIN (tags);`,
  `CREATE INDEX IF NOT EXISTS trinkets_tags_gin_idx
     ON trinkets USING GIN (tags);`,
];

/* ─────────────────────────  Main  ─────────────────────────────────── */

async function main() {
  log.message('🔄  Pushing Prisma schema to database…');
  execSync(
    'npx prisma db push --schema prisma/sql/schema.prisma --skip-generate',
    { cwd: ROOT, stdio: 'inherit', env: { ...process.env } },
  );
  log.message('✅  Prisma schema pushed — all tables created (or updated).');

  log.message('🔄  Creating supplementary indexes…');
  const { PrismaClient } = await import(
    '../../../src/lib/db/prisma/generated/sql/index.js'
  );
  const prisma = new PrismaClient();

  try {
    for (const ddl of SUPPLEMENTARY_INDEXES) {
      await prisma.$executeRawUnsafe(ddl);
    }
    log.message('✅  Supplementary indexes created (or already existed).');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  log.error('❌  init-db failed:', err.message);
  process.exit(1);
});
