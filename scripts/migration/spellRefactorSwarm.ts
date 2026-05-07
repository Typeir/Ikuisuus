/**
 * @fileoverview Entry point for the spell lore-refactor swarm.
 * Delegates to the spellRefactorSwarm/ module for all implementation.
 *
 * Run with:
 *   npx tsx scripts/migration/spellRefactorSwarm.ts          (CRON mode)
 *   npx tsx scripts/migration/spellRefactorSwarm.ts --once   (single batch of 5)
 *   npx tsx scripts/migration/spellRefactorSwarm.ts --once=20 (single batch of N)
 *
 * @module scripts/migration/spellRefactorSwarm
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { run, runOnce } from './spellRefactorSwarm/index';

const args = process.argv.slice(2);
const onceArg = args.find((a) => a.startsWith('--once'));

if (onceArg !== undefined) {
  const match = onceArg.match(/^--once(?:=(\d+))?$/);
  const batchSize = match?.[1] ? parseInt(match[1], 10) : 5;
  runOnce(batchSize)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal:', err);
      process.exit(1);
    });
} else {
  run();
}
