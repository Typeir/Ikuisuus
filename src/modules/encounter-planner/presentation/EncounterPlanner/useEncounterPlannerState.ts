/**
 * @fileoverview Encounter Planner State Hook
 * @description Manages encounter-level state and handlers. IO is delegated to useEncounterIO,
 * creature handlers to useCreatureHandlers.
 *
 * @module encounter-planner/presentation/EncounterPlanner/useEncounterPlannerState
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useNotifications } from '@/lib/components/ui';
import { ENCOUNTER_SAVE_INDICATOR_MS } from '@/lib/constants/delays';
import { useDebounce } from '@/lib/hooks/useDebounce';
import type { MonsterData } from '@/lib/utils/monsterCache';
import { useLocale, useTranslations } from 'next-intl';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  createInProgressCombat,
  createInProgressCombatant,
  getActiveInProgressCombatId,
  getInProgressCombat,
  saveInProgressCombat,
  setActiveInProgressCombatId,
} from '../../application/factories/combatSnapshot.factory';
import { createEmptyEncounter } from '../../application/factories/encounter.factory';
import type { InProgressCombat, InProgressCombatant } from '../../domain/combat/inProgressCombat.types';
import type { Encounter } from '../../domain/encounters/encounter.types';
import {
  deleteEncounter as deleteEncounterUtil,
  getActiveEncounter,
  getEncounters,
  saveEncounter,
  setActiveEncounterId,
} from '../../infrastructure/persistence/encounterRepository';
import { useCreatureHandlers } from './useCreatureHandlers';
import { useEncounterIO } from './useEncounterIO';

/**
 * Return shape of useEncounterPlannerState.
 * @interface UseEncounterPlannerStateResult
 * @property {Encounter | null} encounter - Currently active encounter
 * @property {Encounter[]} encounters - All saved encounters
 * @property {boolean} isSaving - Whether autosave is in progress
 * @property {boolean} showCreatureImport - Whether the monster importer panel is visible
 * @property {InProgressCombat | null} inProgressCombat - Active play-mode combat, or null
 * @property {React.RefObject<HTMLInputElement | null>} fileInputRef - Ref for hidden file input
 * @property {(name: string) => void} handleNameChange - Update encounter name
 * @property {() => void} handleNewEncounter - Create a fresh encounter
 * @property {(id: string) => void} handleLoadEncounter - Load encounter by ID
 * @property {() => void} handleDeleteEncounter - Delete active encounter with confirmation
 * @property {() => void} handleStartCombat - Begin play mode
 * @property {() => void} handleExitPlayMode - Exit play mode
 * @property {() => void} handleResumeCombat - Resume most recent combat
 * @property {() => Promise<void>} handleExport - Export encounter to clipboard or file
 * @property {() => void} handleImport - Trigger file input for import
 * @property {(e: React.ChangeEvent<HTMLInputElement>) => Promise<void>} handleFileChange - Process file
 * @property {() => void} handleAddCreature - Prepend an empty creature
 * @property {(data: MonsterData, qty: number) => void} handleImportCreatures - Import monsters
 * @property {(index: number, updated: InProgressCombatant) => void} handleUpdateCreature - Update creature
 * @property {(index: number) => void} handleRemoveCreature - Remove creature by index
 * @property {React.Dispatch<React.SetStateAction<boolean>>} setShowCreatureImport - Toggle panel
 * @property {boolean} resumeCombatAvailable - Whether a paused combat can be resumed
 * @property {React.Dispatch<React.SetStateAction<InProgressCombat | null>>} setInProgressCombat - Override combat
 * @property {typeof createInProgressCombatant} createInProgressCombatant - Convert creature to combatant
 */
export interface UseEncounterPlannerStateResult {
  encounter: Encounter | null;
  encounters: Encounter[];
  isSaving: boolean;
  showCreatureImport: boolean;
  inProgressCombat: InProgressCombat | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleNameChange: (name: string) => void;
  handleNewEncounter: () => void;
  handleLoadEncounter: (id: string) => void;
  handleDeleteEncounter: () => void;
  handleStartCombat: () => void;
  handleExitPlayMode: () => void;
  handleResumeCombat: () => void;
  handleExport: () => Promise<void>;
  handleImport: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleAddCreature: () => void;
  handleImportCreatures: (monsterData: MonsterData, quantity: number) => void;
  handleUpdateCreature: (index: number, updated: InProgressCombatant) => void;
  handleRemoveCreature: (index: number) => void;
  setShowCreatureImport: React.Dispatch<React.SetStateAction<boolean>>;
  resumeCombatAvailable: boolean;
  setInProgressCombat: React.Dispatch<React.SetStateAction<InProgressCombat | null>>;
  createInProgressCombatant: typeof createInProgressCombatant;
}

/**
 * Manages encounter-level state, effects, and handlers for the EncounterPlanner component.
 *
 * @function useEncounterPlannerState
 * @returns {UseEncounterPlannerStateResult} State and handlers
 */
