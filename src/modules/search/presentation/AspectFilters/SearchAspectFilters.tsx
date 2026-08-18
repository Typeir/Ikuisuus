/**
 * @fileoverview Active aspect filters on the search page.
 * @description Renders the aspects the search is filtered by as genuine
 * aspect pills (pressed; clicking one drops it), a clear-all, and a button
 * that opens the vocabulary editor from the MDX editor to pick filters. The
 * URL is the state: every change navigates to `/search?q=…&aspect=…`.
 *
 * @module modules/search/presentation/AspectFilters/SearchAspectFilters
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { displayAspects } from '@/modules/library/domain/aspects';
import { AspectPill } from '@/modules/library/presentation/components/Aspects/Aspects';
import { AspectEditor } from '@/modules/mdx-editor/presentation/AspectEditor';
import { Tag } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useState, type JSX } from 'react';
import { searchHref } from '../../domain/searchHref';
import styles from './SearchAspectFilters.module.scss';

/**
 * Props for SearchAspectFilters.
 *
 * @interface SearchAspectFiltersProps
 * @property {string} query - Current free-text query
 * @property {string[]} active - Aspects the search is filtered by
 */
export interface SearchAspectFiltersProps {
  query: string;
  active: string[];
}

/**
 * Filter row + editor trigger for the search page.
 *
 * @component
 * @param {SearchAspectFiltersProps} props - Component props
 * @returns {JSX.Element} The row
 */
export function SearchAspectFilters({
  query,
  active,
}: SearchAspectFiltersProps): JSX.Element {
  const t = useTranslations('search');
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const parsed = displayAspects(active);

  const go = useCallback(
    (aspects: string[]) => router.push(searchHref(locale, query, aspects)),
    [router, locale, query],
  );

  return (
    <section className={styles.row} aria-label={t('filteredBy')}>
      <button
        type='button'
        className={styles.trigger}
        onClick={() => setOpen(true)}
        aria-haspopup='dialog'
        aria-expanded={open}>
        <Tag size={14} aria-hidden='true' />
        {t('filterByAspects')}
      </button>
      {parsed.length > 0 && (
        <>
          <span className={styles.label}>{t('filteredBy')}</span>
          <span className={styles.pills}>
            {parsed.map((aspect) => (
              <AspectPill
                key={aspect.raw}
                aspect={aspect}
                locale={locale}
                pressed
                onSelect={() => go(active.filter((a) => a !== aspect.raw))}
              />
            ))}
          </span>
          <button type='button' className={styles.clear} onClick={() => go([])}>
            {t('clearFilters')}
          </button>
        </>
      )}
      <AspectEditor
        isOpen={open}
        onClose={() => setOpen(false)}
        initial={active}
        onApply={(aspects) => go(aspects)}
      />
    </section>
  );
}

export default SearchAspectFilters;
