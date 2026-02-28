/**
 * @fileoverview Play Mode Component
 * @description Turn tracker and combat runner for in-progress encounters.
 * Displays combatants in initiative order with runtime editing and auto-scroll to active combatant.
 * 
 * @module playMode
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { logger } from '@/lib/logging/logger';
import type { InProgressCombat, InProgressCombatant } from '@/lib/types/inProgressCombat';
import { createCreatureFromMonster, generateId } from '@/lib/utils/encounterStorage';
import type { MonsterData } from '@/lib/utils/monsterCache';
import {
    createInProgressCombatant,
    deleteInProgressCombat,
    exportInProgressCombat,
    getNextActiveCombatantIndex,
    resortCombatants,
    saveInProgressCombat,
    setActiveInProgressCombatId,
} from '@/lib/utils/inProgressCombatStorage';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MonsterImporter } from '../importer';
import { Tooltip, useNotifications } from '@/lib/components/ui';
import styles from './playMode.module.scss';
import { CombatantRow } from '../combatantRow';

const log = logger.child({ module: 'PlayMode' });

/**
 * Props for PlayMode component
 * 
 * @interface PlayModeProps
 * @property {InProgressCombat} combat - Initial combat state
 * @property {() => void} onExit - Callback when exiting play mode
 * @property {string} locale - Current locale for API requests
 */
interface PlayModeProps {
  combat: InProgressCombat;
  onExit: () => void;
  locale: string;
}

/**
 * Creates multiple in-progress combatants from monster data.
 * Each combatant gets unique ID and is marked as session-only.
 * 
 * @function createMultipleCombatantsFromMonster
 * @param {MonsterData} monsterData - Monster metadata from API
 * @param {string} locale - Locale for wiki links
 * @param {number} quantity - Number of combatants to create
 * @param {Function} createCreature - Factory for base creature
 * @param {Function} createCombatant - Factory for in-progress combatant
 * @returns {InProgressCombatant[]} Array of session-only combatants
 */
function createMultipleCombatantsFromMonster(
  monsterData: MonsterData,
  locale: string,
  quantity: number,
  createCreature: (data: any, locale: string) => any,
  createCombatant: (creature: any) => InProgressCombatant
): InProgressCombatant[] {
  const safeQuantity = Math.max(1, Math.min(20, Math.floor(quantity)));
  const combatants: InProgressCombatant[] = [];

  for (let i = 0; i < safeQuantity; i++) {
    const baseCreature = createCreature(monsterData, locale);
    const newCombatant = createCombatant(baseCreature);
    newCombatant.sessionOnly = true;
    combatants.push(newCombatant);
  }

  return combatants;
}

/**
 * Play Mode component for running combats as a turn tracker
 * 
 * @component
 * @param {PlayModeProps} props - Component props
 * @param {InProgressCombat} props.combat - Initial combat state
 * @param {() => void} props.onExit - Callback when exiting play mode
 * @param {string} props.locale - Current locale for API requests
 * @returns {JSX.Element} Rendered play mode interface
 */
