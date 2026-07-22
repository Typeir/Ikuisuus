/**
 * @fileoverview Search Bar Component
 * @description Always-visible search input mounted under the sidebar heading
 * in `responsiveLayoutShell.tsx`. Command-palette feel with Empyrean-serif
 * placeholder, Cmd/Ctrl-K shortcut, and ARIA combobox pattern. Delegates
 * dropdown rendering to SearchDropdown.
 *
 * Locale-aware — the `locale` prop comes from route params.
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
 */
interface SearchBarProps {
  className?: string;
  onNavigate?: () => void;
  variant?: 'sidebar' | 'hero';
}

/**
 * Always-visible search input with keyboard shortcut and dropdown results.
 *
 * @param {SearchBarProps} props - Component props
 * @returns {JSX.Element} The search bar
 */
export function SearchBar({
  className,
  onNavigate,
  variant = 'sidebar',
}: SearchBarProps): JSX.Element {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const router = useRouter();
  const t = useTranslations('search');

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isMac, setIsMac] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { results, loading, debouncing } = useSearch(query, locale, 250);

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

  /** Global Cmd/Ctrl-K shortcut. */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
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

  return (
    <div
      className={cn(
        styles.searchBar,
        variant === 'hero' && styles.hero,
        className,
      )}
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
        />
      )}
    </div>
  );
}
