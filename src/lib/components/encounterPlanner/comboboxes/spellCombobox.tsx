/**
 * @fileoverview Spell Combobox Component
 * @description Searchable dropdown for selecting spells from metadata index.
 * Built on top of GenericCombobox for consistent behavior. Fetches spell data
 * from /api/spells/index and renders with level/school information.
 *
 * @module spellCombobox
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react Client-side state and effects
 * @requires next-intl Internationalized translations
 * @requires @/lib/types/encounterPlanner SpellRef type
 * @requires ./genericCombobox Base combobox component
 *
 * @example
 * ```tsx
 * <SpellCombobox
 *   locale="en"
 *   onSelect={(spell) => console.log(spell.slug)}
 * />
 * ```
 */

'use client';

import { useSpellIndex } from '@/lib/hooks/data/useEncounterData';
import type { SpellRef } from '@/lib/types/encounterPlanner';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import styles from './combobox.module.scss';
import { ComboboxItem, GenericCombobox } from './genericCombobox';

/**
 * Spell index entry with metadata fields
 * @interface SpellIndexEntry
 */
interface SpellIndexEntry extends ComboboxItem {
  slug: string;
  title: string;
  level: number;
  school: string;
}

/**
 * Props for SpellCombobox component
 * @interface SpellComboboxProps
 * @property {string} locale - Current locale for API requests
 * @property {Function} onSelect - Callback when spell is selected
 */
interface SpellComboboxProps {
  locale: string;
  onSelect: (spell: SpellRef) => void;
}

/**
 * Spell combobox wrapper around GenericCombobox.
 * Fetches spell index from API and provides spell-specific rendering.
 *
 * @component
 * @param {SpellComboboxProps} props - Component props
 * @param {string} props.locale - Current locale for API requests
 * @param {(spell: SpellRef) => void} props.onSelect - Callback with selected spell reference
 * @returns {JSX.Element} Rendered spell combobox
 *
 * @example
 * ```tsx
 * <SpellCombobox
 *   locale="en"
 *   onSelect={(spell) => addSpell(spell)}
 * />
 * ```
 */
export const SpellCombobox: React.FC<SpellComboboxProps> = ({
  locale,
  onSelect,
}) => {
  const t = useTranslations('encounterPlanner');
  const { items: spellIndex, isLoading } = useSpellIndex(locale);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <GenericCombobox
      items={spellIndex}
      isLoading={isLoading}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onSelect={(spell) => onSelect({ slug: spell.slug })}
      placeholder={t('searchSpells')}
      noResultsMessage={t('noSpellsFound')}
      renderItem={(spell) => (
        <>
          <div className={styles.spellTitle}>{spell.title}</div>
          <div className={styles.spellMeta}>
            Level {spell.level} {spell.school}
          </div>
        </>
      )}
    />
  );
};
