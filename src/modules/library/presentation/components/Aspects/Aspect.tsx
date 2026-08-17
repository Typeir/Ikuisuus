/**
 * @fileoverview Inline aspect pill for MDX prose.
 * @description `<Aspect value="school:necromancy" />` renders one aspect as
 * a link pill inside a sentence. Compact by default — glyph plus the value
 * word, since prose already names the kind of thing (`a … spell`, `the …
 * condition`); `display` forces `verbose` (group: value) or `glyph` (glyph
 * only) regardless of the reader's site-wide aspect display setting. Malformed values render their raw text so a typo stays
 * visible in the page.
 *
 * @module modules/library/presentation/components/Aspects/Aspect
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { parseAspect } from '@/modules/library/domain/aspects';
import { useLocale } from 'next-intl';
import React from 'react';
import { AspectPill } from './Aspects';
import styles from './Aspects.module.scss';

/**
 * Props for the inline Aspect element.
 *
 * @property {string} value - Aspect token, `group:value`
 * @property {'verbose' | 'compact' | 'glyph'} [display='compact'] - Rendering mode, independent of the site-wide setting
 */
export interface AspectProps {
  value: string;
  display?: 'verbose' | 'compact' | 'glyph';
}

/**
 * Renders one aspect inline.
 *
 * @component
 * @param {AspectProps} props - Component props
 * @returns {React.ReactElement} The pill, or the raw token when it does not parse
 */
export const Aspect: React.FC<AspectProps> = ({ value, display = 'compact' }) => {
  const locale = useLocale();
  const parsed = parseAspect(value.trim().toLowerCase());
  if (!parsed) return <code>{value}</code>;
  const mode =
    display === 'glyph'
      ? styles.inlineGlyph
      : display === 'compact'
        ? styles.inlineCompact
        : styles.inlineVerbose;
  return (
    <span className={`${styles.inline} ${mode}`} data-aspect-inline={display}>
      <AspectPill aspect={parsed} locale={locale} compact={display === 'glyph'} />
    </span>
  );
};

export default Aspect;
