/**
 * @fileoverview Module for src/app/[locale]/page.tsx
 * @module src/app/[locale]/page
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */
'use client';

import StreamBootstrap from '@/lib/components/stream/StreamBootstrap';
import { cn } from '@/lib/utils/classNameMerge';
import { useArchivistPick } from '@/modules/search/application/useArchivistPick';
import type { SearchContentType, SearchResult } from '@/modules/search/domain';
import { ArchivistPanel } from '@/modules/search/presentation/ArchivistPanel/ArchivistPanel';
import { SearchBar } from '@/modules/search/presentation/SearchBar/SearchBar';
import { SearchResultRow } from '@/modules/search/presentation/SearchResultRow/SearchResultRow';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import styles from './page.module.scss';

/** Shape of a discovery entry from /api/discovery. */
interface DiscoveryEntry {
  slug: string;
  title: string;
  link: string;
  description?: string;
  image?: string;
  type: string;
}

/**
 * Archive introduction section displaying localized welcome text.
 *
 * @returns {JSX.Element} The rendered archive introduction section
 */
const ArchiveIntro = () => {
  const t = useTranslations('archive');

  return (
    <section
      className={cn(styles['left-aligned-prose'], 'prose ml-0 max-w-4xl py-8')}>
      <h1 className={cn('text-[2rem] font-bold mb-4', styles.pageTitle)}>
        <span className={styles.nameFirstLetter}>{t('title').charAt(0)}</span>
        {t('title').slice(1)}
      </h1>
      <p>
        {t.rich('introOne', {
          em: (chunks) => <em>{chunks}</em>,
          br: () => <br />,
        })}
      </p>
      <p>
        {t.rich('introTwo', {
          em: (chunks) => <em>{chunks}</em>,
          br: () => <br />,
        })}
      </p>
      <p>
        {t.rich('introThree', {
          em: (chunks) => <em>{chunks}</em>,
          br: () => <br />,
        })}
      </p>
    </section>
  );
};

/**
 * Home page — "The Grand Archive". Introduction + featured discovery entries
 * per content type. Search is in the sidebar SearchBar.
 *
 * @returns {JSX.Element} The rendered home page
 */
const Home = () => {
  const STREAM_TEXT =
    'VESSEL:1  ·  GREAT_GLAUX  //  STATE  ·  HEALTH:CRITICAL  ·  SYSTEMS:ONLINE  //  MODE:RECOVERY';
  const t = useTranslations('archive');
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const archivistPage = useArchivistPick();
  const [panelOpen, setPanelOpen] = useState(true);
  const [featured, setFeatured] = useState<
    Record<string, DiscoveryEntry | null>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/discovery?locale=${locale}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const entries: Record<string, DiscoveryEntry | null> = {};
        for (const [type, set] of Object.entries(data.entries || {}) as [
          string,
          { featured: DiscoveryEntry | null },
        ][]) {
          entries[type] = set.featured;
        }
        setFeatured(entries);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const types = Object.keys(featured);

  return (
    <div className='flex flex-wrap gap-8 items-start w-full'>
      <div className='prose max-w-5xl p-4 pr-8 flex-1'>
        <section
          className={styles.streamSection}
          data-stream={STREAM_TEXT}
          style={
            {
              '--stream-text': `'${STREAM_TEXT}'`,
            } as React.CSSProperties
          }>
          <ArchiveIntro />

          <section className='py-6 not-prose'>
            <SearchBar onNavigate={() => {}} variant='hero' />
          </section>

          <section className='py-6'>
            <h2 className='text-lg font-semibold mb-4'>
              {t('featuredHeading')}
            </h2>

            {loading && (
              <p className={cn('italic text-sm', styles.featuredLoading)}>
                {t('featuredLoading')}
              </p>
            )}

            {!loading && types.length === 0 && (
              <p className={cn('italic text-sm', styles.featuredEmpty)}>
                {t('featuredEmpty')}
              </p>
            )}

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 not-prose'>
              {types.map((type) => {
                const entry = featured[type];
                if (!entry) return null;
                const result: SearchResult = {
                  record: {
                    id: `${type}:${locale}:${entry.slug}`,
                    type: type as SearchContentType,
                    locale,
                    slug: entry.slug,
                    title: entry.title,
                    link: `/${locale}${entry.link}`,
                    description: entry.description,
                    image: entry.image,
                  },
                  score: 0,
                  snippet: entry.description || '',
                  matchedFields: [],
                };
                return (
                  <SearchResultRow key={type} result={result} variant='card' />
                );
              })}
            </div>
          </section>
        </section>
        <StreamBootstrap />
      </div>
      {panelOpen && (
        <ArchivistPanel
          page={archivistPage}
          locale={locale}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </div>
  );
};

export default Home;
