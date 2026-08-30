/**
 * @fileoverview Slot that sits on the article title's rule, right edge,
 * bottom aligned with the h1. CSS anchor positioning does the placement where
 * supported; elsewhere a ResizeObserver writes the h1's bottom edge into
 * `--title-bottom` and the stylesheet positions from that.
 *
 * @module modules/library/presentation/LibraryArticle/ArticleTitleAction
 * @version 1.0.0
 * @author Typeir
 * @since 3.1.0
 */

'use client';

import type { JSX, ReactNode } from 'react';
import { useLayoutEffect, useRef } from 'react';
import styles from './LibraryArticle.module.scss';

/**
 * Props for the ArticleTitleAction slot.
 *
 * @interface ArticleTitleActionProps
 * @property {ReactNode} children - The control to place on the title rule
 */
export interface ArticleTitleActionProps {
  children: ReactNode;
}

/**
 * Whether the browser positions the slot itself via CSS anchors.
 *
 * @returns {boolean} True when `anchor-name` is supported
 */
function hasCssAnchors(): boolean {
  return (
    typeof CSS !== 'undefined' &&
    typeof CSS.supports === 'function' &&
    CSS.supports('anchor-name: --a')
  );
}

/**
 * Places its child on the h1 rule of the enclosing article.
 *
 * @component
 * @param {ArticleTitleActionProps} props - Component props
 * @param {ReactNode} props.children - Control to place
 * @returns {JSX.Element} Positioned slot
 */
export function ArticleTitleAction({
  children,
}: ArticleTitleActionProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const slot = ref.current;
    if (!slot || hasCssAnchors()) return;
    const article = slot.parentElement;
    const title = article?.querySelector('h1');
    if (!article || !title) return;

    const write = () => {
      const bottom = title.offsetTop + title.offsetHeight;
      article.style.setProperty('--title-bottom', `${bottom}px`);
    };
    write();
    const observer = new ResizeObserver(write);
    observer.observe(title);
    observer.observe(article);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={styles.titleAction}>
      {children}
    </div>
  );
}
