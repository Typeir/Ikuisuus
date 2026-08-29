/**
 * @fileoverview Module for src/app/[locale]/page.tsx
 * @module src/app/[locale]/page
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */
'use client';

import { StreamRail, streamStyle } from '@/lib/components/stream/StreamRail';
import { cn } from '@/lib/utils/classNameMerge';
import { useArchivistPick } from '@/modules/search/application/useArchivistPick';
import { ArchivistPanel } from '@/modules/search/presentation/ArchivistPanel/ArchivistPanel';
import { FeaturedGrid } from '@/modules/search/presentation/FeaturedGrid/FeaturedGrid';
import { SearchBar } from '@/modules/search/presentation/SearchBar/SearchBar';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import styles from './page.module.scss';

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
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const archivistPage = useArchivistPick();
  const [panelOpen, setPanelOpen] = useState(true);

  return (
    <div className={cn(styles.bento, panelOpen && styles.bentoPaneled)}>
      <div className={cn(styles.bentoIntro, 'prose max-w-5xl p-4 pr-8')}>
        <section
          className={styles.streamSection}
          style={streamStyle(STREAM_TEXT)}>
          <StreamRail side='left' />
          <ArchiveIntro />

          <section className='py-6 not-prose'>
            <SearchBar onNavigate={() => {}} variant='hero' />
          </section>
        </section>
      </div>

      {panelOpen && (
        <div className={styles.bentoPanel}>
          <ArchivistPanel
            page={archivistPage}
            locale={locale}
            onClose={() => setPanelOpen(false)}
          />
        </div>
      )}

      <div className={cn(styles.bentoFeatured, 'prose max-w-none px-4')}>
        <FeaturedGrid locale={locale} />
      </div>
    </div>
  );
};

export default Home;
