/**
 * @fileoverview Cron-less single-batch runner for local debugging.
 * Executes one batch of unprocessed spells and exits — no scheduler involved.
 *
 * @module scripts/migration/spellSwarm/runOnce
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import fs from 'fs/promises';
import path from 'path';
import { launchAgent } from './agent';
import { initSwarmWorktree, pushSwarmBranch, SWARM_BRANCH } from './git';
import { configureStatePath, loadState, saveState } from './state';
import type { SpellEntry } from './types';

const SPELLS_JSON = path.resolve(
  'scripts',
  'core',
  'spells-external.metadata.json',
);
const STATE_FILE = path.resolve(
  'scripts',
  'migration',
  'spellSwarm.state.json',
);
const CONTENT_DIR = path.resolve('src', 'content', 'en', 'spells');

const log = createLogger({ script: 'spellSwarmOnce' });

/**
 * Runs a single batch of unprocessed spells without starting the CRON scheduler.
 * Designed for local debugging and manual one-shot migrations.
 *
 * @param {number} [batchSize=3] - Number of spells to process in this run.
 * @returns {Promise<void>}
 */
export const runOnce = async (batchSize = 3): Promise<void> => {
  configureStatePath(STATE_FILE);

  const raw = await fs.readFile(SPELLS_JSON, 'utf-8');
  const allSpells = JSON.parse(raw) as SpellEntry[];
  log.message(`Loaded ${allSpells.length} external spell entries.`, {
    source: SPELLS_JSON,
  });

  await fs.mkdir(CONTENT_DIR, { recursive: true });

  const state = await loadState();
  const processed = new Set(state.processedSlugs);
  const unprocessed = allSpells.filter((s) => !processed.has(s.slug));

  log.message(
    `${processed.size} already processed. ${unprocessed.length} remaining.`,
    { branch: SWARM_BRANCH },
  );

  if (unprocessed.length === 0) {
    log.message('All spells processed. Nothing to do.');
    return;
  }

  await initSwarmWorktree();
  log.message('Worktree ready.');

  const batch = unprocessed.slice(0, batchSize);
  log.message(
    `Starting batch of ${batch.length}: [${batch.map((s) => s.slug).join(', ')}]`,
  );

  await Promise.all(batch.map((entry) => launchAgent(entry, CONTENT_DIR)));

  await pushSwarmBranch();
  log.message('Batch pushed to origin.');

  state.processedSlugs.push(...batch.map((s) => s.slug));
  await saveState(state);

  log.message(
    `Done. ${state.processedSlugs.length}/${allSpells.length} spells committed.`,
  );
};

/**
 * Runs batches continuously on a fixed interval until all spells are processed.
 * Exits cleanly when the queue is empty.
 *
 * @param {number} [batchSize=10] - Spells per batch.
 * @param {number} [intervalMs=60000] - Milliseconds between batches.
 * @returns {Promise<void>}
 */
export const runLoop = async (
  batchSize = 10,
  intervalMs = 60_000,
): Promise<void> => {
  configureStatePath(STATE_FILE);

  const raw = await fs.readFile(SPELLS_JSON, 'utf-8');
  const total = (JSON.parse(raw) as SpellEntry[]).length;

  log.message(
    `Loop started. Batch: ${batchSize}, interval: ${intervalMs}ms, total: ${total}.`,
  );

  await initSwarmWorktree();
  log.message('Worktree ready.');

  const tick = async (): Promise<boolean> => {
    await runOnce(batchSize);
    const state = await loadState();
    return state.processedSlugs.length >= total;
  };

  if (await tick()) {
    log.message('All spells processed on first tick. Exiting.');
    return;
  }

  await new Promise<void>((resolve) => {
    const id = setInterval(async () => {
      try {
        const done = await tick();
        if (done) {
          clearInterval(id);
          log.message('All spells processed. Loop complete.');
          resolve();
        }
      } catch (error) {
        log.error('Tick error', { error: String(error) });
      }
    }, intervalMs);
  });
};
