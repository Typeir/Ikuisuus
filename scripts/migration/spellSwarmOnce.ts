/**
 * @fileoverview Cron-less entry point for debugging the spell swarm.
 * Runs a single batch and exits, or loops continuously at a given interval.
 *
 * Usage:
 *   npx tsx scripts/migration/spellSwarmOnce.ts               # single batch of 3
 *   npx tsx scripts/migration/spellSwarmOnce.ts 10            # single batch of 10
 *   npx tsx scripts/migration/spellSwarmOnce.ts 10 60000      # loop: batch 10, every 60s
 *
 * @module scripts/migration/spellSwarmOnce
 * @version 2.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { runLoop, runOnce } from './spellSwarm/runOnce';

const batchSize = parseInt(process.argv[2] ?? '3', 10);
const intervalMs = process.argv[3] ? parseInt(process.argv[3], 10) : null;

const task =
  intervalMs !== null ? runLoop(batchSize, intervalMs) : runOnce(batchSize);

task.catch((error: unknown) => {
  console.error('Fatal:', error);
  process.exit(1);
});
