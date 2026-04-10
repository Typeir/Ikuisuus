/**
 * Combatant Row Component
 *
 * @fileoverview Single combatant row for encounter management with runtime editing.
 * Displays combatant name, HP, AC, stats, initiative, and toggles for slain/details expansion.
 * Uses CombatantContext to provide state to all child components without prop drilling.
 *
 * @module combatantRow
 * @version 3.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react React hooks and ReactNode for component composition
 * @requires next-intl useTranslations hook for internationalization
 * @requires @/lib/types/inProgressCombat InProgressCombatant type definition
 * @requires @/lib/utils/heroicAwakeningStyles computeAwakeningClasses for visual styling
 * @requires ../combatantDetailsColumns Column layout for expanded details
 * @requires ../listEditors Buff, item, spell, affix list editors
 * @requires ../playMode/CombatantContext CombatantProvider and useCombatant hook
 * @requires ./combatantMainStats Displays HP, AC, stats, initiative, slain toggle
 * @requires ./combatantNameSection Displays name, CR, awakening badges
 * @requires ./combatantMechanicsSection Manages legendary deeds and resists
 * @requires ./combatantHeroicSection Manages heroic awakening state
 * @requires ./combatantConditionsManager Manages active conditions
 *
 * @description
 * The CombatantRow is the primary display component for combatants in both design mode
 * (EncounterPlanner) and play mode. It wraps all child components in CombatantProvider
 * to provide centralized state management via React Context, eliminating prop drilling.
 *
 * Layout:
 * 1. Name section (name, CR, awakening badges, lock toggle, remove button)
 * 2. Main stats row (HP, AC, ability scores, initiative, slain checkbox)
 * 3. Mechanics section (legendary deeds tracker, resist counter)
 * 4. Details section (collapsible):
 *    - Heroic section (awakening info, force awakening buttons)
 *    - Details columns (buffs, items, spells, affixes)
 *    - Conditions manager
 *
 * Styling:
 * - Applies awakening-related CSS classes dynamically
 * - Applies .slain class when combatant is marked as slain (opacity, strikethrough)
 * - Supports locked state for UI feedback
 */

'use client';

import type { AffixEntry, SpellRef } from '@/lib/types/encounterPlanner';
import type { InProgressCombatant } from '@/lib/types/inProgressCombat';
import { computeAwakeningClasses } from '@/lib/utils/heroicAwakeningStyles';
import { forceHeroicAwakeningWithAffixes } from '@/lib/utils/inProgressCombatStorage';
import { useTranslations } from 'next-intl';
import { AlignJustify } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { CombatantDetailsColumns } from '../combatantDetailsColumns';
import { AffixListEditor, BuffListEditor, ItemListEditor, SpellListEditor } from '../listEditors';
import { CombatantProvider, useCombatant } from './utils/context/combatantContext';
import { CombatantConditionsManager } from './combatantConditionsManager';
import { CombatantHeroicSection } from './combatantHeroicSection';
import { CombatantMainStats } from './combatantMainStats';
import { CombatantMechanicsSection } from './combatantMechanicsSection';
import { CombatantNameSection } from './combatantNameSection';
import styles from './combatantRow.module.scss';

/**
 * Props for CombatantRow component.
 *
 * @interface CombatantRowProps
 * @property {InProgressCombatant} combatant - The combatant data to display and edit
 * @property {string} locale - Current locale for translations (e.g., "en", "es", "fi")
 * @property {(combatant: InProgressCombatant) => void} onUpdate - Callback fired when combatant is updated
 * @property {() => void} [onRemoveSessionOnly] - Optional callback to remove session-only combatants
 * @property {boolean} [disableLocking=false] - If true, hides lock button and prevents stat locking
 */
export interface CombatantRowProps {
  combatant: InProgressCombatant;
  locale: string;
  onUpdate: (combatant: InProgressCombatant) => void;
  onRemoveSessionOnly?: () => void;
  disableLocking?: boolean;
}

/**
 * Row content component that consumes CombatantContext.
 *
 * @component
 * @description
 * This is the actual rendered content. It's separated from the main component
 * to allow clean context consumption without wrapper div interference.
 *
 * @returns {React.ReactElement} Rendered row content with all sections
 */
