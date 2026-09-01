/**
 * @fileoverview Shared article wrapper for library content rendering.
 * @module modules/library/presentation/LibraryArticle/LibraryArticle
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

import { streamStyle } from '@/lib/components/stream/StreamRail';
import type { JSX, ReactNode } from 'react';
import { ArticleTitleAction } from './ArticleTitleAction';
import styles from './LibraryArticle.module.scss';

/**
 * Props for the LibraryArticle component.
 *
 * @property {ReactNode} children - Rendered article content.
 * @property {string} [streamText] - Optional stream text CSS variable payload.
 * @property {string} [containerClassName] - Optional override for wrapper classes.
 * @property {ReactNode} [titleAction] - Control placed on the h1 rule, right edge.
 */
export interface LibraryArticleProps {
  children: ReactNode;
  streamText?: string;
  containerClassName?: string;
  titleAction?: ReactNode;
}

/**
 * Renders markdown/MDX content inside the standard article frame.
 *
 * @param {LibraryArticleProps} props - Component props.
 * @param {ReactNode} props.children - Rendered article content.
 * @param {string} [props.streamText] - Optional stream text CSS variable payload.
 * @param {string} [props.containerClassName] - Optional wrapper class override.
 * @param {ReactNode} [props.titleAction] - Control placed on the h1 rule, right edge.
 * @returns {JSX.Element} Library article wrapper.
 */
export function LibraryArticle({
  children,
  streamText,
  containerClassName,
  titleAction,
}: LibraryArticleProps): JSX.Element {
  const wrapperClassName = containerClassName ?? 'prose prose-invert mx-auto';
  const wrapperStyle = streamText ? streamStyle(streamText) : undefined;

  return (
    <div className={wrapperClassName} style={wrapperStyle}>
      <article className={styles.markdown}>
        {children}
        {titleAction && <ArticleTitleAction>{titleAction}</ArticleTitleAction>}
      </article>
    </div>
  );
}
