/**
 * @fileoverview Section Track — vertical navigation widget for library content pages.
 * Renders clickable horizontal bars for each heading anchor, proportional to
 * scroll position, with center-scaling, mobile auto-hide, hover-expand
 * animation, and minimum inter-bar spacing.
 * @module modules/library/presentation/components/SectionTrack/SectionTrack
 * @author Typeir
 * @version 1.2.0
 * @since 7.0.0
 */

'use client';

import { Tooltip } from '@/lib/components/ui/tooltip';
import { useSidebarMenuState } from '@/lib/context/PersistentUiContext';
import { useSectionTrack } from '@/modules/library/application/hooks/useSectionTrack';
import type { SectionTrackItem } from '@/modules/library/domain';
import type { TooltipPlacement } from '@/lib/components/ui/tooltip';
import type { JSX } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './SectionTrack.module.scss';

/** Width below which the track sits on the right (the stylesheet's `max-width: 1023px`), so tooltips open leftward there. */
const SMALL_SCREEN_BP = 1024;

/**
 * Bar width base (rem) for heading level 1. Deeper levels are narrower.
 */
const BAR_WIDTH_BASE = 5;

/**
 * Bar thickness range by heading level: h1 (thickest) → h6 (thinnest).
 * Values in px.
 */
const BAR_THICKNESS: Record<number, number> = {
  1: 5,
  2: 4.5,
  3: 4,
  4: 3.5,
  5: 3,
  6: 2.5,
};

/** Minimum vertical gap between adjacent bars (px). */
const MIN_BAR_GAP_PX = 8;

/** Track height as a fraction of the viewport. */
const TRACK_HEIGHT_RATIO = 0.8;

/**
 * Computes adjusted top percentages for bars so that no two bars are
 * closer than {@link MIN_BAR_GAP_PX}.
 *
 * Raw proportional positions are pushed downward when they would
 * otherwise overlap or sit too close to the previous bar.
 *
 * @param {SectionTrackItem[]} items - Ordered heading items.
 * @param {number} docH - Total document height (px).
 * @param {number} viewportH - Viewport height (px).
 * @returns {number[]} Adjusted top percentages, one per item.
 */
function computeSpacedTopPercents(
  items: SectionTrackItem[],
  docH: number,
  viewportH: number,
): number[] {
  const trackHeight = viewportH * TRACK_HEIGHT_RATIO;

  if (trackHeight <= 0 || items.length === 0) {
    return items.map(() => 0);
  }

  const percents: number[] = [];
  let prevTrackTop = -Infinity;
  let prevThickness = 0;

  for (const item of items) {
    const thickness = BAR_THICKNESS[item.level] ?? 2;
    const rawTrackTop = (item.top / docH) * trackHeight;
    const minTop = prevTrackTop + prevThickness + MIN_BAR_GAP_PX;
    const clampedTrackTop = Math.max(rawTrackTop, minTop);
    const topPercent = (clampedTrackTop / trackHeight) * 100;

    percents.push(topPercent);
    prevTrackTop = clampedTrackTop;
    prevThickness = thickness;
  }

  return percents;
}

/**
 * Vertical navigation track that floats alongside library content.
 *
 * Scans all `[data-anchor]` headings, renders proportional horizontal bars
 * on a fixed-position track. Bars near the viewport center are scaled up
 * and more opaque. On mobile viewports, auto-hides after idle timeout.
 * Bars shrink when the track is not hovered and expand on hover.
 * Each bar has a tooltip showing the heading label.
 *
 * @returns {JSX.Element | null} The track element, or null if no headings found.
 */
export function SectionTrack(): JSX.Element | null {
  const { items, activeAnchor, visible, docH, viewportH, centerProximity } =
    useSectionTrack();
  const { isOpen: menuOpen } = useSidebarMenuState();
  const [isSmallScreen, setIsSmallScreen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < SMALL_SCREEN_BP,
  );

  useEffect(() => {
    const onResize = () => {
      setIsSmallScreen(window.innerWidth < SMALL_SCREEN_BP);
    };

    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const topPercents = useMemo(
    () => computeSpacedTopPercents(items, docH, viewportH),
    [items, docH, viewportH],
  );

  if (items.length === 0 || docH === 0) return null;

  const tooltipPlacement: TooltipPlacement = isSmallScreen ? 'left' : 'right';

  return (
    <nav
      className={styles.track}
      aria-label='Page sections'
      data-visible={visible && !menuOpen}
      data-menu-open={menuOpen}>
      <div className={styles.inner}>
        {items.map((item, i) => (
          <SectionTrackBar
            key={`${item.anchor}--${i}`}
            item={item}
            topPercent={topPercents[i]}
            active={item.anchor === activeAnchor}
            proximity={centerProximity(item)}
            tooltipPlacement={tooltipPlacement}
            disabled={menuOpen}
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
 * @property {number} topPercent - Vertical position as percentage of track height.
 * @property {boolean} active - Whether this section is currently active.
 * @property {number} proximity - Center proximity score (0–1).
 * @property {TooltipPlacement} tooltipPlacement - Which side the tooltip appears on.
 * @property {boolean} disabled - When true, clicks are suppressed (menu open).
 */
interface SectionTrackBarProps {
  item: SectionTrackItem;
  topPercent: number;
  active: boolean;
  proximity: number;
  tooltipPlacement: TooltipPlacement;
  disabled: boolean;
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
  topPercent,
  active,
  proximity,
  tooltipPlacement,
  disabled,
}: SectionTrackBarProps): JSX.Element {
  const width = BAR_WIDTH_BASE - (item.level - 1) * 0.35;
  const thickness = BAR_THICKNESS[item.level] ?? 2;
  const scale = 1 + proximity * 0.3;
  const opacity = 0.3 + proximity * 0.7;

  const handleClick = useCallback(() => {
    if (disabled) return;
    window.location.hash = `#${item.anchor}`;
  }, [disabled, item.anchor]);

  return (
    <Tooltip
      content={<span>{item.label}</span>}
      placement={tooltipPlacement}
      showArrow
      showClickIcon={false}
      inline>
      <button
        type='button'
        className={styles.bar}
        data-active={active}
        onClick={handleClick}
        aria-label={`Jump to ${item.label}`}
        style={{
          position: 'absolute',
          top: `${topPercent}%`,
          width: `${width}rem`,
          height: `${thickness}px`,
          transform: `scaleY(${scale})`,
          opacity,
        }}
      />
    </Tooltip>
  );
}
