/**
 * @fileoverview Encounter Planner Page
 * @description Page component for /[locale]/utils/encounter-planner. Renders encounter
 * management, creature import, and combat tracking UI from encounter planner module parts.
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

import type { JSX } from 'react';
import { CombatantRow } from '@/modules/encounter-planner/presentation/combatantRow';
import { EncounterCombobox } from '@/modules/encounter-planner/presentation/comboboxes';
import styles from '@/modules/encounter-planner/presentation/EncounterPlanner/encounterPlanner.module.scss';
import btn from '@/styles/buttons.module.scss';
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
  const tCommon = useTranslations('common');
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
    return <div className={styles.loading}>{tCommon('loading')}</div>;
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
          <button onClick={handleResumeCombat}>{t('resumeCombat')}</button>
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
          <button onClick={handleStartCombat}>{t('startCombat')}</button>
          <button onClick={handleNewEncounter} className={btn.neutral}>
            {t('newEncounter')}
          </button>
          <div className={styles.encounterComboboxWrap}>
            <EncounterCombobox
              encounters={encounters}
              currentEncounterId={encounter.id}
              onSelect={handleLoadEncounter}
            />
          </div>
          <button onClick={handleExport} className={btn.neutral}>
            {t('exportEncounter')}
          </button>
          <button onClick={handleImport} className={btn.neutral}>
            {t('importEncounter')}
          </button>
          <button onClick={handleDeleteEncounter} className={btn.dangerOutline}>
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
        <button onClick={handleAddCreature}>{t('addCreature')}</button>
        <button onClick={() => setShowCreatureImport(!showCreatureImport)}>
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
