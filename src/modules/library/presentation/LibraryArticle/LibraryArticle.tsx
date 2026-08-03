/**
 * @fileoverview Shared article wrapper for library content rendering.
 * @module modules/library/presentation/LibraryArticle
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import type { JSX, CSSProperties, ReactNode } from 'react';
import styles from './LibraryArticle.module.scss';

/**
 * Props for the LibraryArticle component.
 *
 * @property {ReactNode} children - Rendered article content.
 * @property {string} [streamText] - Optional stream text CSS variable payload.
 * @property {string} [containerClassName] - Optional override for wrapper classes.
 */
export interface LibraryArticleProps {
  children: ReactNode;
  streamText?: string;
  containerClassName?: string;
}

/**
 * Renders markdown/MDX content inside the standard article frame.
 *
 * @param {LibraryArticleProps} props - Component props.
 * @param {ReactNode} props.children - Rendered article content.
 * @param {string} [props.streamText] - Optional stream text CSS variable payload.
 * @param {string} [props.containerClassName] - Optional wrapper class override.
 * @returns {JSX.Element} Library article wrapper.
 */
export function LibraryArticle({
  children,
  streamText,
  containerClassName,
}: LibraryArticleProps): JSX.Element {
  const wrapperClassName = containerClassName ?? 'prose prose-invert mx-auto';
  const wrapperStyle = streamText
    ? ({ ['--stream-text' as string]: `'${streamText}'` } as CSSProperties)
    : undefined;

  return (
    <div className={wrapperClassName} style={wrapperStyle}>
      <article className={styles.markdown}>{children}</article>
    </div>
  );
}
