/**
 * @fileoverview Deploy-time write guard for the shared database.
 * @description Preview and branch deploys share one database with production,
 * so a schema migration or a seed run from a test environment lands on live
 * data.
 *
 * @module scripts/db/pg/deployGuard
 * @author Typeir
 * @version 1.0.0
 * @since 8.0.0
 */

import { createLogger } from '@/lib/logging/logger';

const log = createLogger({ script: 'deployGuard' });

/** Set to `1` to permit a write from a non-production deploy, deliberately. */
const OVERRIDE = 'ALLOW_DB_WRITES';

/**
 * Whether this process is a Vercel build or function.
 *
 * @returns {boolean} True on Vercel
 */
function onVercel(): boolean {
  return process.env['VERCEL'] === '1';
}

/**
 * Whether the deploy targets production.
 *
 * @returns {boolean} True when the deploy is the production one
 */
function isProductionDeploy(): boolean {
  const env = process.env['VERCEL_ENV'];
  if (env) return env === 'production';

  return process.env['VERCEL_GIT_COMMIT_REF'] === 'main';
}

/**
 * Stops a database write that a non-production deploy should not perform.
 *
 * @param {string} operation - What was about to run, for the log line
 * @returns {void}
 *
 * @example
 * guardDeployWrites('metadata seed');
 * // on a preview deploy: logs and exits 0 before touching the database
 */
export function guardDeployWrites(operation: string): void {
  if (!onVercel()) return;

  if (process.env[OVERRIDE] === '1') {
    log.warning(`⚠️  ${operation} permitted on a non-production deploy`, {
      override: OVERRIDE,
      branch: process.env['VERCEL_GIT_COMMIT_REF'] ?? '(unknown)',
    });
    return;
  }

  if (isProductionDeploy()) return;

  log.message(`⏭  Skipping ${operation} — not a production deploy`, {
    vercelEnv: process.env['VERCEL_ENV'] ?? '(unset)',
    branch: process.env['VERCEL_GIT_COMMIT_REF'] ?? '(unknown)',
    override: `set ${OVERRIDE}=1 to run it anyway`,
  });
  process.exit(0);
}
