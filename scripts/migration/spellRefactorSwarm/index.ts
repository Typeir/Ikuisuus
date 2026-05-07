/**
 * @fileoverview Orchestrator for the spell lore-refactor swarm.
 * Initializes the branch, loads state, and runs batched CRON cycles.
 *
 * @module scripts/migration/spellRefactorSwarm/index
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { createLogger } from '@/lib/logging/logger';
import fs from 'fs/promises';
import cron from 'node-cron';
import path from 'path';
import { launchAgent } from './agent';
import {
    commitBatch,
    getAddedSpellPaths,
    initRefactorBranch,
    REFACTOR_BRANCH,
} from './git';
import {
    configureStatePath,
    getProcessingFlag,
    loadState,
    saveState,
    setProcessingFlag,
} from './state';
import type { SpellRefactorEntry } from './types';

/** Commit hash that marks the start of the SRD import window. */
const BASE_COMMIT = 'bfa7f8cb57e5f3b9fcc7a002af0093cf0e84c97e';

const STATE_FILE = path.resolve(
  'scripts',
  'migration',
  'spellRefactorSwarm.state.json',
);

const log = createLogger({ script: 'spellRefactorSwarm' });

/** Stores the active CRON task for dynamic rescheduling. */
let cronTask: NodeJS.Timeout | null = null;

/**
 * Reads a spell file from disk and wraps it into a {@link SpellRefactorEntry}.
 *
 * @param {string} filePath - Absolute path to the MDX file.
 * @returns {Promise<SpellRefactorEntry>} The entry with raw file content.
 */
const readEntry = async (filePath: string): Promise<SpellRefactorEntry> => {
  const slug = path.basename(filePath, '.mdx');
  const rawContent = await fs.readFile(filePath, 'utf-8');
  return { slug, filePath, rawContent };
};

/**
 * Processes the next batch of spells sequentially (one at a time) to prevent
 * memory buildup from concurrent sessions. After each finishes writing, stages
 * and commits the batch together.
 *
 * @returns {Promise<void>}
 */
const processBatch = async (): Promise<void> => {
  if (getProcessingFlag()) {
    log.message('Batch already processing — skipping concurrent call.');
    return;
  }

  setProcessingFlag(true);

  try {
    const allPaths = await getAddedSpellPaths(BASE_COMMIT);
    const state = await loadState();
    const processed = new Set(state.processedSlugs);

    const unprocessed = allPaths.filter(
      (p) => !processed.has(path.basename(p, '.mdx')),
    );

    if (unprocessed.length === 0) {
      log.message('All spells refactored. Migration complete.');
      return;
    }

    const batch = unprocessed.slice(0, 3);
    const batchSlugs = batch.map((p) => path.basename(p, '.mdx'));
    log.message(`Processing batch: [${batchSlugs.join(', ')}]`);

    const entries = await Promise.all(batch.map(readEntry));

    state.processedSlugs.push(...entries.map((e) => e.slug));
    await saveState(state);

    for (const entry of entries) {
      try {
        await launchAgent(entry);
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        log.error(`Error processing ${entry.slug}:`, {
          error: String(error),
        });
      }
    }

    const batchCommitMessage = `[refactor]: batch — ${batchSlugs.join(', ')}`;
    await commitBatch(
      entries.map((e) => e.filePath),
      batchCommitMessage,
    );

    log.message(
      `Batch complete: ${entries.length}/${entries.length} processed. ` +
        `${state.processedSlugs.length}/${allPaths.length} total.`,
    );
  } catch (error) {
    log.error('Error during batch processing', { error: String(error) });
  } finally {
    setProcessingFlag(false);
  }
};

/**
 * Unschedules the active CRON job, immediately processes the next batch
 * (without waiting for the next minute), then reschedules itself to fire again
 * with a delay to allow cleanup. Enables batched processing with memory safety.
 *
 * @returns {Promise<void>}
 */
const reschedule = async (): Promise<void> => {
  await processBatch();

  if (getProcessingFlag()) {
    log.message('Batch still processing — will retry after delay.');
  }

  const allPaths = await getAddedSpellPaths(BASE_COMMIT);
  const state = await loadState();
  const processed = new Set(state.processedSlugs);
  const unprocessed = allPaths.filter(
    (p) => !processed.has(path.basename(p, '.mdx')),
  );

  if (unprocessed.length > 0) {
    setTimeout(() => {
      reschedule().catch((err) => {
        log.error('Error in rescheduled batch', { error: String(err) });
      });
    }, 2000);
  } else {
    log.message('All spells processed. Reschedule loop complete.');
  }
};

/**
 * Validates preconditions, resolves all affected spell paths, initializes
 * the refactor branch and state file, and starts the scheduler.
 *
 * @returns {Promise<void>}
 */
