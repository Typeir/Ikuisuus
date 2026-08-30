/**
 * @fileoverview HelpGlyph — the `?` mark in a rhombus.
 * @description Replaces lucide's `CircleHelp` wherever a control advertises a
 * tooltip or a lookup. Decorative: always `aria-hidden`; the owning control
 * carries the accessible name. Draws in `currentColor`, so the parent's
 * colour and hover rules apply unchanged.
 *
 * @module lib/components/ui/helpGlyph/HelpGlyph
 * @version 1.0.0
 * @author Typeir
 * @since 3.1.0
 */

import { cn } from '@/lib/utils/classNameMerge';
import styles from './helpGlyph.module.scss';

/**
 * Glyph scale: unshrunk rhombus side 11 / 14 / 18 px.
 *
 * @typedef {'xs'|'s'|'m'} HelpGlyphSize
 */
export type HelpGlyphSize = 'xs' | 's' | 'm';

const SIZES: Record<HelpGlyphSize, string> = {
  xs: styles.xs,
  s: styles.s,
  m: styles.m,
};

/**
 * Props for `<HelpGlyph>`.
 *
 * @interface HelpGlyphProps
 * @property {HelpGlyphSize} [size] - Glyph scale (default `s`, the old 14px icon)
 * @property {string} [className] - Layout/colour class from the call site
 */
export interface HelpGlyphProps {
  size?: HelpGlyphSize;
  className?: string;
}

/**
 * A `?` in a diamond, drawn in `currentColor`.
 *
 * @component
 * @param {HelpGlyphProps} props - Component props
 * @param {HelpGlyphSize} [props.size='s'] - Glyph scale
 * @param {string} [props.className] - Layout/colour class
 * @returns {JSX.Element} Decorative glyph
 */
export const HelpGlyph: React.FC<HelpGlyphProps> = ({
  size = 's',
  className,
}) => (
  <span
    className={cn(styles.glyph, SIZES[size], className)}
    aria-hidden='true'
    data-size={size}>
    <span className={styles.mark}>?</span>
  </span>
);
