/**
 * @fileoverview Search field for MetadataTable, with aspect autocomplete.
 * @description Wears the root search's field and its `group:value`
 * autocomplete, resolving a picked token into a local aspect filter.
 *
 * @module lib/components/mdx/metadataTables/metadataTableSearch
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { displayAspects } from '@/modules/library/domain/aspects';
import { AspectPill } from '@/modules/library/presentation/components/Aspects/AspectPill';
import {
  AspectSuggestions,
  SearchField,
  useAspectAutocomplete,
  type PickedAspect,
} from '@/modules/search';
import { useTranslations } from 'next-intl';
import { useCallback, useRef, type JSX } from 'react';
import styles from './metadataTableSearch.module.scss';

/**
 * Props for {@link MetadataTableSearch}.
 *
 * @interface MetadataTableSearchProps
 * @property {string} value - Current free-text term
 * @property {string[]} aspects - Aspects the table is filtered by
 * @property {(value: string, aspects: string[]) => void} onChange - Receives the whole filter state on every change
 * @property {string} locale - Active locale, for pill labels
 * @property {boolean} [loading] - Pulses the field icon while a query is in flight
 */
export interface MetadataTableSearchProps {
  value: string;
  aspects: string[];
  onChange: (value: string, aspects: string[]) => void;
  locale: string;
  loading?: boolean;
}

/**
 * Table search field with aspect autocomplete and the pills it produces.
 *
 * @param {MetadataTableSearchProps} props - Component props
 * @returns {JSX.Element} The field, its suggestion list and the active pills
 *
 * @example
 * <MetadataTableSearch
 *   value={searchTerm}
 *   aspects={aspectFilters}
 *   onChange={handleSearchChange}
 *   locale='en'
 * />
 */
export function MetadataTableSearch({
  value,
  aspects,
  onChange,
  locale,
  loading = false,
}: MetadataTableSearchProps): JSX.Element {
  const t = useTranslations('tables.common');
  const tSearch = useTranslations('search');
  const inputRef = useRef<HTMLInputElement>(null);

  const applyAspect = useCallback(
    (picked: PickedAspect) => {
      const next = aspects.includes(picked.aspect)
        ? aspects
        : [...aspects, picked.aspect];
      onChange(picked.rest, next);
    },
    [aspects, onChange],
  );

  const {
    suggestions,
    activeIndex,
    suggesting,
    pickAt,
    trackCaret,
    handleChange,
    handleKeyDown,
  } = useAspectAutocomplete(value, applyAspect);

  const parsed = displayAspects(aspects);

  return (
    <div className={styles.searchBar}>
      <SearchField
        value={value}
        onChange={(next) => onChange(next, aspects)}
        placeholder={t('searchPlaceholder')}
        ariaLabel={t('searchPlaceholder')}
        loading={loading}
        inputRef={inputRef}
        inputProps={{
          onChange: handleChange,
          onKeyDown: handleKeyDown,
          onKeyUp: trackCaret,
          onClick: trackCaret,
          onSelect: trackCaret,
          role: 'combobox',
          'aria-expanded': suggesting,
          'aria-controls': 'search-aspect-suggestions',
          'aria-activedescendant':
            suggesting && activeIndex >= 0
              ? `search-aspect-${activeIndex}`
              : undefined,
        }}
      />

      {suggesting && (
        <AspectSuggestions
          suggestions={suggestions}
          activeIndex={activeIndex}
          onPick={pickAt}
          anchorRef={inputRef}
        />
      )}

      {parsed.length > 0 && (
        <div className={styles.aspectFilters}>
          <span className={styles.aspectFiltersLabel}>
            {tSearch('filteredBy')}
          </span>
          {parsed.map((aspect) => (
            <AspectPill
              key={aspect.raw}
              aspect={aspect}
              locale={locale}
              size='s'
              onRemove={() =>
                onChange(
                  value,
                  aspects.filter((a) => a !== aspect.raw),
                )
              }
              removeLabel={tSearch('removeFilter', {
                aspect: `${aspect.group}: ${aspect.value}`,
              })}
            />
          ))}
          <button
            type='button'
            className={styles.aspectFiltersClear}
            onClick={() => onChange(value, [])}>
            {tSearch('clearFilters')}
          </button>
        </div>
      )}
    </div>
  );
}

export default MetadataTableSearch;
