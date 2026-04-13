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

import { useNotifications } from '@/lib/components/ui';
import type {
    InProgressCombat,
    InProgressCombatant,
} from '@/lib/types/inProgressCombat';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CombatantRow } from '../combatantRow';
import { MonsterImporter } from '../importer';
import { PartyManager } from '../partyManager';
import styles from './playMode.module.scss';
import { PlayModeLifecycle } from './playModeLifecycle';
import { usePlayModeLifecycleNotifications } from './playModeLifecycleNotifications';
import { usePlayModeHandlers } from './usePlayModeHandlers';

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
 * Play Mode component for running combats as a turn tracker
 *
 * @component
 * @param {PlayModeProps} props - Component props
 * @param {InProgressCombat} props.combat - Initial combat state
 * @param {() => void} props.onExit - Callback when exiting play mode
 * @param {string} props.locale - Current locale for API requests
 * @returns {JSX.Element} Rendered play mode interface
 */
export const PlayMode: React.FC<PlayModeProps> = ({
  combat: initialCombat,
  onExit,
  locale,
}) => {
  const t = useTranslations('encounterPlanner');
  const notifications = useNotifications();
  const [combat, setCombat] = useState<InProgressCombat>(initialCombat);
  const [partyManagerOpen, setPartyManagerOpen] = useState(false);
  const lifecycle = useMemo(() => new PlayModeLifecycle(), []);
  const combatantRefs = useRef<Record<string, HTMLDivElement>>({});

  usePlayModeLifecycleNotifications({
    lifecycle,
    notifications,
    t,
  });

  const {
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
  } = usePlayModeHandlers({
    combat,
    setCombat,
    locale,
    onExit,
    lifecycle,
    notifications,
    t,
  });

  useEffect(() => {
    return () => {
      lifecycle.clear();
    };
  }, [lifecycle]);

  useEffect(() => {
    const activeCombatantId = combat.turnOrder[combat.activeTurnIndex];
    const ref = combatantRefs.current[activeCombatantId];
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [combat.activeTurnIndex, combat.turnOrder]);

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
            {t('turn')} {combat.activeTurnIndex + 1} /{' '}
            {combat.combatants.length}
          </span>
        </div>
        <button
          onClick={onExit}
          className={`${styles.button} ${styles.exitButton}`}
          aria-label={t('exitPlayMode')}>
          <X size={18} aria-hidden='true' />
        </button>
      </div>

      <div className={styles.playModeControls}>
        <button
          onClick={handleEndTurn}
          className={`${styles.button} ${styles.buttonPrimary}`}>
          {t('endTurn')}
        </button>

        <button
          onClick={handleSortByInitiative}
          className={`${styles.button} ${styles.buttonSecondary}`}>
          {t('sortByInitiative')}
        </button>

        <button
          onClick={handleImportCombat}
          className={`${styles.button} ${styles.buttonSecondary}`}>
          {t('importCombat')}
        </button>

        <button
          onClick={handleExport}
          className={`${styles.button} ${styles.buttonSecondary}`}>
          {t('exportInProgress')}
        </button>

        <button
          onClick={handleEndCombat}
          className={`${styles.button} ${styles.buttonDanger} ${styles.endCombatButton}`}>
          {t('endCombat')}
        </button>

        <input
          ref={fileInputRef}
          type='file'
          accept='.json'
          onChange={handleCombatFileChange}
          className={styles.hiddenFileInput}
        />
      </div>

      <div className={styles.sessionOnlyControls}>
        <div className={styles.sessionOnlyRow}>
          <input
            type='text'
            className={styles.sessionOnlyInput}
            value={sessionOnlyName}
            onChange={(e) => setSessionOnlyName(e.target.value)}
            onKeyDown={(e) =>
              e.key === 'Enter' && handleAddSessionOnlyCombatant()
            }
            placeholder={t('addSessionOnlyCombatant')}
          />
          <button
            onClick={handleAddSessionOnlyCombatant}
            className={`${styles.button} ${styles.buttonSecondary}`}>
            {t('addCombatant')}
          </button>
        </div>

        <div className={styles.sessionOnlyRow}>
          <MonsterImporter locale={locale} onImport={handleImportCreatures} />
        </div>

        <div className={styles.sessionOnlyRow}>
          <button
            onClick={() => setPartyManagerOpen(true)}
            className={`${styles.button} ${styles.buttonSecondary}`}>
            {t('manageParties')}
          </button>
        </div>
      </div>

      <PartyManager
        isOpen={partyManagerOpen}
        onClose={() => setPartyManagerOpen(false)}
        onImport={(party) => {
          handleImportParty(party);
          notifications.success(
            t('partyImported', {
              name: party.name,
              count: party.members.length,
            }),
          );
          setPartyManagerOpen(false);
        }}
      />

      <div className={styles.combatantList}>
        {combat.turnOrder.map((combatantId) => {
          const combatant = combat.combatants.find((c) => c.id === combatantId);
          if (!combatant) return null;
          const index = combat.combatants.findIndex(
            (c) => c.id === combatantId,
          );
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
                onUpdate={(updated: InProgressCombatant) =>
                  handleUpdateCombatant(index, () => updated)
                }
                onRemoveSessionOnly={
                  combatant.sessionOnly
                    ? () => handleRemoveSessionOnly(combatant.id)
                    : undefined
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
