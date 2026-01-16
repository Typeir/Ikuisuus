/**
 * @fileoverview Affix List Editor Component
 * @description Reusable component for managing affix lists with optional source links.
 * Tracks affixes as "not found" if no source link is available (dashed border styling).
 * Used in both CreatureRow (design mode) and PlayModeCombatantRow (play mode).
 *
 * @module affixListEditor
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react Client-side callbacks and memoization
 * @requires @/lib/types/encounterPlanner AffixEntry type
 * @requires ../comboboxes/affixCombobox Affix selection dropdown
 * @requires ../creatureRow.module.scss Shared component styles
 *
 * @example
 * ```tsx
 * <AffixListEditor
 *   affixes={creature.affixes}
 *   onChange={(affixes) => updateCreature({ affixes })}
 *   locale="en"
 * />
 * ```
 */

'use client';

import type { AffixEntry } from '@/lib/types/encounterPlanner';
import { useCallback, useMemo } from 'react';
import { AffixCombobox } from '../comboboxes';
import styles from '../creatureRow.module.scss';

/**
 * Props for AffixListEditor component
 * @interface AffixListEditorProps
 * @property {AffixEntry[]} affixes - Current affix list
 * @property {Function} onChange - Callback when affix list changes
 * @property {string} locale - Current locale for API requests
 * @property {boolean} [readOnly=false] - Whether editing is disabled
 * @property {string} [removeChipAriaLabel] - Accessibility label for remove button
 */
interface AffixListEditorProps {
  affixes: AffixEntry[];
  onChange: (affixes: AffixEntry[]) => void;
  locale: string;
  readOnly?: boolean;
  removeChipAriaLabel?: string;
}

/**
 * Affix list editor with combobox and "not found" tracking.
 * Displays affix chips with optional links, applies .chipNotFound styling
 * (dashed border) when source link is missing.
 *
 * @component
 * @param {AffixListEditorProps} props - Component props
 * @returns {JSX.Element} Rendered affix list with add/remove controls
 *
 * @example
 * ```tsx
 * <AffixListEditor
 *   affixes={[{ text: 'Affix 1', source: { href: '/link' } }]}
 *   onChange={setAffixes}
 *   locale="en"
 *   readOnly={false}
 * />
 * ```
 */
export const AffixListEditor: React.FC<AffixListEditorProps> = ({
  affixes,
  onChange,
  locale,
  readOnly = false,
  removeChipAriaLabel = 'Remove affix',
}) => {
  // Track which affixes have no source (not found)
  const notFoundAffixes = useMemo(
    () => new Set(affixes.filter((a) => !a.source?.href).map((a) => a.text)),
    [affixes]
  );

  const handleAddAffix = useCallback(
    (affix: AffixEntry) => {
      // Check if affix already exists
      if (affixes.some((a) => a.text === affix.text)) return;
      onChange([...affixes, affix]);
    },
    [affixes, onChange]
  );

  const handleRemoveAffix = useCallback(
    (index: number) => {
      onChange(affixes.filter((_, i) => i !== index));
    },
    [affixes, onChange]
  );

  return (
    <>
      <div className={styles.chips}>
        {affixes.map((affixEntry, idx) => {
          const isNotFound = notFoundAffixes.has(affixEntry.text);
          return (
            <div
              key={idx}
              className={`${styles.chip} ${
                isNotFound ? styles.chipNotFound : ''
              }`}
              title={
                isNotFound ? 'Affix source not found' : affixEntry.source?.href
              }>
              {affixEntry.source?.href ? (
                <a
                  href={affixEntry.source.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={styles.affixLink}>
                  {affixEntry.text}
                </a>
              ) : (
                <span>{affixEntry.text}</span>
              )}
              {!readOnly && (
                <button
                  onClick={() => handleRemoveAffix(idx)}
                  className={styles.removeChip}
                  aria-label={removeChipAriaLabel}>
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
      {!readOnly && (
        <AffixCombobox
          locale={locale}
          existingAffixes={affixes.map((a) => a.text)}
          onSelect={handleAddAffix}
        />
      )}
    </>
  );
};
