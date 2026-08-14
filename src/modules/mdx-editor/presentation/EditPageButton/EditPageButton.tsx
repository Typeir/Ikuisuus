/**
 * @fileoverview Renders an "Edit" anchor, styled as a button, that links to the
 * MDX Editor tool view with the current page's slug pre-filled. Plain left
 * clicks are intercepted for a client-side route push; other clicks use the
 * browser's default link navigation.
 * @module lib/components/mdxEditor/editPageButton
 * @version 2.0.0
 * @author Typeir
 * @since 2.0.0
 */

'use client';

import { isPlainLeftClick } from '@/lib/utils/isPlainLeftClick';
import { Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { JSX, MouseEvent } from 'react';
import { useCallback, useMemo } from 'react';
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
 * Renders an "Edit" anchor pointing at the MDX Editor tool page with the slug
 * pre-filled. Percent-encodes each slug segment individually.
 *
 * @component
 * @param {EditPageButtonProps} props - Component properties
 * @param {string} props.slug - Content slug relative to locale
 * @param {string} props.locale - Current locale
 * @returns {JSX.Element} Edit link
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

  const href = useMemo(() => {
    const encodedSlug = slug.split('/').map(encodeURIComponent).join('/');
    return `/${locale}/utils/mdx-editor?slug=${encodedSlug}&locale=${locale}`;
  }, [locale, slug]);

  const handleClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      if (!isPlainLeftClick(event)) return;
      event.preventDefault();
      router.push(href);
    },
    [href, router],
  );

  return (
    <a
      href={href}
      className={styles.editButton}
      onClick={handleClick}
      aria-label={t('editButton')}>
      <Pencil size={14} aria-hidden='true' />
      {t('editButton')}
    </a>
  );
};
