/**
 * @fileoverview Encounter Planner Component
 * @description Main encounter planning interface with creature management, initiative tracking,
 * and inline editing. Persists to localStorage with debounced autosave (500ms delay).
 * Supports multiple encounters with load/save/export/import functionality.
 *
 * @module encounterPlanner
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react Client-side state and effect hooks
 * @requires next-intl Internationalized translations
 * @requires @/lib/hooks/useDebounce Debounced autosave
 * @requires @/lib/utils/encounterStorage Persistence utilities
 * @requires @/lib/types/encounterPlanner Type definitions
 * @requires ./creatureRow CreatureRow component
 * @requires ./encounterPlanner.module.scss Component styles
 *
 * @example
 * ```tsx
 * import { EncounterPlanner } from '@/lib/components/encounterPlanner';
 *
 * export default function Page({ params }) {
 *   return <EncounterPlanner locale={params.locale} />;
 * }
 * ```
 */

'use client';

import { useNotifications } from '@/lib/components/ui';
import { ENCOUNTER_SAVE_INDICATOR_MS } from '@/lib/constants/delays';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { logger } from '@/lib/logging/logger';
import type { Encounter } from '@/lib/types/encounterPlanner';
import type {
  InProgressCombat,
  InProgressCombatant,
} from '@/lib/types/inProgressCombat';
import {
  createEmptyCreature,
  createEmptyEncounter,
  createMultipleCreaturesFromMonster,
  deleteEncounter as deleteEncounterUtil,
  exportEncounter,
  getActiveEncounter,
  getEncounters,
  importEncounter,
  saveEncounter,
  setActiveEncounterId,
} from '@/lib/utils/encounterStorage';
import {
  createInProgressCombat,
  createInProgressCombatant,
  getActiveInProgressCombatId,
  getInProgressCombat,
  saveInProgressCombat,
  setActiveInProgressCombatId,
} from '@/lib/utils/inProgressCombatStorage';
import type { MonsterData } from '@/lib/utils/monsterCache';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CombatantRow } from './combatantRow';
import { EncounterCombobox } from './comboboxes';
import styles from './encounterPlanner.module.scss';
import { MonsterImporter } from './importer';
import { PlayMode } from './playMode';

/**
 * Props for EncounterPlanner component
 * @interface EncounterPlannerProps
 * @property {string} [locale="en"] - Locale for translations and API requests
 */
interface EncounterPlannerProps {
  locale?: string;
}

/**
 * Main encounter planner component with creature management and persistence.
 * Automatically loads active encounter on mount, creates new one if none exist.
 * Implements debounced autosave (500ms) to localStorage.
 *
 * @component
 * @param {EncounterPlannerProps} props - Component props
 * @param {string} [props.locale='en'] - Locale for translations and API requests
 * @returns {JSX.Element} Rendered encounter planner interface
 *
 * @example
 * <EncounterPlanner locale="en" />
 */
