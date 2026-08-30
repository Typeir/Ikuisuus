/**
 * @fileoverview "Suggest edit" link to the MDX Editor with the current page's
 * slug pre-filled. Percent-encodes each slug segment individually.
 * @module lib/components/mdxEditor/editPageButton
 * @version 3.0.0
 * @author Typeir
 * @since 2.0.0
 */

'use client';

import { IconLink } from '@/lib/components/ui/iconLink';
import { useTranslations } from 'next-intl';
import type { JSX } from 'react';
import { useMemo } from 'react';

/**
 * Props for the EditPageButton component.
 *
 * @property {string} slug - Content slug relative to locale (e.g. `"monsters/aboleth"`)
 * @property {string} locale - Current locale (e.g. `"en"`)
 * @property {string} [className] - Layout-only class from the call site
 */
interface EditPageButtonProps {
  /** Content slug relative to locale */
  slug: string;
  /** Current locale */
  locale: string;
  /** Layout-only class */
  className?: string;
}

/**
 * "Suggest edit" link into the MDX editor for the given slug.
 *
 * @component
 * @param {EditPageButtonProps} props - Component properties
 * @param {string} props.slug - Content slug relative to locale
 * @param {string} props.locale - Current locale
 * @param {string} [props.className] - Layout-only class
 * @returns {JSX.Element} Edit link
 *
 * @example
 * <EditPageButton slug="monsters/aboleth" locale="en" />
 */
export const EditPageButton = ({
  slug,
  locale,
  className,
}: EditPageButtonProps): JSX.Element => {
  const t = useTranslations('mdxEditor');

  const href = useMemo(() => {
    const encodedSlug = slug.split('/').map(encodeURIComponent).join('/');
    return `/${locale}/utils/mdx-editor?slug=${encodedSlug}&locale=${locale}`;
  }, [locale, slug]);

  return (
    <IconLink kind='edit' href={href} className={className}>
      {t('editButton')}
    </IconLink>
  );
};
