/**
 * @fileoverview Creature Handlers Hook
 * @description Manages creature-level CRUD callbacks for the EncounterPlanner.
 * Separated from encounter-level IO to keep each hook within the 250-line limit.
 *
 * @module encounter-planner/presentation/EncounterPlanner/useCreatureHandlers
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { MonsterData } from '@/lib/utils/monsterCache';
import { useCallback } from 'react';
import {
  createEmptyCreature,
  createMultipleCreaturesFromMonster,
} from '../../application/factories/encounter.factory';
import type { InProgressCombatant } from '../../domain/combat/inProgressCombat.types';
import type { Encounter } from '../../domain/encounters/encounter.types';

/**
 * Return shape of useCreatureHandlers.
 * @interface UseCreatureHandlersResult
 * @property {() => void} handleAddCreature - Prepend a blank creature to the encounter
 * @property {(data: MonsterData, qty: number) => void} handleImportCreatures - Bulk-import monsters
 * @property {(index: number, updated: InProgressCombatant) => void} handleUpdateCreature - Apply edits to one creature
 * @property {(index: number) => void} handleRemoveCreature - Remove creature at given index
 */
export interface UseCreatureHandlersResult {
  handleAddCreature: () => void;
  handleImportCreatures: (monsterData: MonsterData, quantity: number) => void;
  handleUpdateCreature: (index: number, updated: InProgressCombatant) => void;
  handleRemoveCreature: (index: number) => void;
}

/**
 * Provides creature-level event handlers that mutate the active encounter.
 *
 * @function useCreatureHandlers
 * @param {(updater: (prev: Encounter) => Encounter) => void} updateEncounter - State updater from parent hook
 * @param {string} locale - Active locale for monster wiki links
 * @param {React.Dispatch<React.SetStateAction<boolean>>} setShowCreatureImport - Closes importer after import
 * @returns {UseCreatureHandlersResult} Creature mutation handlers
 */
export const useCreatureHandlers = (
  updateEncounter: (updater: (prev: Encounter) => Encounter) => void,
  locale: string,
  setShowCreatureImport: React.Dispatch<React.SetStateAction<boolean>>,
): UseCreatureHandlersResult => {
  const handleAddCreature = useCallback(() => {
    updateEncounter((prev) => ({
      ...prev,
      creatures: [createEmptyCreature(), ...prev.creatures],
    }));
  }, [updateEncounter]);

  const handleImportCreatures = useCallback(
    (monsterData: MonsterData, quantity: number) => {
      const newCreatures = createMultipleCreaturesFromMonster(
        monsterData,
        locale,
        quantity,
      );
      updateEncounter((prev) => ({
        ...prev,
        creatures: [...newCreatures, ...prev.creatures],
      }));
      setShowCreatureImport(false);
    },
    [locale, updateEncounter, setShowCreatureImport],
  );

  const handleUpdateCreature = useCallback(
    (index: number, updatedCombatant: InProgressCombatant) => {
      updateEncounter((prev) => ({
        ...prev,
        creatures: prev.creatures.map((c, i) => {
          if (i !== index) return c;
          return {
            ...c,
            name: updatedCombatant.name,
            hpCurrent: updatedCombatant.hpCurrent,
            hpMax: updatedCombatant.hpMaxOverride ?? updatedCombatant.hpMax,
            tempHp: updatedCombatant.tempHp,
            ac: updatedCombatant.ac,
            stats: updatedCombatant.stats,
            conditions: updatedCombatant.conditions,
            initiativeValue: updatedCombatant.initiativeValue,
            initiativeBonus: updatedCombatant.initiativeBonus,
            proficiencyBonus:
              updatedCombatant.proficiencyBonusOverride ??
              updatedCombatant.proficiencyBonus,
            speed: updatedCombatant.speed,
            hpFormula: updatedCombatant.hpFormula,
            details: updatedCombatant.details,
            slain: updatedCombatant.slain,
            heroicAwakening: updatedCombatant.heroicAwakening.awakened
              ? { ...updatedCombatant.heroicAwakening }
              : undefined,
          };
        }),
      }));
    },
    [updateEncounter],
  );

  const handleRemoveCreature = useCallback(
    (index: number) => {
      updateEncounter((prev) => ({
        ...prev,
        creatures: prev.creatures.filter((_, i) => i !== index),
      }));
    },
    [updateEncounter],
  );

  return {
    handleAddCreature,
    handleImportCreatures,
    handleUpdateCreature,
    handleRemoveCreature,
  };
};
