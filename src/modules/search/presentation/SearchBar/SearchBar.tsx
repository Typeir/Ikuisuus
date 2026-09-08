/**
 * @fileoverview Search Bar Component
 * @description Always-visible search input mounted under the sidebar heading
 * in `responsiveLayoutShell.tsx`.
 *
 * @module modules/search/presentation/SearchBar/SearchBar
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { cn } from '@/lib/utils/classNameMerge';
import { useTranslations } from 'next-intl';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import type { JSX } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearch } from '../../application/useSearch';
import { searchHref } from '../../domain/searchHref';
import { AspectSuggestions } from './AspectSuggestions';
import { useAspectAutocomplete, type PickedAspect } from './useAspectAutocomplete';
import { SearchField } from '../SearchField/SearchField';
import { useOutsideClick } from '@/lib/hooks/useOutsideClick';
import { useFocusShortcut } from './useSearchBarChrome';
import { MAX_DROPDOWN_RESULTS, SearchDropdown } from './SearchDropdown';
import styles from './searchBar.module.scss';

/**
 * Props for the SearchBar component.
 *
 * @interface SearchBarProps
 * @property {string} [className] - Optional additional class names
 * @property {() => void} [onNavigate] - Callback when a result link is clicked
 * @property {'sidebar' | 'hero'} [variant='sidebar'] - Visual variant
 * @property {string} [defaultQuery] - Initial query text; re-synced when it
 * changes (e.g. the search page passing the current `?q=` param)
 */
interface SearchBarProps {
  className?: string;
  onNavigate?: () => void;
  variant?: 'sidebar' | 'hero';
  defaultQuery?: string;
}

/**
 * Always-visible search input with keyboard shortcut and dropdown results.
 *
 * @param {SearchBarProps} props - Component props
 * @param {string} [props.className] - Optional additional class names
 * @param {() => void} [props.onNavigate] - Callback when a result link is clicked
 * @param {'sidebar' | 'hero'} [props.variant='sidebar'] - Visual variant
 * @param {string} [props.defaultQuery] - Initial query text; re-synced when it
 * changes (e.g. the search page passing the current `?q=` param)
 * @returns {JSX.Element} The search bar
 */
export function SearchBar({
  className,
  onNavigate,
  variant = 'sidebar',
  defaultQuery,
}: SearchBarProps): JSX.Element {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('search');

  /* Aspects already pinned on the search page, carried through every navigation
     out of this bar. */
  const paramString = searchParams.toString();
  const activeAspects = useMemo(
    () => new URLSearchParams(paramString).getAll('aspect'),
    [paramString],
  );

  const [query, setQuery] = useState(defaultQuery ?? '');

  /** Follow external query changes (URL param updates on the search page). */
  useEffect(() => {
    if (defaultQuery !== undefined) setQuery(defaultQuery);
  }, [defaultQuery]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isMac, setIsMac] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* The dropdown never shows more than its cap, so nothing past it is worth
     a fetch. */
  const { results, loading, debouncing } = useSearch(
    query,
    locale,
    250,
    undefined,
    MAX_DROPDOWN_RESULTS,
  );

  const maxResults = Math.min(results.length, MAX_DROPDOWN_RESULTS);

  /** Detect platform for shortcut hint. */
  useEffect(() => {
    setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform));
  }, []);

  /** Reset active index when results change. */
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  /**
   * Sends a picked aspect to the search page, keeping the aspects already set.
   *
   * @param {PickedAspect} picked - Chosen aspect and the query without its token
   * @returns {void}
   */
  const applyAspect = useCallback(
    (picked: PickedAspect) => {
      setOpen(false);
      setQuery(picked.rest);
      router.push(searchHref(locale, picked.rest, [...activeAspects, picked.aspect]));
      onNavigate?.();
    },
    [activeAspects, router, locale, onNavigate],
  );

  const {
    suggestions,
    activeIndex: aspectIndex,
    suggesting,
    pickAt: pickAspect,
    trackCaret: handleCaret,
    handleChange: trackAspectCaret,
    handleKeyDown: handleAspectKeys,
  } = useAspectAutocomplete(query, applyAspect);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
      trackAspectCaret(e);
      if (e.target.value.length >= 2) {
        setOpen(true);
      }
    },
    [trackAspectCaret],
  );

  const handleFocus = useCallback(() => {
    if (query.length >= 2) setOpen(true);
  }, [query.length]);

  const navigateToResult = useCallback(
    (index: number) => {
      const result = results[index];
      if (!result) return;
      setOpen(false);
      setQuery('');
      router.push(result.record.link);
      onNavigate?.();
    },
    [results, router, onNavigate],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (handleAspectKeys(e)) return;
      switch (e.key) {
        case 'Escape':
          setOpen(false);
          setActiveIndex(-1);
          inputRef.current?.blur();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => (prev < maxResults - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => (prev > 0 ? prev - 1 : maxResults - 1));
          break;
        case 'Enter':
          if (activeIndex >= 0 && activeIndex < maxResults) {
            e.preventDefault();
            navigateToResult(activeIndex);
          }
          break;
      }
    },
    [maxResults, activeIndex, navigateToResult, handleAspectKeys],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim().length < 2 && activeAspects.length === 0) return;
      setOpen(false);
      router.push(searchHref(locale, query, activeAspects));
      onNavigate?.();
    },
    [query, activeAspects, locale, router, onNavigate],
  );

  const handleResultNavigate = useCallback(() => {
    setOpen(false);
    setQuery('');
    onNavigate?.();
  }, [onNavigate]);

  useFocusShortcut(inputRef);
  const closeDropdown = useCallback(() => setOpen(false), []);
  useOutsideClick([barRef, dropdownRef], closeDropdown);

  const showDropdown = open && query.length >= 2 && !debouncing && !suggesting;

  return (
    <div
      className={cn(
        styles.searchBar,
        variant === 'hero' && styles.hero,
        className,
      )}
      ref={barRef}>
      <form onSubmit={handleSubmit} role='search'>
        <SearchField
          value={query}
          variant={variant === 'hero' ? 'hero' : 'bar'}
          placeholder={t('placeholder')}
          ariaLabel={t('ariaLabel')}
          hint={isMac ? '⌘K' : 'Ctrl+K'}
          inputRef={inputRef}
          inputProps={{
            onChange: handleInput,
            onFocus: handleFocus,
            onKeyDown: handleKeyDown,
            onKeyUp: handleCaret,
            onClick: handleCaret,
            onSelect: handleCaret,
            role: 'combobox',
            'aria-expanded': showDropdown || suggesting,
            'aria-controls': suggesting
              ? 'search-aspect-suggestions'
              : 'search-dropdown',
            'aria-activedescendant':
              suggesting && aspectIndex >= 0
                ? `search-aspect-${aspectIndex}`
                : showDropdown && activeIndex >= 0
                  ? `search-result-${activeIndex}`
                  : undefined,
          }}
        />
      </form>

      {suggesting && (
        <AspectSuggestions
          suggestions={suggestions}
          activeIndex={aspectIndex}
          onPick={pickAspect}
          anchorRef={inputRef}
        />
      )}

      {showDropdown && (
        <SearchDropdown
          ref={dropdownRef}
          anchorRef={barRef}
          variant={variant === 'hero' ? 'hero' : 'bar'}
          results={results}
          loading={loading}
          activeIndex={activeIndex}
          onNavigate={handleResultNavigate}
          searchHref={searchHref(locale, query, activeAspects)}
        />
      )}
    </div>
  );
}