export const EncounterPlanner: React.FC<EncounterPlannerProps> = ({
  locale = 'en',
}) => {
  const t = useTranslations('encounterPlanner');
  const notifications = useNotifications();
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreatureImport, setShowCreatureImport] = useState(false);
  const [inProgressCombat, setInProgressCombat] =
    useState<InProgressCombat | null>(null);
  const hasShownResumeNotificationRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Debounced encounter for autosave (500ms delay) */
  const debouncedEncounter = useDebounce(encounter, 500);

  /** Load initial encounter data on mount */
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

  /** Show resume combat notification on mount if active combat exists */
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
          action: {
            label: t('resumeCombat'),
            onClick: () => {
              setInProgressCombat(combat);
            },
          },
        });
      }
    }
  }, [inProgressCombat, notifications, t]);

  /** Autosave encounter when debounced value changes */
  useEffect(() => {
    if (debouncedEncounter) {
      setIsSaving(true);
      saveEncounter(debouncedEncounter);

      const updatedEncounters = getEncounters();
      setEncounters(updatedEncounters);

      setTimeout(() => setIsSaving(false), ENCOUNTER_SAVE_INDICATOR_MS);
    }
  }, [debouncedEncounter]);

  const updateEncounter = useCallback(
    (updater: (prev: Encounter) => Encounter) => {
      setEncounter((prev) => (prev ? updater(prev) : null));
    },
    [],
  );

  const handleNewEncounter = useCallback(() => {
    const newEncounter = createEmptyEncounter();
    setEncounter(newEncounter);
    setActiveEncounterId(newEncounter.id);
    saveEncounter(newEncounter);
    setEncounters(getEncounters());
  }, []);

  const handleLoadEncounter = useCallback((id: string) => {
    const allEncounters = getEncounters();
    const toLoad = allEncounters.find((e) => e.id === id);
    if (toLoad) {
      setEncounter(toLoad);
      setActiveEncounterId(id);
    }
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

  const handleExitPlayMode = useCallback(() => {
    setInProgressCombat(null);
  }, []);

  const handleResumeCombat = useCallback(() => {
    const activeCombatId = getActiveInProgressCombatId();
    if (activeCombatId) {
      const combat = getInProgressCombat(activeCombatId);
      if (combat) {
        setInProgressCombat(combat);
      }
    }
  }, []);

  const handleExport = useCallback(async () => {
    if (!encounter) return;

    const json = exportEncounter(encounter);

    try {
      await navigator.clipboard.writeText(json);
      notifications.success(t('exportSuccess'));
    } catch {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${encounter.name.replace(/\s+/g, '-').toLowerCase()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [encounter, notifications, t]);

  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const imported = importEncounter(text);

        setEncounter(imported);
        setActiveEncounterId(imported.id);
        saveEncounter(imported);
        setEncounters(getEncounters());

        notifications.success(t('importSuccess'));
      } catch (error) {
        logger.error('Failed to import encounter', {
          error: error instanceof Error ? error.message : String(error),
        });
        notifications.error(t('importError'));
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [notifications, t],
  );

  const handleNameChange = useCallback(
    (name: string) => {
      updateEncounter((prev) => ({ ...prev, name }));
    },
    [updateEncounter],
  );

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
    [locale, updateEncounter],
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

  if (!encounter) {
    return <div className={styles.loading}>{t('loading')}</div>;
  }

  const activeCombatId = getActiveInProgressCombatId();
  const resumeCombatAvailable =
    activeCombatId && !inProgressCombat
      ? !!getInProgressCombat(activeCombatId)
      : false;

  if (inProgressCombat) {
    return (
      <PlayMode
        combat={inProgressCombat}
        onExit={handleExitPlayMode}
        locale={locale}
      />
    );
  }

  return (
    <div className={styles.encounterPlanner}>
      {resumeCombatAvailable && (
        <div className={styles.resumeBanner}>
          <span className={styles.resumeText}>
            {t('resumeCombatAvailable')}
          </span>
          <button
            onClick={handleResumeCombat}
            className={`${styles.button} ${styles.buttonPrimary}`}>
            {t('resumeCombat')}
          </button>
        </div>
      )}
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <input
            type='text'
            className={styles.encounterNameInput}
            value={encounter.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={t('encounterName')}
          />
          <div className={styles.saveIndicator}>
            {isSaving ? t('saveIndicator') : t('savedIndicator')}
          </div>
        </div>

        <div className={styles.controls}>
          <button
            onClick={handleStartCombat}
            className={`${styles.button} ${styles.buttonPrimary}`}>
            {t('startCombat')}
          </button>

          <button onClick={handleNewEncounter} className={styles.button}>
            {t('newEncounter')}
          </button>

          <div className={styles.encounterComboboxWrap}>
            <EncounterCombobox
              encounters={encounters}
              currentEncounterId={encounter.id}
              onSelect={handleLoadEncounter}
            />
          </div>

          <button onClick={handleExport} className={styles.button}>
            {t('exportEncounter')}
          </button>

          <button onClick={handleImport} className={styles.button}>
            {t('importEncounter')}
          </button>

          <button
            onClick={handleDeleteEncounter}
            className={`${styles.button} ${styles.buttonDanger}`}>
            {t('deleteEncounter')}
          </button>

          <input
            ref={fileInputRef}
            type='file'
            accept='.json'
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>
      <div className={styles.addCreatureControls}>
        <button
          onClick={handleAddCreature}
          className={`${styles.button} ${styles.buttonPrimary}`}>
          {t('addCreature')}
        </button>

        <button
          onClick={() => setShowCreatureImport(!showCreatureImport)}
          className={`${styles.button} ${styles.buttonSecondary}`}>
          {t('importCreature')}
        </button>

        {showCreatureImport && (
          <div className={styles.importContainer}>
            <MonsterImporter locale={locale} onImport={handleImportCreatures} />
          </div>
        )}
      </div>
      <div className={styles.creatureList}>
        {encounter.creatures.map((creature, index) => {
          const combatant = createInProgressCombatant(creature);
          return (
            <CombatantRow
              key={creature.id}
              combatant={combatant}
              locale={locale}
              onUpdate={(updated) => handleUpdateCreature(index, updated)}
              onRemoveSessionOnly={() => handleRemoveCreature(index)}
              disableLocking={true}
            />
          );
        })}
      </div>
    </div>
  );
};
