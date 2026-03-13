// @ts-check

/**
 * Full-Size Asset Cleanup Script
 *
 * @fileoverview Removes the full-size image source folder after build completion.
 * Safety mechanism prevents execution outside Vercel environment to avoid accidental
 * deletion of local development assets.
 *
 * @module cleanFullSize
 * @version 1.0.0
 * @since 1.0.0
 *
 * @requires fs Node.js file system module
 * @requires path Node.js path utilities
 *
 * @description
 * Executed as a post-build step in Vercel deployments. The full-size images
 * are compressed to WebP during pre-init, making the originals unnecessary
 * in the deployed build. This reduces deployment size.
 *
 * Environment Variables:
 * - VERCEL: Must be set to '1' for script to execute
 *
 * @example
 * // In package.json
 * "scripts": {
 *   "vercel-build": "npm run build && npm run clean-fullsize"
 * }
 */

const fs = require('fs');
const path = require('path');
const { createLogger } = require('../core/logger.cjs');
const log = createLogger({ script: 'cleanFullSize' });

/** Absolute path to the full-size source image folder */
const fullSizePath = path.join(process.cwd(), 'public', 'full-size');

if (process.env.VERCEL !== '1') {
  log.message('🚫 Skipping cleanup: not running in Vercel');
  process.exit(0);
}

try {
  if (fs.existsSync(fullSizePath)) {
    fs.rmSync(fullSizePath, { recursive: true, force: true });
    log.message('🧹 Removed public/full-size (Vercel post-build cleanup)');
  } else {
    log.message('✅ No full-size folder to remove');
  }
} catch (err) {
  log.error('✖ Error cleaning full-size folder', {
    error: err.message || String(err),
  });
  process.exit(1);
}
