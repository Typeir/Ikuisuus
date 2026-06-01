/**
 * @fileoverview Edit Page Button
 * @description A lightweight client component that renders an "Edit" link-button
 * on library content pages. Clicking navigates to the MDX Editor tool view
 * pre-populated with the current page's slug.
 *
 * @module lib/components/mdxEditor/editPageButton
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 */

'use client';

import { Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import styles from './EditPageButton.module.scss';

/**
 * Props for the EditPageButton component.
 *
 * @property {string} slug - Content slug relative to locale (e.g. `"monsters/aboleth"`)
 * @property {string} locale - Current locale (e.g. `"en"`)
 */
interface EditPageButtonProps {
  /** Content slug relative to locale */
  slug: string;
  /** Current locale */
  locale: string;
}

/**
 * Renders a small "✏️ Edit" button that navigates to the MDX Editor tool page
 * with the current content slug pre-filled.
 *
 * @component
 * @param {EditPageButtonProps} props - Component properties
 * @param {string} props.slug - Content slug relative to locale
 * @param {string} props.locale - Current locale
 * @returns {JSX.Element} Edit trigger button
 *
 * @example
 * <EditPageButton slug="monsters/aboleth" locale="en" />
 */
export const EditPageButton = ({
  slug,
  locale,
}: EditPageButtonProps): JSX.Element => {
  const t = useTranslations('mdxEditor');
  const router = useRouter();

  const handleClick = useCallback(() => {
    const encodedSlug = slug.split('/').map(encodeURIComponent).join('/');
    router.push(
      `/${locale}/utils/mdx-editor?slug=${encodedSlug}&locale=${locale}`,
    );
  }, [router, locale, slug]);

  return (
    <button
      type='button'
      className={styles.editButton}
      onClick={handleClick}
      aria-label={t('editButton')}>
      <Pencil size={14} aria-hidden='true' />
      {t('editButton')}
    </button>
  );
};
