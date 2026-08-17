/**
 * @fileoverview Aspect Glyph Row
 * @description Dense glyph-only pill row for picker cards and table cells.
 * `inert` renders plain spans for cells that already sit inside a button
 * or link.
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
 * @property {string[]} [tags] - Raw aspects of the item
 * @property {boolean} [inert] - Render spans instead of links
 * @property {string} [ariaLabel] - Accessible name of the row
 * @property {number} [max] - Show at most this many glyphs; the rest fold into a `+n` marker naming them on hover
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