export const PlayMode: React.FC<PlayModeProps> = ({ combat: initialCombat, onExit, locale }) => {
  const t = useTranslations('encounterPlanner');
  const notifications = useNotifications();
  const [combat, setCombat] = useState<InProgressCombat>(initialCombat);
  const [sessionOnlyName, setSessionOnlyName] = useState('');
  const [prevRoundNumber, setPrevRoundNumber] = useState(initialCombat.roundNumber);
  const combatantRefs = useRef<Record<string, HTMLDivElement>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Trigger lair notification when round advances
  useEffect(() => {
    if (combat.roundNumber > prevRoundNumber) {
      setPrevRoundNumber(combat.roundNumber);
      const hasLairCreaturesWithDeeds = combat.combatants.some(c => 
        !c.slain && 
        c.mechanics?.lair &&
        c.legendaryDeedsUsed.some(used => !used)
      );
      if (hasLairCreaturesWithDeeds) {
        notifications.warning(t('lairAlert'), {
          title: t('lairAlertTitle'),
          duration: 8000,
        });
      }
    }
  }, [combat.roundNumber, combat.combatants, prevRoundNumber, notifications, t]);

  useEffect(() => {
    const activeCombatantId = combat.turnOrder[combat.activeTurnIndex];
    const ref = combatantRefs.current[activeCombatantId];
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [combat.activeTurnIndex, combat.turnOrder]);

  const updateCombat = useCallback((updater: (c: InProgressCombat) => InProgressCombat) => {
    setCombat((prev) => {
      const updated = updater(prev);
      saveInProgressCombat(updated);
      return updated;
    });
  }, []);

  const handleUpdateCombatant = useCallback(
    (index: number, updater: (c: InProgressCombatant) => InProgressCombatant) => {
      updateCombat((prev) => {
        const combatants = [...prev.combatants];
        combatants[index] = updater(combatants[index]);
        return { ...prev, combatants };
      });
    },
    [updateCombat]
  );

  const handleEndTurn = useCallback(() => {
    updateCombat((prev) => {
      const nextIndex = getNextActiveCombatantIndex(prev.combatants, prev.turnOrder, prev.activeTurnIndex);
      let roundNumber = prev.roundNumber;
      let combatants = [...prev.combatants];

      const isNewRound = nextIndex <= prev.activeTurnIndex && prev.turnOrder.length > 0;
      if (isNewRound) {
        roundNumber++;
      }

      // Reset deeds for the creature whose turn is starting
      if (nextIndex < combatants.length) {
        combatants[nextIndex] = {
          ...combatants[nextIndex],
          legendaryDeedsUsed: combatants[nextIndex].legendaryDeedsUsed.map(() => false)
        };
      }

      return {
        ...prev,
        combatants,
        activeTurnIndex: nextIndex,
        roundNumber,
      };
    });
  }, [updateCombat]);

  const handleSortByInitiative = useCallback(() => {
    updateCombat((prev) => resortCombatants(prev));
  }, [updateCombat]);

  const handleAddSessionOnlyCombatant = useCallback(() => {
    if (!sessionOnlyName.trim()) return;

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
      proficiencyBonus: null,
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

    updateCombat((prev) => {
      const combatants = [...prev.combatants, newCombatant];
      const turnOrder = [newCombatant.id, ...prev.turnOrder];

      return {
        ...prev,
        combatants,
        turnOrder,
      };
    });

    setSessionOnlyName('');
  }, [sessionOnlyName, updateCombat]);

  const handleRemoveSessionOnly = useCallback(
    (id: string) => {
      updateCombat((prev) => {
        const combatants = prev.combatants.filter((c) => c.id !== id);
        const turnOrder = prev.turnOrder.filter((cid) => cid !== id);
        const activeTurnIndex = Math.min(prev.activeTurnIndex, combatants.length - 1);

        return {
          ...prev,
          combatants,
          turnOrder,
          activeTurnIndex: Math.max(0, activeTurnIndex),
        };
      });
    },
    [updateCombat]
  );

  const handleImportCreatures = useCallback(
    (monsterData: MonsterData, quantity: number) => {
      const newCombatants = createMultipleCombatantsFromMonster(
        monsterData,
        locale,
        quantity,
        createCreatureFromMonster,
        createInProgressCombatant
      );

      updateCombat((prev) => {
        const combatants = [...prev.combatants, ...newCombatants];
        const newTurnOrder = newCombatants.map((c) => c.id);

        return {
          ...prev,
          combatants,
          turnOrder: [...newTurnOrder, ...prev.turnOrder],
        };
      });
    },
    [locale, updateCombat]
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
    const a = document.createElement('a');
    a.href = url;
    a.download = `${combat.encounterName}-combat.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [combat]);

  const handleImportCombat = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleCombatFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text) as InProgressCombat;
        setCombat(data);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (error) {
        log.error('Failed to import combat', {
          error: error instanceof Error ? error.message : String(error)
        });
        alert(t('importError'));
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [t]
  );

  const activeCombatantId = combat.turnOrder[combat.activeTurnIndex];

  return (
    <div className={styles.playMode}>
      <div className={styles.playModeHeader}>
        <h2>{t('playMode')}</h2>
        <div className={styles.combatInfo}>
          <span>
            {t('round')} {combat.roundNumber}
          </span>
          <span>
            {t('turn')} {combat.activeTurnIndex + 1} / {combat.combatants.length}
          </span>
        </div>
        <button onClick={onExit} className={`${styles.button} ${styles.exitButton}`} aria-label={t('exitPlayMode')}>
          ✕
        </button>
      </div>

      <div className={styles.playModeControls}>
        <button onClick={handleEndTurn} className={`${styles.button} ${styles.buttonPrimary}`}>
          {t('endTurn')}
        </button>

        <button onClick={handleSortByInitiative} className={`${styles.button} ${styles.buttonSecondary}`}>
          {t('sortByInitiative')}
        </button>

        <button onClick={handleImportCombat} className={`${styles.button} ${styles.buttonSecondary}`}>
          {t('importCombat')}
        </button>

        <button onClick={handleExport} className={`${styles.button} ${styles.buttonSecondary}`}>
          {t('exportInProgress')}
        </button>

        <button onClick={handleEndCombat} className={`${styles.button} ${styles.buttonDanger}`} style={{ marginLeft: 'auto' }}>
          {t('endCombat')}
        </button>

        <input
          ref={fileInputRef}
          type='file'
          accept='.json'
          onChange={handleCombatFileChange}
          style={{ display: 'none' }}
        />
      </div>

      <div className={styles.sessionOnlyControls}>
        <div className={styles.sessionOnlyRow}>
          <input
            type='text'
            className={styles.sessionOnlyInput}
            value={sessionOnlyName}
            onChange={(e) => setSessionOnlyName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSessionOnlyCombatant()}
            placeholder={t('addSessionOnlyCombatant')}
          />
          <button onClick={handleAddSessionOnlyCombatant} className={`${styles.button} ${styles.buttonSecondary}`}>
            {t('addCombatant')}
          </button>
        </div>

        <div className={styles.sessionOnlyRow}>
          <MonsterImporter locale={locale} onImport={handleImportCreatures} />
        </div>
      </div>

      <div className={styles.combatantList}>
        {combat.turnOrder.map((combatantId) => {
          const combatant = combat.combatants.find((c) => c.id === combatantId);
          if (!combatant) return null;
          const index = combat.combatants.findIndex((c) => c.id === combatantId);
          const isActive = combatantId === activeCombatantId;
          return (
            <div
              key={combatantId}
              ref={(el) => {
                if (el) combatantRefs.current[combatantId] = el;
              }}
              className={`${styles.combatantWrapper} ${isActive ? styles.active : ''} ${combatant.slain ? styles.slain : ''}`}>
              <CombatantRow
                combatant={combatant}
                locale={locale}
                onUpdate={(updated: InProgressCombatant) => handleUpdateCombatant(index, () => updated)}
                onRemoveSessionOnly={combatant.sessionOnly ? () => handleRemoveSessionOnly(combatant.id) : undefined}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
