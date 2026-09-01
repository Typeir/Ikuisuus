/**
 * @fileoverview Searchable dropdown over library content. Returns editor slug on pick.
 *
 * @module modules/mdx-editor/presentation/ContentPicker/ContentPicker
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { useSearch } from '@/modules/search/application/useSearch';
import type { SearchRecord } from '@/modules/search/domain';
import { typeIconMap } from '@/modules/search/presentation/atoms/iconMap';
import { useOutsideClick } from '@/lib/hooks/useOutsideClick';
import { useLocale, useTranslations } from 'next-intl';
import type { JSX, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './ContentPicker.module.scss';

/**
 * @property {ReactNode} icon - Trigger icon
 * @property {string} label - Accessible label and tooltip for the trigger
 * @property {(slug: string, record: SearchRecord) => void} onPick - Called with the editor slug of the chosen page
 * @property {boolean} [disabled] - Disables the trigger
 */
interface ContentPickerProps {
  icon: ReactNode;
  label: string;
  onPick: (slug: string, record: SearchRecord) => void;
  disabled?: boolean;
}

/**
 * Extract editor slug from search record.
 *
 * @param {SearchRecord} record - Search record
 * @param {string} locale - Active locale
 * @returns {string} Editor slug
 */
export function editorSlugOf(record: SearchRecord, locale: string): string {
  return record.link
    .replace(new RegExp(`^/${locale}/`), '/')
    .replace(/^\/library\//, '')
    .replace(/^\/+/, '')
    .split('#')[0];
}

/**
 * Searchable content picker.
 *
 * @component
 * @param {ContentPickerProps} props - Component properties
 * @returns {JSX.Element} Picker
 */
export function ContentPicker({
  icon,
  label,
  onPick,
  disabled = false,
}: ContentPickerProps): JSX.Element {
  const t = useTranslations('mdxEditor.copyFrom');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { results, loading, debouncing } = useSearch(term, locale, 200);

  const close = useCallback(() => {
    setOpen(false);
    setTerm('');
    setHighlight(0);
  }, []);

  useOutsideClick(containerRef, close, open);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHighlight(0);
  }, [results]);

  const pick = (record: SearchRecord) => {
    onPick(editorSlugOf(record, locale), record);
    close();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && results[highlight]) {
      e.preventDefault();
      pick(results[highlight].record);
    }
  };

  const busy = loading || debouncing;

  return (
    <div ref={containerRef} className={styles.picker} onKeyDown={onKeyDown}>
      <button
        type='button'
        className={`${styles.trigger} ${open ? styles.open : ''}`}
        onClick={() => (open ? close() : setOpen(true))}
        disabled={disabled}
        aria-haspopup='listbox'
        aria-expanded={open}
        aria-label={label}
        title={label}>
        {icon}
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.searchRow}>
            <input
              ref={inputRef}
              type='text'
              className={styles.searchInput}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={t('placeholder')}
              aria-label={t('placeholder')}
            />
          </div>
          <div role='listbox' className={styles.list} aria-label={label}>
            {!term.trim() && <div className={styles.hint}>{t('hint')}</div>}
            {term.trim() && !busy && results.length === 0 && (
              <div className={styles.hint}>{t('noResults')}</div>
            )}
            {results.map(({ record }, index) => {
              const Icon = typeIconMap[record.type];
              return (
                <div
                  key={record.id}
                  role='option'
                  aria-selected={index === highlight}
                  className={`${styles.option} ${index === highlight ? styles.highlighted : ''}`}
                  onMouseEnter={() => setHighlight(index)}
                  onClick={() => pick(record)}>
                  {Icon && (
                    <Icon
                      size={14}
                      className={styles.optionIcon}
                      aria-hidden='true'
                    />
                  )}
                  <span className={styles.optionTitle}>{record.title}</span>
                  <span className={styles.optionSlug}>
                    {editorSlugOf(record, locale)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
