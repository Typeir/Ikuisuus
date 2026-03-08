/**
 * @fileoverview Affix Combobox Component
 * @description Searchable dropdown for selecting heroic awakening affixes.
 * Built on top of GenericCombobox for consistent behavior. Fetches affix data
 * from /api/affixes/index and filters out already-selected affixes.
 *
 * @module affixCombobox
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react Client-side state and effects
 * @requires next-intl Internationalized translations
 * @requires @/lib/types/encounterPlanner AffixEntry type
 * @requires ./genericCombobox Base combobox component
 *
 * @example
 * ```tsx
 * <AffixCombobox
 *   locale="en"
 *   existingAffixes={['Affix 1', 'Affix 2']}
 *   onSelect={(affix) => console.log(affix)}
 * />
 * ```
 */

'use client';

import { logger } from '@/lib/logging/logger';
import type { AffixEntry } from '@/lib/types/encounterPlanner';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { ComboboxItem, GenericCombobox } from './genericCombobox';
import styles from './combobox.module.scss';

/**
 * Affix index entry with metadata fields
 * @interface AffixIndexEntry
 */
interface AffixIndexEntry extends ComboboxItem {
  slug: string;
  title: string;
  link: string;
}

/**
 * Props for AffixCombobox component
 * @interface AffixComboboxProps
 * @property {string} locale - Current locale for API requests
 * @property {string[]} existingAffixes - Affixes already selected (filtered out)
 * @property {Function} onSelect - Callback when affix is selected
 */
interface AffixComboboxProps {
  locale: string;
  existingAffixes: string[];
  onSelect: (affix: AffixEntry) => void;
}

/**
 * Affix combobox wrapper around GenericCombobox.
 * Fetches affix index from API and filters out existing affixes.
 *
 * @component
 * @param {AffixComboboxProps} props - Component props
 * @param {string} props.locale - Current locale for API requests
 * @param {string[]} props.existingAffixes - Affix names already selected (filtered out of dropdown)
 * @param {(affix: AffixEntry) => void} props.onSelect - Callback when an affix is selected
 * @returns {JSX.Element} Rendered affix combobox
 *
 * @example
 * ```tsx
 * <AffixCombobox
 *   locale="en"
 *   existingAffixes={creature.affixes.map(a => a.text)}
 *   onSelect={(affix) => addAffix(affix)}
 * />
 * ```
 */
export const AffixCombobox: React.FC<AffixComboboxProps> = ({
  locale,
  existingAffixes,
  onSelect,
}) => {
  const t = useTranslations('encounterPlanner');
  const [allAffixes, setAllAffixes] = useState<AffixIndexEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all affixes only once per locale
  useEffect(() => {
    const loadAffixIndex = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/affixes/index?locale=${locale}`);
        const data = await response.json();
        const mappedData = data.map((affix: any) => ({
          ...affix,
          id: affix.slug,
          searchableText: affix.title,
        }));
        setAllAffixes(mappedData);
      } catch (error) {
        logger.error('Failed to load affix index', { error: error instanceof Error ? error.message : String(error) });
      } finally {
        setIsLoading(false);
      }
    };

    loadAffixIndex();
  }, [locale]);

  // Filter out existing affixes on render (no effect needed)
  const filteredAffixes = allAffixes.filter((affix) => !existingAffixes.includes(affix.title));

  return (
    <GenericCombobox
      items={filteredAffixes}
      isLoading={isLoading}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onSelect={(affix) =>
        onSelect({
          text: affix.title,
          source: { href: affix.link },
        })
      }
      placeholder={t('searchAffixes')}
      noResultsMessage={t('noAffixesFound')}
      renderItem={(affix) => <div className={styles.spellTitle}>{affix.title}</div>}
    />
  );
};
