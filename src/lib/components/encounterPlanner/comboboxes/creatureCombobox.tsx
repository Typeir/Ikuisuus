/**
 * @fileoverview Creature Combobox Component
 * @description Searchable dropdown for importing creatures from monster library.
 * Built on top of GenericCombobox for consistent behavior. Fetches monster data
 * from /api/monsters/index and renders with size/type/CR information.
 *
 * @module creatureCombobox
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react Client-side state and effects
 * @requires next-intl Internationalized translations
 * @requires ./genericCombobox Base combobox component
 *
 * @example
 * ```tsx
 * <CreatureCombobox
 *   locale="en"
 *   onSelect={(slug) => importCreature(slug)}
 * />
 * ```
 */

'use client';

import { useCreatureIndex } from '@/lib/hooks/data/useEncounterData';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import styles from './combobox.module.scss';
import { ComboboxItem, GenericCombobox } from './genericCombobox';

/**
 * Monster index entry with metadata fields
 * @interface MonsterIndexEntry
 */
interface MonsterIndexEntry extends ComboboxItem {
  slug: string;
  title: string;
  cr: string;
  size: string;
  creatureType: string;
}

/**
 * Props for CreatureCombobox component
 * @interface CreatureComboboxProps
 * @property {Function} onSelect - Callback with selected monster slug
 */
interface CreatureComboboxProps {
  onSelect: (slug: string) => void;
}

/**
 * Creature combobox wrapper around GenericCombobox.
 * Fetches monster index from API and provides creature-specific rendering.
 *
 * @component
 * @param {CreatureComboboxProps} props - Component props
 * @param {(slug: string) => void} props.onSelect - Callback with selected monster slug
 * @returns {JSX.Element} Rendered creature combobox
 *
 * @example
 * ```tsx
 * <CreatureCombobox
 *   locale="en"
 *   onSelect={(slug) => addCreature(slug)}
 * />
 * ```
 */
export const CreatureCombobox: React.FC<CreatureComboboxProps> = ({
  onSelect,
}) => {
  const t = useTranslations('encounterPlanner');
  const locale = useLocale();
  const { items: monsterIndex, isLoading } = useCreatureIndex(locale);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <GenericCombobox
      items={monsterIndex}
      isLoading={isLoading}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onSelect={(monster) => onSelect(monster.slug)}
      placeholder={t('searchCreatures')}
      noResultsMessage={t('noCreaturesFound')}
      renderItem={(monster) => (
        <>
          <div className={styles.spellTitle}>{monster.title}</div>
          <div className={styles.spellMeta}>
            {monster.size} {monster.creatureType} • CR {monster.cr}
          </div>
        </>
      )}
    />
  );
};
