/**
 * @fileoverview Search Result Row Composer
 * @description Composes the five search result atoms into a link to the
 * page-level result URL. The `row` variant lays them out as
 * `[ sigil | title+content+meta | thumb ]`; the `card` variant drops the
 * sigil into the type-label line so the content column spans the full width.
 * @module modules/search/presentation/SearchResultRow/SearchResultRow
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { JSX } from 'react';
import { LazyPrefetchLink } from '@/lib/components/lazyPrefetchLink';
import { StreamRail, streamStyle } from '@/lib/components/stream/StreamRail';
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
  const isCard = variant === 'card';
  const typeLabel = record.type.toUpperCase();
  const streamText = `${typeLabel}  ·  ${typeLabel}  //  ${typeLabel}  ·  ${typeLabel}`;

  const mergedStyle = {
    ...streamStyle(streamText),
    '--search-row-stream-color': typeColorVar(record.type),
    '--sigil-color': typeColorVar(record.type),
    ...style,
  } as React.CSSProperties;

  const description = record.description || snippet;
  const readingTime = record.meta?.readingTime;

  return (
    <LazyPrefetchLink
      href={record.link}
      className={cn(styles.row, isCard && styles.rowCard, className)}
      style={mergedStyle}
      data-testid='search-result-row'>
      {!isCard && <TypeSigil type={record.type} />}

      <span className={cn(styles.rowContent, isCard && styles.rowContentCard)}>
        <span className={cn(styles.cardTypeLabel, isCard && styles.cardHeader)}>
          {isCard && <TypeSigil type={record.type} />}
          <span className={isCard ? styles.cardHeaderLabel : undefined}>
            {typeLabel}
          </span>
          {readingTime && (
            <span className={styles.readingTime}>{readingTime}</span>
          )}
        </span>
        <ResultTitle title={record.title} />
        {!isCard && snippet && <MatchSnippet snippet={snippet} />}
        {isCard && description && (
          <p className={styles.cardDescription}>{description}</p>
        )}
        <MetaTrail meta={record.meta} />
      </span>

      {record.image && !isCard && (
        <span className={styles.rowMeta}>
          <ResultThumb image={record.image} type={record.type} />
        </span>
      )}

      <StreamRail side='right' />
    </LazyPrefetchLink>
  );
}
