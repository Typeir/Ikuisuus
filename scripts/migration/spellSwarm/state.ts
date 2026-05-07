/**
 * @fileoverview Persistent state management for the spell swarm migration.
 * Tracks which spells have already been committed so CRON cycles are idempotent.
 *
 * @module scripts/migration/spellSwarm/state
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import fs from 'fs/promises';
import type { SwarmState } from './types';

/** Absolute path to the state file. Injected by the caller. */
let STATE_FILE_PATH = '';

/**
 * Configures the path used by loadState and saveState.
 *
 * @param {string} filePath - Absolute path to the JSON state file.
 * @returns {void}
 */
export const configureStatePath = (filePath: string): void => {
  STATE_FILE_PATH = filePath;
};

/**
 * Loads the swarm state from disk, returning an empty state if none exists.
 *
 * @returns {Promise<SwarmState>} The current swarm state.
 */
export const loadState = async (): Promise<SwarmState> => {
  try {
    const raw = await fs.readFile(STATE_FILE_PATH, 'utf-8');
    return JSON.parse(raw) as SwarmState;
  } catch {
    return { processedSlugs: [] };
  }
};

/**
 * Persists the swarm state to disk.
 *
 * @param {SwarmState} state - The current state to write.
 * @returns {Promise<void>}
 */
export const saveState = async (state: SwarmState): Promise<void> => {
  await fs.writeFile(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
};
