/**
 * @fileoverview Search Result Row Composer
 * @description Composes the five search result atoms into a row layout:
 * `[ sigil | title+content+meta | thumb ]`. Rendered as a link to the
 * page-level result URL.
 * @module modules/search/presentation/SearchResultRow/SearchResultRow
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { JSX } from 'react';
import { LazyPrefetchLink } from '@/lib/components/lazyPrefetchLink';
import { cn } from '@/lib/utils/classNameMerge';
import { typeColorVar, type SearchResult } from '../../domain';
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
 * @property {string} [className] - Additional class names
 */
interface SearchResultRowProps {
  result: SearchResult;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'row' | 'card';
}

/**
 * Renders one search result as a linked row.
 *
 * @param {SearchResultRowProps} props - Component props
 * @param {SearchResult} props.result - Typed search result with record + snippet
 * @param {string} [props.className] - Additional class names
 * @param {React.CSSProperties} [props.style] - Inline style overrides merged onto the row element
 * @param {'row' | 'card'} [props.variant=row] - Layout variant: 'row' or 'card'
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
    '--search-row-stream-color': typeColorVar(record.type),
    '--sigil-color': typeColorVar(record.type),
    ...style,
  } as React.CSSProperties;

  const description = record.description || snippet;
  const readingTime = record.meta?.readingTime;

  return (
    <LazyPrefetchLink
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
        <span className={cn(styles.cardTypeLabel)}>
          {typeLabel}
          {readingTime && (
            <span className={styles.readingTime}>{readingTime}</span>
          )}
        </span>
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
    </LazyPrefetchLink>
  );
}