const CombatantRowContent: React.FC = () => {
  const { combatant, locale, updateField, onUpdate } = useCombatant();
  const t = useTranslations('encounterPlanner');
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const awakeningResult = useMemo(
    () => computeAwakeningClasses(combatant.heroicAwakening),
    [combatant.heroicAwakening]
  );

  const handleToggleLock = useCallback(
    (fieldName: string) => {
      const currentLocked = combatant.locked ?? [];
      const isLocked = currentLocked.includes(fieldName);
      const newLocked = isLocked
        ? currentLocked.filter((f) => f !== fieldName)
        : [...currentLocked, fieldName];
      updateField('locked', newLocked);
    },
    [combatant.locked, updateField]
  );

  const rowClassName = useMemo(() => {
    const classes = [styles.combatantRow];
    for (const className of awakeningResult.classNames) {
      if (styles[className]) {
        classes.push(styles[className]);
      }
    }
    if (combatant.slain) {
      classes.push(styles.slain);
    }
    return classes.join(' ');
  }, [awakeningResult.classNames, combatant.slain]);

  const handleBuffsChange = (newBuffs: string[]) => {
    updateField('details', { ...combatant.details, buffs: newBuffs });
  };

  const handleItemsChange = (newItems: string[]) => {
    updateField('details', { ...combatant.details, items: newItems });
  };

  const handleSpellsChange = (newSpells: SpellRef[]) => {
    updateField('details', { ...combatant.details, spells: newSpells });
  };

  const handleAffixesChange = (newAffixes: AffixEntry[]) => {
    const updated = { ...combatant, details: { ...combatant.details, affixes: newAffixes } };
    forceHeroicAwakeningWithAffixes(updated, newAffixes);
    onUpdate(updated);
  };

  return (
    <div className={rowClassName} data-testid='combatant-row'>
      <CombatantNameSection locked={combatant.locked} onToggleLock={handleToggleLock} />
      <CombatantMainStats locked={combatant.locked} />
      <CombatantMechanicsSection />

      <div className={styles.detailsWrapper}>
        <button
          className={styles.detailsToggle}
          onClick={() => setDetailsExpanded(!detailsExpanded)}
          title={detailsExpanded ? t('hideDetails') : t('showDetails')}
        >
          <span className={styles.hamburgerIcon}><AlignJustify size={14} aria-hidden='true' /></span>
          <span>{detailsExpanded ? t('hideDetails') : t('showDetails')}</span>
        </button>

        {detailsExpanded && (
          <div className={`${styles.detailsSection} ${rowClassName}`}>
            <CombatantHeroicSection />

            <CombatantDetailsColumns
              buffs={
                <BuffListEditor buffs={combatant.details.buffs} onChange={handleBuffsChange} />
              }
              items={
                <ItemListEditor items={combatant.details.items} onChange={handleItemsChange} />
              }
              spells={
                <SpellListEditor
                  spells={combatant.details.spells}
                  onChange={handleSpellsChange}
                  locale={locale}
                />
              }
              affixes={
                <AffixListEditor
                  affixes={combatant.details.affixes}
                  onChange={handleAffixesChange}
                  locale={locale}
                />
              }
            />

            <CombatantConditionsManager />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Combatant Row Component
 *
 * @component
 * @param {CombatantRowProps} props - Component props
 * @param {InProgressCombatant} props.combatant - The combatant data to display
 * @param {string} props.locale - Current locale for API requests and wiki links
 * @param {(combatant: InProgressCombatant) => void} props.onUpdate - Callback when combatant data changes
 * @param {() => void} [props.onRemoveSessionOnly] - Callback to remove session-only combatants
 * @param {boolean} [props.disableLocking] - Whether to disable field locking controls
 * @returns {React.ReactElement} CombatantProvider wrapping row content
 *
 * @example
 * // Typical usage in EncounterPlanner or PlayMode
 * const handleUpdate = (updated: InProgressCombatant) => {
 *   // Update your state with the new combatant data
 * };
 *
 * <CombatantRow
 *   combatant={combatant}
 *   locale="en"
 *   onUpdate={handleUpdate}
 * />
 */
export const CombatantRow: React.FC<CombatantRowProps> = ({
  combatant,
  locale,
  onUpdate,
  onRemoveSessionOnly,
  disableLocking = false,
}) => {
  return (
    <CombatantProvider
      combatant={combatant}
      locale={locale}
      onUpdate={onUpdate}
      onRemoveSessionOnly={onRemoveSessionOnly}
      disableLocking={disableLocking}
    >
      <CombatantRowContent />
    </CombatantProvider>
  );
};
