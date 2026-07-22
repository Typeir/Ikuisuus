/**
 * @fileoverview Search Result Row Composer
 * @description Composes the five search result atoms into a single "catalog
 * entry" row layout: `[ sigil | title+snippet+meta | thumb ]`. Used by both
 * the dropdown quick-results (T5) and the /search results page (T7).
 *
 * Asymmetric layout — sigil column, content block, optional meta/thumb.
 * Each row is a link to the page-level result URL.
 *
 * @module modules/search/presentation/SearchResultRow/SearchResultRow
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { cn } from '@/lib/utils/classNameMerge';
import Link from 'next/link';
import type { SearchResult } from '../../domain';
import { MatchSnippet } from '../atoms/MatchSnippet';
import { MetaTrail } from '../atoms/MetaTrail';
import { ResultThumb } from '../atoms/ResultThumb';
import { ResultTitle } from '../atoms/ResultTitle';
import { TypeSigil } from '../atoms/TypeSigil';
import styles from '../atoms/atoms.module.scss';

/**
 * Props for the SearchResultRow component.
 *
 * @interface SearchResultRowProps
 * @property {SearchResult} result - Typed search result with record + snippet
 * @property {string} [className] - Optional additional class names
 */
interface SearchResultRowProps {
  result: SearchResult;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'row' | 'card';
}

/**
 * Renders a single search result as a linked row with sigil, title, snippet,
 * meta chips, and thumbnail.
 *
 * @param {SearchResultRowProps} props - Component props
 * @returns {JSX.Element} The result row
 */
export function SearchResultRow({
  result,
  className,
  style,
  variant = 'row',
}: SearchResultRowProps): JSX.Element {
  const { record, snippet } = result;
  const typeLabel = record.type.toUpperCase();
  const streamText = `${typeLabel}  ·  ${typeLabel}  //  ${typeLabel}  ·  ${typeLabel}`;

  const mergedStyle = {
    '--stream-text': `'${streamText}'`,
    '--search-row-stream-color': `var(--search-type-${record.type})`,
    '--sigil-color': `var(--search-type-${record.type})`,
    ...style,
  } as React.CSSProperties;

  const description = record.description || snippet;

  return (
    <Link
      href={record.link}
      className={cn(
        styles.row,
        variant === 'card' && styles.rowCard,
        className,
      )}
      style={mergedStyle}
      data-testid='search-result-row'>
      <TypeSigil type={record.type} />

      <span
        className={cn(
          styles.rowContent,
          variant === 'card' && styles.rowContentCard,
        )}>
        <span className={cn(styles.cardTypeLabel)}>{typeLabel}</span>
        <ResultTitle title={record.title} />
        {variant === 'row' && snippet && <MatchSnippet snippet={snippet} />}
        {variant === 'card' && description && (
          <p className={styles.cardDescription}>{description}</p>
        )}
        <MetaTrail meta={record.meta} />
      </span>

      {record.image && variant === 'row' && (
        <span className={styles.rowMeta}>
          <ResultThumb image={record.image} type={record.type} />
        </span>
      )}
    </Link>
  );
}