const main = async (): Promise<void> => {
  try {
    configureStatePath(STATE_FILE);

    const allPaths = await getAddedSpellPaths(BASE_COMMIT);
    log.message(`Found ${allPaths.length} spell files to process.`, {
      baseCommit: BASE_COMMIT,
    });

    const state = await loadState();
    await saveState(state);

    await initRefactorBranch();
    log.message(
      `Refactor branch "${REFACTOR_BRANCH}" ready. ` +
        `${allPaths.length - state.processedSlugs.length} spells remaining.`,
    );

    startScheduler();
  } catch (error) {
    log.error('Error during swarm initialization', { error: String(error) });
    process.exit(1);
  }
};

/**
 * Initializes and starts the reschedule loop for the swarm.
 * Also sets up a CRON fallback (every 5 minutes) in case the reschedule loop breaks.
 *
 * @returns {void}
 */
const startScheduler = (): void => {
  log.message('Starting reschedule loop...');
  reschedule().catch((err) => {
    log.error('Fatal error in reschedule loop', { error: String(err) });
  });

  cronTask = cron.schedule('*/5 * * * *', () => {
    if (getProcessingFlag()) {
      log.message('CRON skipped (batch already processing).');
      return;
    }
    log.message(
      'CRON fallback triggered (5-minute interval). Checking if loop stalled...',
    );
    reschedule().catch((err) => {
      log.error('Error in CRON fallback', { error: String(err) });
    });
  });
  log.message('CRON fallback started (every 5 minutes as safety net).');
};

/**
 * Entry point — initializes the swarm and starts the CRON scheduler.
 * Gracefully handles shutdown via signal handlers (SIGINT).
 *
 * @returns {void}
 */
export const run = (): void => {
  main().catch((error) => {
    log.error('Fatal error in swarm run', { error: String(error) });
    if (cronTask) {
      cronTask.stop();
    }
    process.exit(1);
  });

  process.on('SIGINT', () => {
    log.message('Shutting down swarm...');
    if (cronTask) {
      cronTask.stop();
    }
    process.exit(0);
  });
};

/**
 * Runs a single batch of unprocessed spells without starting the CRON scheduler.
 * Designed for local debugging and CI one-shot runs.
 * Processes spells concurrently and awaits completion.
 *
 * @param {number} [batchSize=5] - Number of spells to process in this run.
 * @returns {Promise<void>}
 */
export const runOnce = async (batchSize = 5): Promise<void> => {
  configureStatePath(STATE_FILE);
  setProcessingFlag(true);

  try {
    const allPaths = await getAddedSpellPaths(BASE_COMMIT);
    log.message(`Found ${allPaths.length} spell files to evaluate.`, {
      baseCommit: BASE_COMMIT,
    });

    const state = await loadState();
    const processed = new Set(state.processedSlugs);
    const unprocessed = allPaths.filter(
      (p) => !processed.has(path.basename(p, '.mdx')),
    );

    log.message(
      `${processed.size} already processed. ${unprocessed.length} remaining.`,
      { branch: REFACTOR_BRANCH },
    );

    if (unprocessed.length === 0) {
      log.message('Nothing to do — all spells already refactored.');
      return;
    }

    await initRefactorBranch();

    const batch = unprocessed.slice(0, batchSize);
    const batchSlugs = batch.map((p) => path.basename(p, '.mdx'));
    log.message(
      `Processing batch of ${batch.length} sequentially: [${batchSlugs.join(', ')}]`,
    );

    const entries = await Promise.all(batch.map(readEntry));

    state.processedSlugs.push(...entries.map((e) => e.slug));
    await saveState(state);

    const results = [];
    for (const entry of entries) {
      try {
        await launchAgent(entry);
        results.push({
          slug: entry.slug,
          filePath: entry.filePath,
          success: true,
        });
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (err) {
        log.error(`Processing failed for "${entry.slug}": ${String(err)}`, {
          slug: entry.slug,
        });
        results.push({
          slug: entry.slug,
          filePath: entry.filePath,
          success: false,
          error: String(err),
        });
      }
    }

    const successfulEntries = results.filter((r) => r.success);

    if (successfulEntries.length > 0) {
      const batchCommitMessage = `[refactor]: batch — ${batchSlugs.join(', ')}`;
      await commitBatch(
        successfulEntries.map((e) => e.filePath),
        batchCommitMessage,
      );
    }

    log.message(
      `Batch complete: ${successfulEntries.length}/${entries.length} committed. ` +
        `${state.processedSlugs.length}/${allPaths.length} spells total.`,
    );
  } catch (error) {
    log.error('Fatal error in runOnce', { error: String(error) });
    throw error;
  } finally {
    setProcessingFlag(false);
  }
};
