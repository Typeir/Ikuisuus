/**
 * @fileoverview Spell List Editor Component
 * @description Reusable component for managing spell lists with metadata-backed combobox.
 * Fetches spell links on demand and renders spells with wiki links.
 * Used in both CreatureRow (design mode) and PlayModeCombatantRow (play mode).
 *
 * @module spellListEditor
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react Client-side state, effects, and callbacks
 * @requires @/modules/encounter-planner/domain/encounters/encounter.types SpellRef type
 * @requires ../comboboxes/spellCombobox Spell selection dropdown
 * @requires ../creatureRow.module.scss Shared component styles
 *
 * @example
 * ```tsx
 * <SpellListEditor
 *   spells={creature.spells}
 *   onChange={(spells) => updateCreature({ spells })}
 * />
 * ```
 */

'use client';

import { useSpellLinks } from '@/lib/hooks/data/useEncounterData';
import type { SpellRef } from '@/modules/encounter-planner/domain/encounters/encounter.types';
import { X } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useCallback } from 'react';
import { SpellCombobox } from '../comboboxes';
import styles from '../creatureRow.module.scss';
import btn from '@/styles/buttons.module.scss';

/**
 * @interface SpellListEditorProps
 * Configuration for SpellListEditor component
 * @property {SpellRef[]} spells - Current spell list
 * @property {(spells: SpellRef[]) => void} onChange - Callback when spell list changes
 * @property {boolean} [readOnly=false] - Whether editing is disabled
 * @property {string} [removeChipAriaLabel] - Accessibility label for remove button
 */
interface SpellListEditorProps {
  spells: SpellRef[];
  onChange: (spells: SpellRef[]) => void;
  readOnly?: boolean;
  removeChipAriaLabel?: string;
}

/**
 * Spell list editor with combobox and link fetching.
 * Displays spell chips with wiki links, fetches links on demand from API.
 *
 * @component
 * @param {SpellListEditorProps} props - Component props
 * @param {SpellRef[]} props.spells - Current spell references
 * @param {(spells: SpellRef[]) => void} props.onChange - Callback when spell list changes
 * @param {boolean} [props.readOnly] - Whether the editor is read-only
 * @param {string} [props.removeChipAriaLabel] - Aria label for remove chip buttons
 * @returns {JSX.Element} Rendered spell list with add/remove controls
 *
 * @example
 * ```tsx
 * <SpellListEditor
 *   spells={[{ slug: 'fireball' }]}
 *   onChange={setSpells}
 *   readOnly={false}
 * />
 * ```
 */
export const SpellListEditor: React.FC<SpellListEditorProps> = ({
  spells,
  onChange,
  readOnly = false,
  removeChipAriaLabel = 'Remove spell',
}) => {
  const locale = useLocale();
  const spellLinks = useSpellLinks(
    spells.map((spell) => spell.slug),
    locale,
  );

  const handleAddSpell = useCallback(
    (spell: SpellRef) => {
      const spellAlreadyExists = spells.some((s) => s.slug === spell.slug);
      if (spellAlreadyExists) return;
      onChange([...spells, spell]);
    },
    [spells, onChange],
  );

  const handleRemoveSpell = useCallback(
    (slug: string) => {
      onChange(spells.filter((s) => s.slug !== slug));
    },
    [spells, onChange],
  );

  return (
    <>
      <div className={styles.chips}>
        {spells.map((spell) => {
          const spellLink = spellLinks[spell.slug];
          return (
            <div key={spell.slug} className={styles.chip}>
              {spellLink ? (
                <a
                  href={spellLink}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={styles.affixLink}>
                  {spell.slug}
                </a>
              ) : (
                <span>{spell.slug}</span>
              )}
              {!readOnly && (
                <button
                  onClick={() => handleRemoveSpell(spell.slug)}
                  className={btn.iconDanger}
                  aria-label={removeChipAriaLabel}>
                  <X size={12} aria-hidden='true' />
                </button>
              )}
            </div>
          );
        })}
      </div>
      {!readOnly && (
        <div className={styles.spellComboboxWrapper}>
          <SpellCombobox onSelect={handleAddSpell} />
        </div>
      )}
    </>
  );
};
