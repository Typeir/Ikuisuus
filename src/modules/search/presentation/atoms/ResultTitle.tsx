/**
 * @fileoverview Search Result Title Atom
 * @description Renders the result title in Empyrean display serif.
 *
 * @module modules/search/presentation/atoms/ResultTitle
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { JSX } from 'react';
import { cn } from '@/lib/utils/classNameMerge';
import styles from './atoms.module.scss';

/**
 * Props for the ResultTitle atom.
 *
 * @interface ResultTitleProps
 * @property {string} title - Display title
 * @property {string} [className] - Optional additional class names
 */
interface ResultTitleProps {
  title: string;
  className?: string;
}

/**
 * Renders the result title in Empyrean display serif.
 *
 * @param {ResultTitleProps} props - Component props
 * @param {string} props.title - Display title
 * @param {string} [props.className] - Optional additional class names
 * @returns {JSX.Element} The title element
 */
export function ResultTitle({
  title,
  className,
}: ResultTitleProps): JSX.Element {
  return <span className={cn(styles.resultTitle, className)}>{title}</span>;
}
