#!/usr/bin/env tsx
/**
 * @fileoverview Postinstall bootstrap, run after `npm install`. Skips when
 * `PAW_SKIP_POSTINSTALL=1` or in CI unless `PAW_FORCE_POSTINSTALL=1`.
 * Exits 0 when `PAW_CLI` is missing.
 *
 * @module scripts/bootstrap/postinstall
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
 * True when the bootstrap should be skipped.
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
 * Invokes `node .github/PAW/dist/cli.mjs sync`, then exits 0.
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
