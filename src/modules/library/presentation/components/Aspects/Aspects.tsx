/**
 * @fileoverview Aspects MDX component. Pills link to searches. Display and expansion driven by root attributes.
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
import { useArticleMetadata } from '@/modules/library/application/context/ArticleMetadataContext';
import {
  displayAspects,
  type ParsedAspect,
} from '@/modules/library/domain/aspects';
import { Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import React, { useEffect, useRef, useState } from 'react';
import { AspectPill } from './AspectPill';
import styles from './Aspects.module.scss';

/**
 * Aspect count past which a flat row becomes a compressed carousel.
 */
const CAROUSEL_THRESHOLD = 14;

/**
 * Props for the Aspects component.
 *
 * @property {string} [section] - Heading text to look up in the article metadata
 * @property {string} [list] - Space-separated aspects, for authored overrides
 * @property {string[]} [aspects] - Explicit tag list, for callers holding metadata
 * @property {string} [label] - Optional caption shown before the row
 * @property {string} [from] - Slot level at which these aspects are gained
 */
export interface AspectsProps {
  section?: string;
  list?: string;
  aspects?: string[];
  label?: string;
  from?: string;
}

/**
 * Toggle carousel expansion via root attribute. Returns null without provider.
 *
 * @returns {React.ReactElement | null} The toggle, or null with no provider to write to
 */
const ExpandToggle: React.FC = () => {
  const t = useTranslations('aspects');
  const dispatch = usePersistentUiDispatchOptional();
  const { aspectExpanded } = usePersistentUiStateOptional();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!dispatch) return null;

  const expanded = mounted && aspectExpanded;

  return (
    <button
      type='button'
      className={styles.toggle}
      aria-pressed={expanded}
      aria-label={expanded ? t('collapse') : t('expand')}
      onClick={() =>
        dispatch({
          type: PERSISTED_UI_ACTION_TYPES.SET_ASPECT_EXPANDED,
          payload: { expanded: !expanded },
        })
      }
    >
      <Plus className={styles.toggleIcon} size={14} aria-hidden='true' />
    </button>
  );
};

/**
 * Renders a dense aspect set as a compressed stack that unpacks on hover.
 * Builds glyphs once the element reaches the viewport.
 *
 * @param {object} props - Component props
 * @param {ParsedAspect[]} props.aspects - Display-ordered aspects
 * @param {string} props.locale - Active locale
 * @returns {React.ReactElement} The rendered carousel
 */
const AspectCarousel: React.FC<{
  aspects: ParsedAspect[];
  locale: string;
}> = ({ aspects, locale }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.carouselWrap}>
      <span className={styles.controls}>
        <span className={styles.toggleWrap}>
          <ExpandToggle />
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
                      zIndex: aspects.length - index,
                    } as React.CSSProperties
                  }
                >
                  <AspectPill aspect={aspect} locale={locale} compact />
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

  const parsed = displayAspects(raw);

  if (!parsed.length) return null;

  return (
    <div className={styles.row} data-from={from ?? undefined}>
      {label || from ? (
        <span className={styles.caption}>
          {from ? t('from', { source: from }) : label}
        </span>
      ) : null}
      {parsed.length > CAROUSEL_THRESHOLD ? (
        <AspectCarousel aspects={parsed} locale={locale} />
      ) : (
        <span className={styles.flat}>
          {parsed.map((aspect) => (
            <AspectPill key={aspect.raw} aspect={aspect} locale={locale} />
          ))}
        </span>
      )}
    </div>
  );
};

export default Aspects;
