/**
 * @fileoverview Keyword Inline MDX Component
 * @description Inline MDX component that renders a rules keyword with its
 * hover definition and a link to the rule page that defines it. Definitions
 * and link targets come from the keyword registry; unregistered terms render
 * as plain text so stale content degrades gracefully.
 *
 * @module modules/library/presentation/components/Keyword/Keyword
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-19
 */

'use client';

import { Tooltip } from '@/lib/components/ui/tooltip';
import { lookupKeyword } from '@/lib/md/keywordRegistry';
import { useLocale } from 'next-intl';
import React from 'react';
import styles from './Keyword.module.scss';

/**
 * Props for the Keyword component. All values arrive as strings from the MDX
 * attribute layer.
 *
 * @typedef {object} KeywordProps
 * @property {string} term - Canonical registry term, e.g. "damage bonus"
 * @property {string} [display] - Author-written text with casing preserved; falls back to the term
 * @property {boolean} [noLink] - When true, renders a `<span>` instead of an `<a>` to avoid nested anchors
 */
export interface KeywordProps {
  term: string;
  display?: string;
  noLink?: boolean;
}

/**
 * Renders a rules keyword as a defined term with hover and lookup.
 *
 * @param {KeywordProps} props - Component props
 * @returns {React.ReactElement} The rendered keyword as a link
 */
export const Keyword: React.FC<KeywordProps> = ({
  term,
  display,
  noLink = false,
}) => {
  const locale = useLocale();
  const entry = lookupKeyword(term);
  const label = display ?? term;

  if (!entry) {
    return <span>{label}</span>;
  }

  return (
    <Tooltip
      content={<span className={styles.blurb}>{entry.blurb}</span>}
      className={styles.tooltip}
      showArrow={false}
      inline
    >
      {noLink ? (
        <span className={styles.keyword} data-keyword={entry.term}>
          {label}
        </span>
      ) : (
        <a
          className={styles.keyword}
          href={`/${locale}/${entry.href}`}
          data-keyword={entry.term}
        >
          {label}
        </a>
      )}
    </Tooltip>
  );
};

export default Keyword;
