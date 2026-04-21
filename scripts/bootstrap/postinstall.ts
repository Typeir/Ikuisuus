#!/usr/bin/env tsx
/**
 * @fileoverview Postinstall bootstrap — runs automatically after `npm install`.
 *
 * Idempotently syncs PAW framework artifacts so a fresh clone is functional
 * with zero manual steps:
 *
 *   1. Ensures `.paw/node_modules/sql.js/` is populated (sql.js can't be
 *      ESM-bundled, so it is copied from the framework's `node_modules`).
 *   2. Runs `paw sync` via the compiled CLI at `.github/PAW/dist/cli.mjs`
 *      (idempotent — copies hook bundles into `.paw/hooks/` and writes
 *      `.github/hooks/hooks.json`).
 *   3. Initialises `.paw/paw.sqlite` on first run.
 *
 * Guarded so CI environments can opt out via `PAW_SKIP_POSTINSTALL=1`.
 * When the compiled CLI is missing (e.g. framework checked out as submodule
 * before first build), logs a clear remediation hint instead of failing.
 *
 * @module bootstrap/postinstall
 * @author Typeir

 * @version 1.0.0
 * @since 3.0.0
 */

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Absolute path to the repository root (two levels up from this script).
 */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * Absolute path to the compiled PAW CLI entry point.
 */
const PAW_CLI = resolve(REPO_ROOT, '.github', 'PAW', 'dist', 'cli.mjs');

/**
 * Whether the bootstrap should be skipped (CI opt-out or explicit flag).
 * @returns {boolean}
 */
function shouldSkip(): boolean {
  if (process.env.PAW_SKIP_POSTINSTALL === '1') {
    return true;
  }
  if (process.env.CI === '1' && process.env.PAW_FORCE_POSTINSTALL !== '1') {
    return true;
  }
  return false;
}

/**
 * Entry point — invokes `node .github/PAW/dist/cli.mjs sync` and exits with 0
 * on all outcomes except catastrophic failure. Never blocks `npm install`.
 * @returns {void}
 */
function main(): void {
  if (shouldSkip()) {
    process.stdout.write(
      '[postinstall] PAW bootstrap skipped (CI or PAW_SKIP_POSTINSTALL=1).\n',
    );
    return;
  }

  if (!existsSync(PAW_CLI)) {
    process.stdout.write(
      `[postinstall] PAW CLI not found at ${PAW_CLI}.\n` +
        '[postinstall] Run `node .github/PAW/build.mjs` from the repo root, ' +
        'then re-run `npm install`.\n',
    );
    return;
  }

  const result = spawnSync('node', [PAW_CLI, 'sync'], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
    env: { ...process.env },
  });

  if (result.status !== 0) {
    process.stdout.write(
      `[postinstall] PAW sync exited with status ${result.status}. ` +
        'Install will continue; run `npm run paw:status` for diagnostics.\n',
    );
  }
}

main();
