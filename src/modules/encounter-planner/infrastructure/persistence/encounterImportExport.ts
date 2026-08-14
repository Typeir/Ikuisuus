/**
 * @fileoverview Encounter Import/Export
 * @description Serializes encounters to JSON strings and parses them back with validation and fresh IDs.
 *
 * @module encounter-planner/infrastructure/persistence/encounterImportExport
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type {
    CreatureEntry,
    Encounter,
} from '../../domain/encounters/encounter.types';
import { generateId } from '../../domain/shared/utils';

/**
 * Serializes encounter to JSON string.
 *
 * @function exportEncounter
 * @param {Encounter} encounter - Encounter to serialize
 * @returns {string} Formatted JSON string (2-space indentation)
 *
 * @example
 * const json = exportEncounter(encounter);
 * await navigator.clipboard.writeText(json);
 */
export const exportEncounter = (encounter: Encounter): string => {
  return JSON.stringify(encounter, null, 2);
};

/**
 * Parses and validates encounter from JSON string. Assigns a new ID and ensures timestamps exist.
 *
 * @function importEncounter
 * @param {string} jsonString - JSON string to parse
 * @returns {Encounter} Parsed and validated encounter with new ID
 * @throws {Error} If JSON is invalid or structure doesn't match Encounter schema
 *
 * @example
 * try {
 *   const imported = importEncounter(jsonString);
 *   saveEncounter(imported);
 * } catch (error) {
 *   console.error('Import failed:', error);
 * }
 */
export const importEncounter = (jsonString: string): Encounter => {
  const encounter = JSON.parse(jsonString);

  if (!encounter.id || !encounter.name || !Array.isArray(encounter.creatures)) {
    throw new Error('Invalid encounter structure');
  }

  encounter.id = generateId();

  const now = new Date().toISOString();
  encounter.createdAt = encounter.createdAt || now;
  encounter.updatedAt = now;

  encounter.creatures.forEach((creature: CreatureEntry) => {
    if (!creature.id || !creature.name) {
      throw new Error('Invalid creature structure');
    }
  });

  return encounter;
};
