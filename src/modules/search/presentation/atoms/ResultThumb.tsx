/**
 * @fileoverview Result Thumb Atom
 * @description Renders the result thumbnail image with a grain/vignette
 * overlay. Falls back gracefully to the TypeSigil when no image is
 * available.
 *
 * @module modules/search/presentation/atoms/ResultThumb
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { cn } from '@/lib/utils/classNameMerge';
import Image from 'next/image';
import type { SearchContentType } from '../../domain';
import { TypeSigil } from './TypeSigil';
import styles from './atoms.module.scss';

/**
 * Props for the ResultThumb atom.
 *
 * @interface ResultThumbProps
 * @property {string} [image] - Image path (e.g. '/library/images/aboleth.webp')
 * @property {SearchContentType} type - Content type (for sigil fallback)
 * @property {string} [alt] - Alt text (defaults to type + ' thumbnail')
 * @property {string} [className] - Optional additional class names
 */
interface ResultThumbProps {
  image?: string;
  type: SearchContentType;
  alt?: string;
  className?: string;
}

/**
 * Renders the result thumbnail or falls back to the type sigil.
 *
 * @param {ResultThumbProps} props - Component props
 * @param {string} [props.image] - Image path (e.g. '/library/images/aboleth.webp')
 * @param {SearchContentType} props.type - Content type (for sigil fallback)
 * @param {string} [props.alt] - Alt text (defaults to type + ' thumbnail')
 * @param {string} [props.className] - Optional additional class names
 * @returns {JSX.Element} The thumb or sigil fallback
 */
export function ResultThumb({
  image,
  type,
  alt,
  className,
}: ResultThumbProps): JSX.Element {
  if (image) {
    return (
      <span className={cn(styles.thumb, className)}>
        <Image
          src={image}
          alt={alt ?? `${type} thumbnail`}
          className={styles.thumbImage}
          fill
          sizes='48px'
        />
      </span>
    );
  }

  return <TypeSigil type={type} className={className} />;
}