export const useEncounterPlannerState = (): UseEncounterPlannerStateResult => {
  const t = useTranslations('encounterPlanner');
  const locale = useLocale();
  const notifications = useNotifications();
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreatureImport, setShowCreatureImport] = useState(false);
  const [inProgressCombat, setInProgressCombat] = useState<InProgressCombat | null>(null);
  const hasShownResumeNotificationRef = useRef(false);
  const debouncedEncounter = useDebounce(encounter, 500);

  useEffect(() => {
    const loadedEncounters = getEncounters();
    setEncounters(loadedEncounters);
    const activeEncounter = getActiveEncounter();
    if (activeEncounter) {
      setEncounter(activeEncounter);
    } else if (loadedEncounters.length > 0) {
      setEncounter(loadedEncounters[0]);
      setActiveEncounterId(loadedEncounters[0].id);
    } else {
      const newEncounter = createEmptyEncounter();
      setEncounter(newEncounter);
      setActiveEncounterId(newEncounter.id);
      saveEncounter(newEncounter);
      setEncounters([newEncounter]);
    }
  }, []);

  useEffect(() => {
    if (hasShownResumeNotificationRef.current) return;
    const activeCombatId = getActiveInProgressCombatId();
    if (activeCombatId && !inProgressCombat) {
      const combat = getInProgressCombat(activeCombatId);
      if (combat) {
        hasShownResumeNotificationRef.current = true;
        notifications.info(t('resumeCombatAvailable'), {
          title: t('playMode'),
          duration: 0,
          action: { label: t('resumeCombat'), onClick: () => setInProgressCombat(combat) },
        });
      }
    }
  }, [inProgressCombat, notifications, t]);

  useEffect(() => {
    if (debouncedEncounter) {
      setIsSaving(true);
      saveEncounter(debouncedEncounter);
      setEncounters(getEncounters());
      setTimeout(() => setIsSaving(false), ENCOUNTER_SAVE_INDICATOR_MS);
    }
  }, [debouncedEncounter]);

  const updateEncounter = useCallback(
    (updater: (prev: Encounter) => Encounter) => {
      setEncounter((prev) => (prev ? updater(prev) : null));
    },
    [],
  );

  const handleImported = useCallback((imported: Encounter) => {
    setEncounter(imported);
    setEncounters(getEncounters());
  }, []);

  const { fileInputRef, handleExport, handleImport, handleFileChange } =
    useEncounterIO(encounter, handleImported);

  const { handleAddCreature, handleImportCreatures, handleUpdateCreature, handleRemoveCreature } =
    useCreatureHandlers(updateEncounter, locale, setShowCreatureImport);

  const handleNewEncounter = useCallback(() => {
    const newEncounter = createEmptyEncounter();
    setEncounter(newEncounter);
    setActiveEncounterId(newEncounter.id);
    saveEncounter(newEncounter);
    setEncounters(getEncounters());
  }, []);

  const handleLoadEncounter = useCallback((id: string) => {
    const toLoad = getEncounters().find((e) => e.id === id);
    if (toLoad) { setEncounter(toLoad); setActiveEncounterId(id); }
  }, []);

  const handleDeleteEncounter = useCallback(() => {
    if (!encounter) return;
    notifications.warning(t('confirmDelete'), {
      title: t('deleteEncounter'),
      duration: 0,
      action: {
        label: t('confirmDeleteAction'),
        onClick: () => {
          deleteEncounterUtil(encounter.id);
          const remaining = getEncounters();
          setEncounters(remaining);
          if (remaining.length > 0) {
            setEncounter(remaining[0]);
            setActiveEncounterId(remaining[0].id);
          } else {
            const newEncounter = createEmptyEncounter();
            setEncounter(newEncounter);
            setActiveEncounterId(newEncounter.id);
            saveEncounter(newEncounter);
            setEncounters([newEncounter]);
          }
        },
      },
    });
  }, [encounter, notifications, t]);

  const handleStartCombat = useCallback(() => {
    if (!encounter) return;
    const combat = createInProgressCombat(encounter, locale);
    setInProgressCombat(combat);
    setActiveInProgressCombatId(combat.id);
    saveInProgressCombat(combat);
  }, [encounter, locale]);

  const handleExitPlayMode = useCallback(() => setInProgressCombat(null), []);

  const handleResumeCombat = useCallback(() => {
    const activeCombatId = getActiveInProgressCombatId();
    if (activeCombatId) {
      const combat = getInProgressCombat(activeCombatId);
      if (combat) setInProgressCombat(combat);
    }
  }, []);

  const handleNameChange = useCallback(
    (name: string) => updateEncounter((prev) => ({ ...prev, name })),
    [updateEncounter],
  );

  const activeCombatId = getActiveInProgressCombatId();
  const resumeCombatAvailable = activeCombatId && !inProgressCombat
    ? !!getInProgressCombat(activeCombatId)
    : false;

  return {
    encounter, encounters, isSaving, showCreatureImport, inProgressCombat, fileInputRef,
    handleNameChange, handleNewEncounter, handleLoadEncounter, handleDeleteEncounter,
    handleStartCombat, handleExitPlayMode, handleResumeCombat,
    handleExport, handleImport, handleFileChange,
    handleAddCreature, handleImportCreatures, handleUpdateCreature, handleRemoveCreature,
    setShowCreatureImport, resumeCombatAvailable, setInProgressCombat, createInProgressCombatant,
  };
};
