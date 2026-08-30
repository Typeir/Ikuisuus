/**
 * @fileoverview IconLink atom — a text link with a glyph on its right.
 * @description Next `Link` wearing a small fixed glyph vocabulary. Ghost at
 * rest, tone + glow on hover. Navigation is the framework's; the atom owns
 * the chrome only.
 *
 * @module lib/components/ui/iconLink/IconLink
 * @version 1.0.0
 * @author Typeir
 * @since 3.1.0
 */

'use client';

import { cn } from '@/lib/utils/classNameMerge';
import { ExternalLink, Pencil, SquareArrowOutUpRight } from 'lucide-react';
import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import styles from './iconLink.module.scss';

/**
 * Glyph vocabulary. `edit` opens an editor, `open` a preview, `external` leaves the site.
 *
 * @typedef {'edit'|'open'|'external'} IconLinkKind
 */
export type IconLinkKind = 'edit' | 'open' | 'external';

/** Glyph px per size. */
const GLYPH: Record<'s' | 'm', number> = { s: 12, m: 14 };

const GLYPHS: Record<IconLinkKind, typeof Pencil> = {
  edit: Pencil,
  open: SquareArrowOutUpRight,
  external: ExternalLink,
};

/**
 * Props for `<IconLink>`.
 *
 * @interface IconLinkProps
 * @property {IconLinkKind} kind - Glyph
 * @property {ReactNode} children - Visible label
 * @property {'s'|'m'} [size] - Text and glyph scale (default `m`)
 * @property {string} [className] - Layout-only class from the call site
 */
export interface IconLinkProps
  extends Omit<ComponentProps<typeof Link>, 'className' | 'children'> {
  kind: IconLinkKind;
  children: ReactNode;
  size?: 's' | 'm';
  className?: string;
}

/**
 * Text link with the glyph to the right of the label.
 *
 * @component
 * @param {IconLinkProps} props - Component props
 * @param {IconLinkKind} props.kind - Glyph
 * @param {ReactNode} props.children - Visible label
 * @param {'s'|'m'} [props.size='m'] - Scale
 * @param {string} [props.className] - Layout-only class
 * @returns {JSX.Element} Rendered link
 */
export const IconLink: React.FC<IconLinkProps> = ({
  kind,
  children,
  size = 'm',
  className,
  ...linkProps
}) => {
  const Glyph = GLYPHS[kind];
  return (
    <Link
      {...linkProps}
      className={cn(styles.link, styles[size], className)}
      data-kind={kind}>
      <span className={styles.label}>{children}</span>
      <Glyph size={GLYPH[size]} strokeWidth={2.25} aria-hidden='true' focusable='false' />
    </Link>
  );
};
