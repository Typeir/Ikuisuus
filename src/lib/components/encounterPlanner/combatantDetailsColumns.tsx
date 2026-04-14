/**
 * @fileoverview Combatant Details Columns Component
 * @description Wrapper for the four-column details layout (buffs, items, spells, affixes).
 * Handles conditional rendering based on content presence. Each column only renders
 * if content is provided or showEmpty flag is true.
 * Used in both CreatureRow (design mode) and PlayModeCombatantRow (play mode).
 *
 * @module combatantDetailsColumns
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react ReactNode type for children
 * @requires next-intl Internationalized translations
 * @requires ./creatureRow.module.scss Shared component styles
 *
 * @example
 * ```tsx
 * <CombatantDetailsColumns
 *   buffs={<BuffListEditor ... />}
 *   spells={<SpellListEditor ... />}
 *   showEmpty={false}
 * />
 * ```
 */

'use client';

import { useTranslations } from 'next-intl';
import { ReactNode } from 'react';
import styles from './creatureRow.module.scss';

/**
 * @description Props for CombatantDetailsColumns component
 * @interface CombatantDetailsColumnsProps
 * @property {ReactNode} [buffs] - Buff list editor component
 * @property {ReactNode} [items] - Item list editor compone1nt
 * @property {ReactNode} [spells] - Spell list editor component
 * @property {ReactNode} [affixes] - Affix list editor component
 * @property {ReactNode} [conditions] - Conditions manager component
 * @property {boolean} [showEmpty=false] - Whether to show columns with no content
 */
interface CombatantDetailsColumnsProps {
  buffs?: ReactNode;
  items?: ReactNode;
  spells?: ReactNode;
  affixes?: ReactNode;
  conditions?: ReactNode;
  showEmpty?: boolean;
}

/**
 * @component
 * @description
 * Four-column layout wrapper for combatant details.
 * Each column conditionally renders based on content presence.
 *
 * @param {CombatantDetailsColumnsProps} props - Component props
 * @param {ReactNode} [props.buffs] - Buff list editor component
 * @param {ReactNode} [props.items] - Item list editor component
 * @param {ReactNode} [props.spells] - Spell list editor component
 * @param {ReactNode} [props.affixes] - Affix list editor component
 * @param {ReactNode} [props.conditions] - Conditions manager component
 * @param {boolean} [props.showEmpty=false] - Whether to show columns with no content
 * @returns {JSX.Element} Rendered details grid with visible columns
 *
 * @example
 * ```tsx
 * <CombatantDetailsColumns
 *   buffs={<BuffListEditor buffs={buffs} onChange={setBuffs} />}
 *   spells={<SpellListEditor spells={spells} onChange={setSpells} locale="en" />}
 *   conditions={<CombatantConditionsManager />}
 * />
 * ```
 */
export const CombatantDetailsColumns: React.FC<
  CombatantDetailsColumnsProps
> = ({ buffs, items, spells, affixes, conditions, showEmpty = false }) => {
  const t = useTranslations('encounterPlanner');

  return (
    <div className={styles.detailsGrid}>
      {(conditions || showEmpty) && (
        <div className={styles.detailsColumn}>
          <div className={styles.detailsColumnTitle}>{t('conditions')}</div>
          {conditions}
        </div>
      )}
      {(buffs || showEmpty) && (
        <div className={styles.detailsColumn}>
          <div className={styles.detailsColumnTitle}>{t('buffs')}</div>
          {buffs}
        </div>
      )}

      {(items || showEmpty) && (
        <div className={styles.detailsColumn}>
          <div className={styles.detailsColumnTitle}>{t('items')}</div>
          {items}
        </div>
      )}

      {(spells || showEmpty) && (
        <div className={styles.detailsColumn}>
          <div className={styles.detailsColumnTitle}>{t('spells')}</div>
          {spells}
        </div>
      )}

      {(affixes || showEmpty) && (
        <div className={styles.detailsColumn}>
          <div className={styles.detailsColumnTitle}>{t('affixes')}</div>
          {affixes}
        </div>
      )}
    </div>
  );
};
