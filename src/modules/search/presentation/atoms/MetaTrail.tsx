/**
 * @fileoverview Meta Trail Atom
 * @description Renders matched metadata as a terminal-style tag list:
 * `>:/// TAGS:` prefix, each tag in its own container with bottom border,
 * all caps, mono font, slightly transparent.
 *
 * @module modules/search/presentation/atoms/MetaTrail
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { cn } from '@/lib/utils/classNameMerge';
import styles from './atoms.module.scss';

/** Fields to display as tags, in priority order. */
const TAG_FIELDS = ['cr', 'level', 'school', 'rarity', 'size', 'tags'] as const;

/**
 * Props for the MetaTrail atom.
 *
 * @interface MetaTrailProps
 * @property {Record<string, string | number>} [meta] - Metadata key-value pairs
 * @property {string} [className] - Optional additional class names
 */
interface MetaTrailProps {
  meta?: Record<string, string | number>;
  className?: string;
}

/**
 * Renders a terminal-style tag list from metadata fields.
 *
 * @param {MetaTrailProps} props - Component props
 * @returns {JSX.Element | null} The tag list or null when empty
 */
export function MetaTrail({
  meta,
  className,
}: MetaTrailProps): JSX.Element | null {
  if (!meta) return null;

  const tags = TAG_FIELDS.flatMap((field) => {
    const value = meta[field];
    if (value === undefined || value === null || value === '') return [];

    if (typeof value === 'string' && value.includes(',')) {
      return value.split(',').map((v) => v.trim().toUpperCase());
    }

    return [String(value).toUpperCase()];
  });

  if (tags.length === 0) return null;

  return (
    <span
      className={cn(styles.metaTrail, className)}
      aria-label='Matched metadata'>
      <span className={styles.metaPrefix}>{'//>: TAGS:'}</span>
      {tags.slice(0, 8).map((tag) => (
        <span key={tag} className={styles.metaTag}>
          {tag}
        </span>
      ))}
    </span>
  );
}
