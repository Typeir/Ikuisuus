/**
 * @fileoverview Encounter Planner Page
 * @description Dedicated page for the encounter planner tool at /[locale]/utils/encounter-planner.
 * Provides interface for creating, managing, and tracking combat encounters with full
 * creature stat management, initiative tracking, and condition monitoring.
 *
 * @module encounterPlannerPage
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires @/modules/encounter-planner/presentation/EncounterPlanner/useEncounterPlannerState Encounter planner state hook
 * @requires @/modules/encounter-planner/presentation/combatantRow Encounter planner combatant row component
 * @requires @/modules/encounter-planner/presentation/comboboxes Encounter planner combobox component
 * @requires @/modules/encounter-planner/presentation/importer Encounter planner importer component
 * @requires @/modules/encounter-planner/presentation/playMode Encounter planner play mode component
 *
 * @example
 * ```
 * Route: /en/utils/encounter-planner
 * Route: /es/utils/encounter-planner
 * ```
 */

'use client';

import { CombatantRow } from '@/modules/encounter-planner/presentation/combatantRow';
import { EncounterCombobox } from '@/modules/encounter-planner/presentation/comboboxes';
import styles from '@/modules/encounter-planner/presentation/EncounterPlanner/encounterPlanner.module.scss';
import { useEncounterPlannerState } from '@/modules/encounter-planner/presentation/EncounterPlanner/useEncounterPlannerState';
import { MonsterImporter } from '@/modules/encounter-planner/presentation/importer';
import { PlayMode } from '@/modules/encounter-planner/presentation/playMode';
import { useTranslations } from 'next-intl';
import React from 'react';

/**
 * Encounter Planner page component.
 * Implements the route UI directly from encounter planner module parts.
 *
 * @function EncounterPlannerPage
 * @returns {JSX.Element} Rendered page with encounter planner
 */
export default function EncounterPlannerPage(): JSX.Element {
  const t = useTranslations('encounterPlanner');
  const {
    encounter,
    encounters,
    isSaving,
    showCreatureImport,
    inProgressCombat,
    fileInputRef,
    handleNameChange,
    handleNewEncounter,
    handleLoadEncounter,
    handleDeleteEncounter,
    handleStartCombat,
    handleExitPlayMode,
    handleResumeCombat,
    handleExport,
    handleImport,
    handleFileChange,
    handleAddCreature,
    handleImportCreatures,
    handleUpdateCreature,
    handleRemoveCreature,
    setShowCreatureImport,
    resumeCombatAvailable,
    createInProgressCombatant,
  } = useEncounterPlannerState();

  if (!encounter) {
    return <div className={styles.loading}>{t('loading')}</div>;
  }

  if (inProgressCombat) {
    return <PlayMode combat={inProgressCombat} onExit={handleExitPlayMode} />;
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
            className={`${styles.buttonBase} ${styles.buttonPrimary}`}>
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
            onChange={(event) => handleNameChange(event.target.value)}
            placeholder={t('encounterName')}
          />
          <div className={styles.saveIndicator}>
            {isSaving ? t('saveIndicator') : t('savedIndicator')}
          </div>
        </div>
        <div className={styles.controls}>
          <button
            onClick={handleStartCombat}
            className={`${styles.buttonBase} ${styles.buttonPrimary}`}>
            {t('startCombat')}
          </button>
          <button onClick={handleNewEncounter} className={styles.buttonBase}>
            {t('newEncounter')}
          </button>
          <div className={styles.encounterComboboxWrap}>
            <EncounterCombobox
              encounters={encounters}
              currentEncounterId={encounter.id}
              onSelect={handleLoadEncounter}
            />
          </div>
          <button onClick={handleExport} className={styles.buttonBase}>
            {t('exportEncounter')}
          </button>
          <button onClick={handleImport} className={styles.buttonBase}>
            {t('importEncounter')}
          </button>
          <button
            onClick={handleDeleteEncounter}
            className={`${styles.buttonBase} ${styles.buttonDanger}`}>
            {t('deleteEncounter')}
          </button>
          <input
            ref={fileInputRef as React.RefObject<HTMLInputElement>}
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
          className={`${styles.buttonBase} ${styles.buttonPrimary}`}>
          {t('addCreature')}
        </button>
        <button
          onClick={() => setShowCreatureImport(!showCreatureImport)}
          className={`${styles.buttonBase} ${styles.buttonSecondary}`}>
          {t('importCreature')}
        </button>
        {showCreatureImport && (
          <div className={styles.importContainer}>
            <MonsterImporter onImport={handleImportCreatures} />
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
              onUpdate={(updated) => handleUpdateCreature(index, updated)}
              onRemoveSessionOnly={() => handleRemoveCreature(index)}
              disableLocking={true}
            />
          );
        })}
      </div>
    </div>
  );
}
