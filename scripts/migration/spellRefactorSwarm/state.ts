/**
 * @fileoverview Persistent state management for the spell refactor swarm.
 * Tracks which spells have already been committed so re-runs are idempotent.
 *
 * @module scripts/migration/spellRefactorSwarm/state
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import fs from 'fs/promises';
import type { RefactorSwarmState } from './types';

let STATE_FILE_PATH = '';
let isProcessing = false;

export const configureStatePath = (filePath: string): void => {
  STATE_FILE_PATH = filePath;
};

export const setProcessingFlag = (value: boolean): void => {
  isProcessing = value;
};

export const getProcessingFlag = (): boolean => {
  return isProcessing;
};

export const loadState = async (): Promise<RefactorSwarmState> => {
  try {
    const raw = await fs.readFile(STATE_FILE_PATH, 'utf-8');
    return JSON.parse(raw) as RefactorSwarmState;
  } catch {
    return { processedSlugs: [] };
  }
};

export const saveState = async (state: RefactorSwarmState): Promise<void> => {
  await fs.writeFile(STATE_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
};
