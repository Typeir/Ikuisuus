/**
 * @fileoverview Glyph-only pill row. Inert mode for nested buttons.
 *
 * @module modules/library/presentation/components/Aspects/AspectGlyphs
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { displayAspects } from '@/modules/library/domain/aspects';
import { useLocale } from 'next-intl';
import { AspectPill } from './Aspects';
import styles from './Aspects.module.scss';

/**
 * Props for AspectGlyphs.
 *
 * @interface AspectGlyphsProps
 * @property {string[]} [tags] - Raw aspects
 * @property {boolean} [inert] - Render spans not links
 * @property {string} [ariaLabel] - Row label
 * @property {number} [max] - Max glyphs; rest fold into +n marker
 */
export interface AspectGlyphsProps {
  tags?: string[];
  inert?: boolean;
  ariaLabel?: string;
  max?: number;
}

/**
 * Renders an item's aspects as glyphs; nothing when there are none.
 *
 * @component
 * @param {AspectGlyphsProps} props - Component props
 * @returns {React.ReactElement | null} The row, or null
 */
export const AspectGlyphs: React.FC<AspectGlyphsProps> = ({
  tags,
  inert,
  ariaLabel,
  max,
}) => {
  const locale = useLocale();
  const parsed = displayAspects(tags);
  if (!parsed.length) return null;
  const shown = max !== undefined ? parsed.slice(0, max) : parsed;
  const rest = parsed.slice(shown.length);
  return (
    <span
      className={max !== undefined ? `${styles.glyphs} ${styles.glyphsCapped}` : styles.glyphs}
      aria-label={ariaLabel}>
      {shown.map((aspect) => (
        <AspectPill
          key={aspect.raw}
          aspect={aspect}
          locale={locale}
          compact
          inert={inert}
        />
      ))}
      {rest.length > 0 && (
        <span
          className={styles.glyphMore}
          title={rest.map((a) => `${a.group}: ${a.value}`).join(', ')}>
          +{rest.length}
        </span>
      )}
    </span>
  );
};

export default AspectGlyphs;
