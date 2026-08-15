/**
 * @fileoverview Search Bar Component
 * @description Always-visible search input mounted under the sidebar heading
 * in `responsiveLayoutShell.tsx`. Cmd/Ctrl-K shortcut, ARIA combobox pattern,
 * locale from route params. Delegates dropdown rendering to SearchDropdown.
 *
 * @module modules/search/presentation/SearchBar/SearchBar
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { cn } from '@/lib/utils/classNameMerge';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import type { JSX } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearch } from '../../application/useSearch';
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
  const t = useTranslations('search');

  const [query, setQuery] = useState(defaultQuery ?? '');

  /** Follow external query changes (URL param updates on the search page). */
  useEffect(() => {
    if (defaultQuery !== undefined) setQuery(defaultQuery);
  }, [defaultQuery]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isMac, setIsMac] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
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

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (e.target.value.length >= 2) {
      setOpen(true);
    }
  }, []);

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
    [maxResults, activeIndex, navigateToResult],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim().length >= 2) {
        setOpen(false);
        router.push(`/${locale}/search?q=${encodeURIComponent(query.trim())}`);
        onNavigate?.();
      }
    },
    [query, locale, router, onNavigate],
  );

  const handleResultNavigate = useCallback(() => {
    setOpen(false);
    setQuery('');
    onNavigate?.();
  }, [onNavigate]);

  /**
   * Global Cmd/Ctrl-K shortcut focuses the input if visible.
   */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        const input = inputRef.current;
        if (!input) return;
        if (typeof input.checkVisibility === 'function' && !input.checkVisibility()) {
          return;
        }
        e.preventDefault();
        input.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  /** Close dropdown on outside click. */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const showDropdown = open && query.length >= 2 && !debouncing;

  /**
   * Dropdown max height defaulting to 160px, capped to space under the input.
   */
  const [dropdownMax, setDropdownMax] = useState<number | null>(null);
  const measureDropdownRoom = useCallback(() => {
    const wrap = dropdownRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    setDropdownMax(Math.max(160, window.innerHeight - rect.bottom - 16));
  }, []);

  useEffect(() => {
    if (!showDropdown) return;
    measureDropdownRoom();
    window.addEventListener('resize', measureDropdownRoom);
    return () => window.removeEventListener('resize', measureDropdownRoom);
  }, [showDropdown, measureDropdownRoom]);

  return (
    <div
      className={cn(
        styles.searchBar,
        variant === 'hero' && styles.hero,
        className,
      )}
      style={
        dropdownMax !== null
          ? ({ '--search-dropdown-max': `${dropdownMax}px` } as React.CSSProperties)
          : undefined
      }
      ref={dropdownRef}>
      <form onSubmit={handleSubmit} role='search'>
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            type='search'
            className={styles.input}
            placeholder={t('placeholder')}
            value={query}
            onChange={handleInput}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            role='combobox'
            aria-expanded={showDropdown}
            aria-controls='search-dropdown'
            aria-activedescendant={
              showDropdown && activeIndex >= 0
                ? `search-result-${activeIndex}`
                : undefined
            }
            aria-label={t('ariaLabel')}
            autoComplete='off'
          />
          <span className={styles.shortcut}>{isMac ? '⌘K' : 'Ctrl+K'}</span>
          <Search size={16} className={styles.searchIcon} aria-hidden='true' />
        </div>
      </form>

      {showDropdown && (
        <SearchDropdown
          results={results}
          loading={loading}
          activeIndex={activeIndex}
          onNavigate={handleResultNavigate}
          searchHref={`/${locale}/search?q=${encodeURIComponent(query.trim())}`}
        />
      )}
    </div>
  );
}
