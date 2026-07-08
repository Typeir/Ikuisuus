/**
 * @fileoverview Section Track — vertical navigation widget for library content pages.
 * Renders clickable horizontal bars for each heading anchor, proportional to
 * scroll position, with center-scaling and mobile auto-hide.
 * @module modules/library/presentation/components/SectionTrack/SectionTrack
 * @author Typeir
 * @version 1.0.0
 * @since 7.0.0
 */

'use client';

import { useSectionTrack } from '@/modules/library/application/hooks/useSectionTrack';
import type { SectionTrackItem } from '@/modules/library/domain';
import styles from './SectionTrack.module.scss';

/**
 * Bar width base (rem) for heading level 1. Deeper levels are narrower.
 */
const BAR_WIDTH_BASE = 5;

/**
 * Bar thickness range by heading level: h1 (thickest) → h6 (thinnest).
 */
const BAR_THICKNESS: Record<number, number> = {
  1: 4,
  2: 3.5,
  3: 3,
  4: 2.5,
  5: 2,
  6: 1.5,
};

/**
 * Vertical navigation track that floats alongside library content.
 *
 * Scans all `[data-anchor]` headings, renders proportional horizontal bars
 * on a fixed-position track. Bars near the viewport center are scaled up
 * and more opaque. On mobile viewports, auto-hides after idle timeout.
 *
 * @returns {JSX.Element | null} The track element, or null if no headings found.
 */
export function SectionTrack(): JSX.Element | null {
  const { items, activeAnchor, visible, docH, centerProximity } = useSectionTrack();

  if (items.length === 0 || docH === 0) return null;

  return (
    <nav
      className={styles.track}
      aria-label='Page sections'
      data-visible={visible}>
      <div className={styles.inner}>
        {items.map((item, i) => (
          <SectionTrackBar
            key={`${item.anchor}--${i}`}
            item={item}
            docH={docH}
            active={item.anchor === activeAnchor}
            proximity={centerProximity(item)}
          />
        ))}
      </div>
    </nav>
  );
}

/**
 * Props for an individual section track bar.
 *
 * @property {SectionTrackItem} item - The heading item.
 * @property {number} docH - Total document height for proportional positioning.
 * @property {boolean} active - Whether this section is currently active.
 * @property {number} proximity - Center proximity score (0–1).
 */
interface SectionTrackBarProps {
  item: SectionTrackItem;
  docH: number;
  active: boolean;
  proximity: number;
}

/**
 * A single horizontal bar in the section track.
 *
 * Width and thickness scale down with heading level.
 * Vertical position is proportional to the heading's position in the document.
 * Scale and opacity increase as the bar approaches the viewport center.
 * Clicking scrolls to the heading via hash navigation.
 *
 * @param {SectionTrackBarProps} props - Bar props.
 * @returns {JSX.Element} The bar button.
 */
function SectionTrackBar({
  item,
  docH,
  active,
  proximity,
}: SectionTrackBarProps): JSX.Element {
  const width = BAR_WIDTH_BASE - (item.level - 1) * 0.35;
  const thickness = BAR_THICKNESS[item.level] ?? 2;
  const scale = 1 + proximity * 0.3;
  const opacity = 0.3 + proximity * 0.7;

  /** Vertical position as percentage of document height. */
  const topPercent = (item.top / docH) * 100;

  const handleClick = () => {
    window.location.hash = `#${item.anchor}`;
  };

  return (
    <button
      type='button'
      className={styles.bar}
      data-active={active}
      onClick={handleClick}
      aria-label={`Jump to ${item.label}`}
      style={{
        top: `${topPercent}%`,
        width: `${width}rem`,
        height: `${thickness}px`,
        transform: `scaleY(${scale})`,
        opacity,
      }}
    />
  );
}

