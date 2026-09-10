/**
 * @fileoverview Aspects MDX component.
 *
 * @module modules/library/presentation/components/Aspects/Aspects
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-04
 */

'use client';

import {
  usePersistentUiDispatchOptional,
  usePersistentUiStateOptional,
} from '@/lib/context/PersistentUiContext';
import { PERSISTED_UI_ACTION_TYPES } from '@/lib/types/persistentUiState';
import { watchVisible } from '@/lib/utils/motion';
import { useArticleMetadata } from '@/modules/library/application/context/ArticleMetadataContext';
import {
  collapseImplied,
  displayAspects,
  type ParsedAspect,
} from '@/modules/library/domain/aspects';
import { IconButton } from '@/lib/components/ui/iconButton';
import { useMounted } from '@/lib/hooks/useMounted';
import { useLocale, useTranslations } from 'next-intl';
import React, { useEffect, useRef, useState } from 'react';
import { AspectPill, type AspectSize } from './AspectPill';
import styles from './Aspects.module.scss';

/**
 * Aspect count past which a flat row becomes a compressed carousel.
 */
const CAROUSEL_THRESHOLD = 14;

/**
 * The same, for a run set into a heading rather than given a row.
 */
const INLINE_CAROUSEL_THRESHOLD = 4;

/**
 * Props for the Aspects component.
 *
 * @property {string} [section] - Heading text to look up in the article metadata
 * @property {string} [list] - Space-separated aspects, for authored overrides
 * @property {string[]} [aspects] - Explicit tag list, for callers holding metadata
 * @property {string} [label] - Optional caption shown before the row
 * @property {string} [from] - Slot level at which these aspects are gained
 * @property {AspectSize} [size] - Size step for the pills; defaults to `m`
 * @property {boolean} [inline] - Sit in a line of its own making rather than open a row
 */
export interface AspectsProps {
  section?: string;
  list?: string;
  aspects?: string[];
  label?: string;
  from?: string;
  size?: AspectSize;
  inline?: boolean;
}

/**
 * Toggle carousel expansion via root attribute.
 *
 * @returns {React.ReactElement | null} The toggle, or null with no provider to write to
 */
const ExpandToggle: React.FC<{ size?: AspectSize }> = ({ size }) => {
  const t = useTranslations('aspects');
  const dispatch = usePersistentUiDispatchOptional();
  const { aspectExpanded } = usePersistentUiStateOptional();
  const mounted = useMounted();

  if (!dispatch) return null;

  const expanded = mounted && aspectExpanded;

  return (
    <IconButton
      kind='add'
      shape='rhombus'
      size={size === 'xs' ? 's' : 'l'}
      tone={expanded ? 'danger' : 'accent'}
      aria-pressed={expanded}
      className={styles.toggle}
      label={expanded ? t('collapse') : t('expand')}
      onClick={() =>
        dispatch({
          type: PERSISTED_UI_ACTION_TYPES.SET_ASPECT_EXPANDED,
          payload: { expanded: !expanded },
        })
      }
    />
  );
};

/**
 * Renders a dense aspect set as a compressed stack that unpacks on hover.
 *
 * @param {object} props - Component props
 * @param {ParsedAspect[]} props.aspects - Display-ordered aspects
 * @param {string} props.locale - Active locale
 * @returns {React.ReactElement} The rendered carousel
 */
const AspectCarousel: React.FC<{
  aspects: ParsedAspect[];
  locale: string;
  size?: AspectSize;
  flip?: boolean;
}> = ({ aspects, locale, size, flip = false }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    /* Every carousel on the page shares one observer, and lets go of it as
       soon as it has been seen once. A sheet carries a stat block for each
       thing a creature can do, and all of them ask this at the same moment. */
    let stop = () => {};
    stop = watchVisible(
      node,
      (near) => {
        if (!near) return;
        setVisible(true);
        stop();
      },
      '200px',
    );
    return () => stop();
  }, []);

  return (
    <div
      className={styles.carouselWrap}
      data-size={size ?? undefined}
      data-flip={flip ? 'true' : undefined}>
      <span className={styles.controls}>
        <span className={styles.toggleWrap}>
          <ExpandToggle size={size} />
          <span className={styles.count} aria-hidden='true'>
            {aspects.length}
          </span>
        </span>
      </span>
      <div
        ref={ref}
        className={styles.carousel}
        style={{ '--count': aspects.length } as React.CSSProperties}
      >
        <div className={styles.track}>
          {visible
            ? aspects.map((aspect, index) => (
                <span
                  key={aspect.raw}
                  className={styles.slot}
                  style={
                    {
                      '--index': index,
                      '--z': aspects.length - index,
                    } as React.CSSProperties
                  }
                >
                  <AspectPill
                    aspect={aspect}
                    locale={locale}
                    size={size}
                    compact
                  />
                </span>
              ))
            : null}
        </div>
      </div>
    </div>
  );
};

/**
 * Renders the aspects of a page, a stat block or a single feature.
 *
 * @param {AspectsProps} props - Component props
 * @returns {React.ReactElement | null} The rendered row, or null when there is nothing to draw
 */
export const Aspects: React.FC<AspectsProps> = ({
  section,
  list,
  aspects,
  label,
  from,
  size,
  inline = false,
}) => {
  const locale = useLocale();
  const t = useTranslations('aspects');
  const { aspectsFor } = useArticleMetadata();

  const raw =
    aspects ??
    (list
      ? list.split(/\s+/).filter(Boolean)
      : section
        ? (aspectsFor(section) ?? [])
        : []);

  const parsed = collapseImplied(displayAspects(raw));

  if (!parsed.length) return null;

  /* Set into a heading there is far less room, so the run folds into the
     carousel sooner than it would given a row to itself. */
  const crowded = inline ? INLINE_CAROUSEL_THRESHOLD : CAROUSEL_THRESHOLD;

  return (
    <div
      className={inline ? styles.inlineRow : styles.row}
      data-size={size ?? undefined}
      data-from={from ?? undefined}>
      {label || from ? (
        <span className={styles.caption}>
          {from ? t('from', { source: from }) : label}
        </span>
      ) : null}
      {parsed.length > crowded ? (
        <AspectCarousel
          aspects={parsed}
          locale={locale}
          size={size}
          flip={inline}
        />
      ) : (
        <span className={styles.flat}>
          {parsed.map((aspect) => (
            <AspectPill
              key={aspect.raw}
              aspect={aspect}
              locale={locale}
              size={size}
            />
          ))}
        </span>
      )}
    </div>
  );
};

export default Aspects;
