/**
 * @fileoverview Type Sigil Atom
 * @description Per-content-type Lucide icon in an accent-tinted badge.
 * Maps the domain `SearchContentType` to the appropriate Lucide icon
 * component and CSS `--search-type-*` token.
 *
 * @module modules/search/presentation/atoms/TypeSigil
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { JSX } from 'react';
import { cn } from '@/lib/utils/classNameMerge';
import { typeColorVar, type SearchContentType } from '../../domain';
import styles from './atoms.module.scss';
import { typeIconMap } from './iconMap';

/**
 * Props for the TypeSigil atom.
 *
 * @interface TypeSigilProps
 * @property {SearchContentType} type - Content type from the taxonomy
 * @property {string} [className] - Optional additional class names
 */
interface TypeSigilProps {
  type: SearchContentType;
  className?: string;
}

/**
 * Renders a content-type sigil badge with the appropriate Lucide icon and
 * accent color.
 *
 * @param {TypeSigilProps} props - Component props
 * @param {SearchContentType} props.type - Content type from the taxonomy
 * @param {string} [props.className] - Optional additional class names
 * @returns {JSX.Element} The sigil badge
 */
export function TypeSigil({ type, className }: TypeSigilProps): JSX.Element {
  const Icon = typeIconMap[type] ?? typeIconMap.world;

  return (
    <span
      className={cn(styles.sigil, className)}
      style={{ '--sigil-color': typeColorVar(type) } as React.CSSProperties}
      title={`${type} content`}
      aria-hidden='true'>
      <Icon size={18} strokeWidth={1.5} />
    </span>
  );
}
