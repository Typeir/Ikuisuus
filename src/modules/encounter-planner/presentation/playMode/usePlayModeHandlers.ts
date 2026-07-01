/**
 * @fileoverview Play Mode Handlers Hook
 * @description Encapsulates Play Mode state mutation handlers for combat updates, turn flow, imports, exports, and session-only combatants.
 *
 * @module usePlayModeHandlers
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    createInProgressCombatant,
    createMultipleCombatantsFromMonster,
    deleteInProgressCombat,
    exportInProgressCombat,
    getNextActiveCombatantIndex,
    resortCombatants,
    saveInProgressCombat,
    setActiveInProgressCombatId,
} from '@/modules/encounter-planner/application/factories/combatSnapshot.factory';
import { importPartyIntoCombat } from '@/modules/encounter-planner/application/services/partyImporter.service';
import type {
    InProgressCombat,
    InProgressCombatant,
} from '@/modules/encounter-planner/domain/combat/inProgressCombat.types';
import type { SavedParty } from '@/modules/encounter-planner/domain/parties/party.types';
import { generateId } from '@/modules/encounter-planner/domain/shared/utils';
import type { MonsterData } from '@/modules/encounter-planner/lib/utils/monsterCache';
import { useLocale } from 'next-intl';
import {
    type ChangeEvent,
    type Dispatch,
    type RefObject,
    type SetStateAction,
    useCallback,
    useRef,
    useState,
} from 'react';
import type { PlayModeLifecycle } from '../../application/lifecycle/PlayModeLifecycle';
import type { EncounterTranslator } from '../../application/lifecycle/playModeLifecycleNotifications';
import { buildEndTurnTransition } from '../../application/lifecycle/playModeTurnFlow';

/**
 * Hook parameters for Play Mode handlers.
 *
 * @interface UsePlayModeHandlersParams
 * @property {InProgressCombat} combat - Current combat state
 * @property {Dispatch<SetStateAction<InProgressCombat>>} setCombat - Combat state setter
 * @property {() => void} onExit - Callback when ending combat
 * @property {PlayModeLifecycle} lifecycle - Lifecycle dispatcher for turn/round events
 * @property {{error: (message: string) => string}} notifications - Notification methods used by import flow
 * @property {EncounterTranslator} t - Translation function for encounter planner strings
 */
export interface UsePlayModeHandlersParams {
  combat: InProgressCombat;
  setCombat: Dispatch<SetStateAction<InProgressCombat>>;
  onExit: () => void;
  lifecycle: PlayModeLifecycle;
  notifications: {
    error: (message: string) => string;
  };
  t: EncounterTranslator;
}

/**
 * Return contract for Play Mode handlers hook.
 *
 * @interface UsePlayModeHandlersResult
 * @property {string} sessionOnlyName - Input value for session-only combatant name
 * @property {Dispatch<SetStateAction<string>>} setSessionOnlyName - Setter for session-only name input
 * @property {RefObject<HTMLInputElement>} fileInputRef - Hidden combat import input ref
 * @property {(index: number, updater: (c: InProgressCombatant) => InProgressCombatant) => void} handleUpdateCombatant - Updates one combatant by index
 * @property {() => void} handleEndTurn - Advances turn and emits lifecycle events
 * @property {() => void} handleSortByInitiative - Resorts combatants by initiative
 * @property {() => void} handleAddSessionOnlyCombatant - Adds custom session-only combatant
 * @property {(id: string) => void} handleRemoveSessionOnly - Removes a session-only combatant
 * @property {(monsterData: MonsterData, quantity: number) => void} handleImportCreatures - Imports creature copies from monster metadata
 * @property {() => void} handleEndCombat - Deletes in-progress combat and exits Play Mode
 * @property {() => void} handleExport - Exports in-progress combat JSON
 * @property {() => void} handleImportCombat - Opens combat import file picker
 * @property {(e: ChangeEvent<HTMLInputElement>) => Promise<void>} handleCombatFileChange - Imports in-progress combat from selected JSON file
 * @property {(party: SavedParty) => void} handleImportParty - Replaces party members in combat with the given saved party
 */
