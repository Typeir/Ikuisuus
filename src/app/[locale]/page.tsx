/**
 * @fileoverview Module for src/app/[locale]/page.tsx
 * @module src/app/[locale]/page
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */
'use client';

import { LibrarySearch } from '@/lib/components/librarySearch/librarySearch';
import { cn } from '@/lib/utils/classNameMerge';
import { useTranslations } from 'next-intl';
import styles from './page.module.scss';

/**
 * Archive introduction section displaying localized welcome text.
 *
 * Renders the intro section for the archive page with rich text formatting
 * support including emphasis and line breaks.
 *
 * @returns {JSX.Element} The rendered archive introduction section
 */
const ArchiveIntro = () => {
  const t = useTranslations('archive');

  return (
    <section
      className={cn(styles['left-aligned-prose'], 'prose ml-0 max-w-4xl py-8')}>
      <h1 className='text-3xl font-bold mb-4'>{t('title')}</h1>

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
 * Home page component for the library archive.
 *
 * Displays the archive introduction and search interface.
 *
 * @returns {JSX.Element} The rendered home page
 */
const Home = () => {
  return (
    <div className='p-4 w-full md:w-1/2'>
      <section className='max-w-4xl py-8'>
        <ArchiveIntro />
      </section>
      <LibrarySearch />
    </div>
  );
};

export default Home;
