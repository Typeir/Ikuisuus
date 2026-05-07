/**
 * @fileoverview Orchestrator for the spell swarm migration.
 * Initializes the swarm, runs the CRON job, and exports the `run` entry point.
 *
 * @module scripts/migration/spellSwarm/index
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import fs from 'fs/promises';
import cron from 'node-cron';
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

const log = createLogger({ script: 'spellSwarm' });

/**
 * Validates the JSON source, ensures the content directory exists,
 * and initializes the state file and swarm git worktree.
 *
 * @returns {Promise<void>}
 */
const main = async (): Promise<void> => {
  try {
    configureStatePath(STATE_FILE);

    const raw = await fs.readFile(SPELLS_JSON, 'utf-8');
    const spells = JSON.parse(raw) as SpellEntry[];
    log.message(`Loaded ${spells.length} external spell entries.`, {
      source: SPELLS_JSON,
    });

    await fs.mkdir(CONTENT_DIR, { recursive: true });

    const state = await loadState();
    await saveState(state);

    await initSwarmWorktree();
    log.message(
      `Swarm ready on branch "${SWARM_BRANCH}". ` +
        `${spells.length - state.processedSlugs.length} spells remaining.`,
    );
  } catch (error) {
    log.error('Error during swarm initialization', { error: String(error) });
    process.exit(1);
  }
};

/**
 * CRON job — fires every 10 minutes, processes the next batch of up to 10
 * unprocessed spells in parallel, then pushes the batch as a group to origin.
 */
cron.schedule('*/10 * * * *', async () => {
  try {
    const raw = await fs.readFile(SPELLS_JSON, 'utf-8');
    const allSpells = JSON.parse(raw) as SpellEntry[];

    const state = await loadState();
    const processed = new Set(state.processedSlugs);
    const unprocessed = allSpells.filter((s) => !processed.has(s.slug));

    if (unprocessed.length === 0) {
      log.message('All spells processed. Migration complete.');
      return;
    }

    const batch = unprocessed.slice(0, 10);
    log.message(`Processing batch: [${batch.map((s) => s.slug).join(', ')}]`);

    await Promise.all(batch.map((entry) => launchAgent(entry, CONTENT_DIR)));

    await pushSwarmBranch();

    state.processedSlugs.push(...batch.map((s) => s.slug));
    await saveState(state);

    log.message(
      `Batch pushed. ${state.processedSlugs.length}/${allSpells.length} spells done.`,
    );
  } catch (error) {
    log.error('Error during cron job execution', { error: String(error) });
  }
});

/**
 * Entry point — initializes the swarm and starts the CRON scheduler.
 *
 * @returns {void}
 */
export const run = (): void => {
  main().catch((error) => {
    log.error('Fatal error in swarm run', { error: String(error) });
    process.exit(1);
  });
};
