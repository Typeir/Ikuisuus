/**
 * Full-Size Asset Cleanup Script
 *
 * @fileoverview Removes the full-size image source folder after build completion.
 * Exits unless process.env.VERCEL === '1'.
 *
 * @module cleanFullSize
 * @version 1.0.0
 * @since 1.0.0
 *
 * @requires fs Node.js file system module
 * @requires path Node.js path utilities
 */

import { createLogger } from '@/lib/logging/logger';
import fs from 'fs';
import path from 'path';
import { getPublicFolder } from '@/lib/utils/getPublicFolder';

const log = createLogger({ script: 'cleanFullSize' });

/** Absolute path to the full-size source image folder */
const fullSizePath = path.join(getPublicFolder(), 'full-size');

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
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  log.error('✖ Error cleaning full-size folder', { error: message });
  process.exit(1);
}