export interface UsePlayModeHandlersResult {
  sessionOnlyName: string;
  setSessionOnlyName: Dispatch<SetStateAction<string>>;
  fileInputRef: RefObject<HTMLInputElement>;
  handleUpdateCombatant: (
    index: number,
    updater: (c: InProgressCombatant) => InProgressCombatant,
  ) => void;
  handleEndTurn: () => void;
  handleSortByInitiative: () => void;
  handleAddSessionOnlyCombatant: () => void;
  handleRemoveSessionOnly: (id: string) => void;
  handleImportCreatures: (monsterData: MonsterData, quantity: number) => void;
  handleEndCombat: () => void;
  handleExport: () => void;
  handleImportCombat: () => void;
  handleCombatFileChange: (e: ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleImportParty: (party: SavedParty) => void;
}

/**
 * Creates Play Mode action handlers and related local state.
 *
 * @param {UsePlayModeHandlersParams} params - Hook parameters
 * @param {InProgressCombat} params.combat - Current combat state
 * @param {Dispatch<SetStateAction<InProgressCombat>>} params.setCombat - Combat state setter
 * @param {() => void} params.onExit - Callback when ending combat
 * @param {PlayModeLifecycle} params.lifecycle - Lifecycle dispatcher for turn/round events
 * @param {{error: (message: string) => string}} params.notifications - Notification methods used by import flow
 * @param {EncounterTranslator} params.t - Translation function for encounter planner strings
 * @returns {UsePlayModeHandlersResult} Hook state and handlers
 */
export function usePlayModeHandlers({
  combat,
  setCombat,
  onExit,
  lifecycle,
  notifications,
  t,
}: UsePlayModeHandlersParams): UsePlayModeHandlersResult {
  const [sessionOnlyName, setSessionOnlyName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const locale = useLocale();

  const updateCombat = useCallback(
    (updater: (currentCombat: InProgressCombat) => InProgressCombat) => {
      setCombat((previousCombat) => {
        const updatedCombat = updater(previousCombat);
        saveInProgressCombat(updatedCombat);
        return updatedCombat;
      });
    },
    [setCombat],
  );

  const handleUpdateCombatant = useCallback(
    (
      index: number,
      updater: (combatant: InProgressCombatant) => InProgressCombatant,
    ) => {
      updateCombat((previousCombat) => {
        const combatants = [...previousCombat.combatants];
        combatants[index] = updater(combatants[index]);
        return { ...previousCombat, combatants };
      });
    },
    [updateCombat],
  );

  const handleEndTurn = useCallback(() => {
    const transition = buildEndTurnTransition(
      combat,
      getNextActiveCombatantIndex,
    );
    setCombat(transition.nextCombat);
    saveInProgressCombat(transition.nextCombat);

    transition.lifecycleEvents.forEach((event) => {
      lifecycle.emit(event.eventName, event.payload);
    });
  }, [combat, lifecycle, setCombat]);

  const handleSortByInitiative = useCallback(() => {
    updateCombat((previousCombat) => resortCombatants(previousCombat));
  }, [updateCombat]);

  const handleAddSessionOnlyCombatant = useCallback(() => {
    if (!sessionOnlyName.trim()) {
      return;
    }

    const newCombatant = createInProgressCombatant({
      id: generateId(),
      name: sessionOnlyName,
      hpCurrent: 10,
      hpMax: 10,
      tempHp: null,
      ac: 10,
      stats: {
        str: 10,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10,
      },
      conditions: [],
      initiativeValue: null,
      initiativeBonus: 0,
      tierBonus: null,
      speed: null,
      hpFormula: null,
      details: {
        buffs: [],
        items: [],
        spells: [],
        affixes: [],
      },
    });

    newCombatant.sessionOnly = true;

    updateCombat((previousCombat) => ({
      ...previousCombat,
      combatants: [...previousCombat.combatants, newCombatant],
      turnOrder: [newCombatant.id, ...previousCombat.turnOrder],
    }));

    setSessionOnlyName('');
  }, [sessionOnlyName, updateCombat]);

  const handleRemoveSessionOnly = useCallback(
    (id: string) => {
      updateCombat((previousCombat) => {
        const combatants = previousCombat.combatants.filter(
          (combatant) => combatant.id !== id,
        );
        const turnOrder = previousCombat.turnOrder.filter(
          (combatantId) => combatantId !== id,
        );
        const activeTurnIndex = Math.min(
          previousCombat.activeTurnIndex,
          combatants.length - 1,
        );

        return {
          ...previousCombat,
          combatants,
          turnOrder,
          activeTurnIndex: Math.max(0, activeTurnIndex),
        };
      });
    },
    [updateCombat],
  );

  const handleImportCreatures = useCallback(
    (monsterData: MonsterData, quantity: number) => {
      const newCombatants = createMultipleCombatantsFromMonster(
        monsterData,
        locale,
        quantity,
      );

      updateCombat((previousCombat) => ({
        ...previousCombat,
        combatants: [...previousCombat.combatants, ...newCombatants],
        turnOrder: [
          ...newCombatants.map((combatant) => combatant.id),
          ...previousCombat.turnOrder,
        ],
      }));
    },
    [locale, updateCombat],
  );

  const handleEndCombat = useCallback(() => {
    deleteInProgressCombat(combat.id);
    setActiveInProgressCombatId(null);
    onExit();
  }, [combat.id, onExit]);

  const handleExport = useCallback(() => {
    const json = exportInProgressCombat(combat);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${combat.encounterName}-combat.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [combat]);

  const handleImportCombat = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleCombatFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text) as InProgressCombat;
        setCombat(data);
      } catch {
        notifications.error(t('importError'));
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [notifications, setCombat, t],
  );

  const handleImportParty = useCallback(
    (party: SavedParty) =>
      updateCombat((prev) => importPartyIntoCombat(party, prev)),
    [updateCombat],
  );

  return {
    sessionOnlyName,
    setSessionOnlyName,
    fileInputRef,
    handleUpdateCombatant,
    handleEndTurn,
    handleSortByInitiative,
    handleAddSessionOnlyCombatant,
    handleRemoveSessionOnly,
    handleImportCreatures,
    handleEndCombat,
    handleExport,
    handleImportCombat,
    handleCombatFileChange,
    handleImportParty,
  };
}
