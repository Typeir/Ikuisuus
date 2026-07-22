/**
 * @fileoverview Search Dropdown Component
 * @description Quick-results dropdown for the SearchBar. Shows up to 8
 * SearchResultRow items with staggered animation. Keyboard-navigable.
 *
 * @module modules/search/presentation/SearchBar/SearchDropdown
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { cn } from '@/lib/utils/classNameMerge';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Skeleton } from '../../../../lib/components/skeleton';
import type { SearchResult } from '../../domain';
import { SearchResultRow } from '../SearchResultRow/SearchResultRow';
import styles from './searchBar.module.scss';

/** Maximum quick results to show; the final row links to the search page. */
export const MAX_DROPDOWN_RESULTS = 7;

/**
 * Props for the SearchDropdown component.
 *
 * @interface SearchDropdownProps
 * @property {SearchResult[]} results - Search results
 * @property {boolean} loading - Whether a search is in flight
 * @property {number} activeIndex - Index of the currently highlighted result
 * @property {() => void} onNavigate - Callback when a result link is clicked
 * @property {string} searchHref - Full-results page URL for the current query
 */
interface SearchDropdownProps {
  results: SearchResult[];
  loading: boolean;
  activeIndex: number;
  onNavigate: () => void;
  searchHref: string;
}

/**
 * Status line for loading / empty / error states in the dropdown.
 *
 * @param {{ i18nKey: string }} props
 * @returns {JSX.Element}
 */
function StatusLine({ i18nKey }: { i18nKey: string }): JSX.Element {
  const t = useTranslations('search');
  return <p className={styles.dropdownStatus}>{t(i18nKey)}</p>;
}

/**
 * Renders the quick-results dropdown list with keyboard navigation support.
 *
 * @param {SearchDropdownProps} props - Component props
 * @returns {JSX.Element} The dropdown list
 */
export function SearchDropdown({
  results,
  loading,
  activeIndex,
  onNavigate,
  searchHref,
}: SearchDropdownProps): JSX.Element {
  const t = useTranslations('search');

  return (
    <div
      id='search-dropdown'
      className={styles.dropdown}
      role='listbox'
      aria-label={t('ariaLabel')}
      onClick={onNavigate}>
      {loading && results.length === 0 && <StatusLine i18nKey='searching' />}

      {!loading && results.length === 0 && <StatusLine i18nKey='noResults' />}

      {results.slice(0, MAX_DROPDOWN_RESULTS).map((result, index) => (
        <div
          key={result.record.id}
          id={`search-result-${index}`}
          role='option'
          aria-selected={index === activeIndex}
          className={cn(
            styles.dropdownRow,
            index === activeIndex && styles.dropdownRowActive,
          )}
          style={
            {
              animationDelay: `${index * 60}ms`,
            } as React.CSSProperties
          }>
          <SearchResultRow result={result} />
        </div>
      ))}

      {/* Final row: escape hatch to the full search page. Clicks bubble to
          the container's onNavigate, closing the dropdown. */}
      <Link href={searchHref} className={styles.digDeeper}>
        <Skeleton></Skeleton>
        <div style={{ paddingBottom: '0.5rem' }}>{t('digDeeper')}</div>
        <Skeleton></Skeleton>
      </Link>
    </div>
  );
}
