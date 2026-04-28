/**
 * @fileoverview Module for src/lib/components/archiveIntro/archiveIntro.tsx
 * @module src/lib/components/archiveIntro/archiveIntro
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */
import { useTranslations } from 'next-intl';
import { cn } from '../../utils/classNameMerge';
import styles from './archiveIntro.module.scss';

/**
 * Archive introduction component displaying localized welcome text.
 *
 * Renders the intro section for the archive page with rich text formatting
 * support including emphasis and line breaks.
 *
 * @returns {JSX.Element} The rendered archive introduction section
 */
export const ArchiveIntro = () => {
  const t = useTranslations('archive');

  return (
    <section
      className={cn(
        styles['left-aligned-prose'],
        'prose ml-0 max-w-4xl mx-auto px-4 py-8',
      )}>
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
