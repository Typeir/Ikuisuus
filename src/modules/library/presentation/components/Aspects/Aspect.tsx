/**
 * @fileoverview Inline aspect pill. Compact default; display prop overrides site setting.
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
import { AspectPill } from './AspectPill';
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
