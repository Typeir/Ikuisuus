/**
 * @fileoverview Aspect Filter Bar
 * @description Toggle row of the aspects present in a picker's items.
 * Selected aspects are ANDed by the caller via `matchesAspects`.
 *
 * @module modules/character-builder/presentation/aspects/aspectFilterBar
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { displayAspects } from '@/modules/library/domain/aspects';
import { AspectPill } from '@/modules/library/presentation/components/Aspects/AspectPill';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { availableAspects } from '../../lib/utils/aspectRollup';
import styles from './aspects.module.scss';

/**
 * Props for AspectFilterBar.
 *
 * @interface AspectFilterBarProps
 * @property {Array<string[] | undefined>} tagLists - Tags of every item in the picker
 * @property {ReadonlySet<string>} selected - Currently required aspects
 * @property {(aspect: string) => void} onToggle - Toggle one aspect
 * @property {() => void} onClear - Drop every selected aspect
 */
export interface AspectFilterBarProps {
  tagLists: Array<string[] | undefined>;
  selected: ReadonlySet<string>;
  onToggle: (aspect: string) => void;
  onClear: () => void;
}

/**
 * Collapsed by default past this many aspects; a toggle reveals the rest.
 *
 * @constant
 */
const COLLAPSED_LIMIT = 12;

/**
 * Renders the filterable aspects as pressable pills. Nothing when the items
 * carry no aspects.
 *
 * @component
 * @param {AspectFilterBarProps} props - Component props
 * @returns {React.ReactElement | null} The bar, or null
 */
export const AspectFilterBar: React.FC<AspectFilterBarProps> = ({
  tagLists,
  selected,
  onToggle,
  onClear,
}) => {
  const locale = useLocale();
  const t = useTranslations('characterSheet');
  const [expanded, setExpanded] = useState(false);
  const aspects = useMemo(() => availableAspects(tagLists), [tagLists]);
  const parsed = useMemo(() => displayAspects(aspects), [aspects]);
  if (!parsed.length) return null;

  const overflow = parsed.length > COLLAPSED_LIMIT;
  const shown =
    overflow && !expanded
      ? parsed.filter((a, i) => i < COLLAPSED_LIMIT || selected.has(a.raw))
      : parsed;

  return (
    <div className={styles.filterBar} role='group' aria-label={t('aspectFilterAria')}>
      <span className={styles.filterCaption}>{t('aspectFilterLabel')}</span>
      <span className={styles.filterPills}>
        {shown.map((aspect) => (
          <AspectPill
            key={aspect.raw}
            aspect={aspect}
            locale={locale}
            pressed={selected.has(aspect.raw)}
            onSelect={() => onToggle(aspect.raw)}
          />
        ))}
      </span>
      {overflow && (
        <button
          type='button'
          className={styles.filterMore}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}>
          {expanded ? t('aspectFilterLess') : t('aspectFilterMore', { count: parsed.length - COLLAPSED_LIMIT })}
        </button>
      )}
      {selected.size > 0 && (
        <button type='button' className={styles.filterClear} onClick={onClear}>
          {t('aspectFilterClear')}
        </button>
      )}
    </div>
  );
};

/**
 * Selection state for an aspect filter.
 *
 * @returns {{ selected: Set<string>; toggle: (aspect: string) => void; clear: () => void }} Filter state and mutators
 */
export function useAspectFilter(): {
  selected: Set<string>;
  toggle: (aspect: string) => void;
  clear: () => void;
} {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const toggle = (aspect: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(aspect)) next.delete(aspect);
      else next.add(aspect);
      return next;
    });
  const clear = () => setSelected(new Set());
  return { selected, toggle, clear };
}

export default AspectFilterBar;
