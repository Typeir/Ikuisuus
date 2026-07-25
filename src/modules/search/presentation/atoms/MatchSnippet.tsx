/**
 * @fileoverview Match Snippet Atom
 * @description Renders the Pagefind excerpt with `<mark>` highlight tags
 * preserved and styled with accent underglow. Clamps to configurable lines
 * via CSS and expands on row hover.
 *
 * @module modules/search/presentation/atoms/MatchSnippet
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { cn } from '@/lib/utils/classNameMerge';
import styles from './atoms.module.scss';

/**
 * Props for the MatchSnippet atom.
 *
 * @interface MatchSnippetProps
 * @property {string} [snippet] - HTML snippet with optional `<mark>` tags
 * @property {string} [className] - Optional additional class names
 */
interface MatchSnippetProps {
  snippet?: string;
  className?: string;
}

/**
 * Renders the match snippet with mark highlights from Pagefind.
 * Falls back to a hidden element when no snippet is available.
 *
 * @param {MatchSnippetProps} props - Component props
 * @param {string} [props.snippet] - HTML snippet with optional `<mark>` tags
 * @param {string} [props.className] - Optional additional class names
 * @returns {JSX.Element | null} The snippet element or null
 */
export function MatchSnippet({
  snippet,
  className,
}: MatchSnippetProps): JSX.Element | null {
  if (!snippet) return null;

  return (
    <span
      className={cn(styles.matchSnippet, className)}
      dangerouslySetInnerHTML={{ __html: snippet }}
      data-testid='search-snippet'
    />
  );
}
