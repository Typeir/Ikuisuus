/**
 * @fileoverview Creature Handlers Hook
 * @description Provides creature-level CRUD callbacks for the EncounterPlanner.
 *
 * @module modules/encounter-planner/presentation/EncounterPlanner/useCreatureHandlers
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { MonsterData } from '@/modules/encounter-planner/lib/utils/monsterCache';
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
 * Returns creature-level event handlers that mutate the active encounter.
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
            tierBonus:
              updatedCombatant.tierBonusOverride ??
              updatedCombatant.tierBonus,
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
