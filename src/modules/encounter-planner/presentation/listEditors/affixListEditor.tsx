/**
 * @fileoverview Affix List Editor Component
 * @description Reusable component for managing affix lists with optional source links.
 * Tracks affixes as "not found" if no source link is available (dashed border styling).
 * Used in both CreatureRow (design mode) and PlayModeCombatantRow (play mode).
 *
 * @module modules/encounter-planner/presentation/listEditors/affixListEditor
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react Client-side callbacks and memoization
 * @requires @/modules/encounter-planner/domain/encounters/encounter.types AffixEntry type
 * @requires ../comboboxes/affixCombobox Affix selection dropdown
 * @requires ../creatureRow.module.scss Shared component styles
 *
 * @example
 * ```tsx
 * <AffixListEditor
 *   affixes={creature.affixes}
 *   onChange={(affixes) => updateCreature({ affixes })}
 * />
 * ```
 */

'use client';

import type { AffixEntry } from '@/modules/encounter-planner/domain/encounters/encounter.types';
import { useCallback, useMemo } from 'react';
import { AffixCombobox } from '../comboboxes';
import styles from '../creatureRow.module.scss';
import { IconButton } from '@/lib/components/ui/iconButton';

/**
 * Props for AffixListEditor component
 * @interface AffixListEditorProps
 * @property {AffixEntry[]} affixes - Current affix list
 * @property {Function} onChange - Callback when affix list changes
 * @property {boolean} [readOnly=false] - Whether editing is disabled
 * @property {string} [removeChipAriaLabel] - Accessibility label for remove button
 */
interface AffixListEditorProps {
  affixes: AffixEntry[];
  onChange: (affixes: AffixEntry[]) => void;
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
 * @param {AffixEntry[]} props.affixes - Current affix entries
 * @param {(affixes: AffixEntry[]) => void} props.onChange - Callback when affix list changes
 * @param {boolean} [props.readOnly] - Whether the editor is read-only
 * @param {string} [props.removeChipAriaLabel] - Aria label for remove chip buttons
 * @returns {JSX.Element} Rendered affix list with add/remove controls
 *
 * @example
 * ```tsx
 * <AffixListEditor
 *   affixes={[{ text: 'Affix 1', source: { href: '/link' } }]}
 *   onChange={setAffixes}
 *   readOnly={false}
 * />
 * ```
 */
export const AffixListEditor: React.FC<AffixListEditorProps> = ({
  affixes,
  onChange,
  readOnly = false,
  removeChipAriaLabel = 'Remove affix',
}) => {
  /** Track which affixes have no source (not found) */
  const notFoundAffixes = useMemo(
    () => new Set(affixes.filter((a) => !a.source?.href).map((a) => a.text)),
    [affixes],
  );

  const handleAddAffix = useCallback(
    (affix: AffixEntry) => {
      /** Deduplicate: skip if affix already exists */
      if (affixes.some((a) => a.text === affix.text)) return;
      onChange([...affixes, affix]);
    },
    [affixes, onChange],
  );

  const handleRemoveAffix = useCallback(
    (index: number) => {
      onChange(affixes.filter((_, i) => i !== index));
    },
    [affixes, onChange],
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
                <IconButton
                  kind='close'
                  label={removeChipAriaLabel}
                  onClick={() => handleRemoveAffix(idx)}
                />
              )}
            </div>
          );
        })}
      </div>
      {!readOnly && (
        <AffixCombobox
          existingAffixes={affixes.map((a) => a.text)}
          onSelect={handleAddAffix}
        />
      )}
    </>
  );
};
