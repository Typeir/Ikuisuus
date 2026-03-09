/**
 * @fileoverview Prisma CLI Configuration
 * @description Configures the Prisma CLI for schema location, migration paths,
 * and database connection. Used by `prisma migrate`, `prisma generate`, and
 * `prisma studio`. Application code instantiates PrismaClient separately via
 * `src/lib/db/prisma/client.ts`.
 *
 * Loads `.env.local` first, then falls back to `.env`, then system environment.
 * DATABASE_URL must be set before running any `db:*` or `prisma:*` commands.
 *
 * @see https://www.prisma.io/docs/orm/reference/prisma-config-reference
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { defineConfig } from 'prisma/config';

// Load .env.local first (Next.js convention), then .env as fallback.
// process.env wins over file values — existing env vars are never overwritten.
dotenv.config({ path: path.resolve(__dirname, '.env.local') });
dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  schema: 'prisma/sql/schema.prisma',
  datasource: {
    // If DATABASE_URL is not set (e.g. during `prisma generate` in CI),
    // provide an empty string so the CLI doesn't throw on module load.
    url: process.env.DATABASE_URL ?? '',
  },
});
