/**
 * @fileoverview Section track hook — scans heading anchors, tracks active section,
 * computes proportional positions for the visual track widget.
 * @module modules/library/application/hooks/useSectionTrack
 * @author Typeir
 * @version 1.0.0
 * @since 7.0.0
 */

'use client';

import type { SectionTrackItem } from '@/modules/library/domain';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useScrollProgress } from './useScrollProgress';

/** Mobile auto-hide idle duration (ms). */
const MOBILE_IDLE_MS = 1_500;

/** Breakpoint below which mobile auto-hide activates. */
const MOBILE_BREAKPOINT = 768;

/**
 * Extracts heading-level data-anchor elements from the DOM.
 *
 * Filters to H1–H6 elements with `data-anchor` attributes, sorts
 * by document position, and returns structured items.
 *
 * @returns {SectionTrackItem[]} Ordered heading items.
 */
function scanHeadings(): SectionTrackItem[] {
  const headings = document.querySelectorAll<HTMLElement>(
    'h1[data-anchor], h2[data-anchor], h3[data-anchor], h4[data-anchor], h5[data-anchor], h6[data-anchor]',
  );

  const items: SectionTrackItem[] = [];

  for (const el of headings) {
    const anchor = el.getAttribute('data-anchor');
    if (!anchor) continue;

    const level = parseInt(el.tagName[1], 10) as SectionTrackItem['level'];
    const rect = el.getBoundingClientRect();
    const top = rect.top + window.scrollY;

    items.push({
      anchor,
      level,
      top,
      height: rect.height,
      label: el.textContent?.trim() ?? anchor,
    });
  }

  return items.sort((a, b) => a.top - b.top);
}

/**
 * Return type for `useSectionTrack`.
 *
 * @property {SectionTrackItem[]} items - All heading items.
 * @property {string | null} activeAnchor - Anchor of the currently active section.
 * @property {boolean} visible - Whether the track is visible (mobile auto-hide).
 * @property {number} docH - Total document height for proportional positioning.
 * @property {(item: SectionTrackItem) => number} centerProximity - 0–1 score for center distance.
 */
interface SectionTrackState {
  items: SectionTrackItem[];
  activeAnchor: string | null;
  visible: boolean;
  docH: number;
  centerProximity: (item: SectionTrackItem) => number;
}

/**
 * Tracks page headings for the Section Track navigation widget.
 *
 * Scans all `[data-anchor]` headings (H1–H6), determines the active
 * section via scroll position, and computes proportional positions for
 * rendering bars on the track. On mobile, auto-hides after idle timeout.
 *
 * @returns {SectionTrackState} Heading items, active anchor, visibility flag, center proximity function.
 */
export function useSectionTrack(): SectionTrackState {
  const { scrollY, viewportH, docH } = useScrollProgress();
  const [items, setItems] = useState<SectionTrackItem[]>([]);
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);
  const [visible, setVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  /** Scan headings synchronously on mount, throttled on resize. */
  useLayoutEffect(() => {
    setItems(scanHeadings());

    const onResize = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        setItems(scanHeadings());
        rafRef.current = null;
      });
    };

    window.addEventListener('resize', onResize, { passive: true });

    return () => {
      window.removeEventListener('resize', onResize);

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  /** Determine active section: the last heading whose top ≤ scrollY + viewportH * 0.4. */
  useEffect(() => {
    if (items.length === 0) {
      setActiveAnchor(null);
      return;
    }

    const threshold = scrollY + viewportH * 0.4;
    let active: string | null = null;

    for (const item of items) {
      if (item.top <= threshold) {
        active = item.anchor;
      } else {
        break;
      }
    }

    setActiveAnchor(active);
  }, [items, scrollY, viewportH]);

  /** Mobile detection and auto-hide logic. */
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  /** Auto-hide on mobile after idle timeout. */
  useEffect(() => {
    if (!isMobile) {
      setVisible(true);
      return;
    }

    const resetTimer = () => {
      setVisible(true);

      if (idleTimerRef.current !== null) {
        clearTimeout(idleTimerRef.current);
      }

      idleTimerRef.current = setTimeout(() => {
        setVisible(false);
      }, MOBILE_IDLE_MS);
    };

    resetTimer();

    window.addEventListener('pointermove', resetTimer, { passive: true });
    window.addEventListener('touchstart', resetTimer, { passive: true });
    window.addEventListener('scroll', resetTimer, { passive: true });

    return () => {
      window.removeEventListener('pointermove', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('scroll', resetTimer);

      if (idleTimerRef.current !== null) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [isMobile]);

  /**
   * Computes how close an item is to the center of the visible viewport.
   *
   * Returns 0 when the item is at the viewport edge and 1 when it's
   * at the exact center. Clamped to [0, 1].
   *
   * @param {SectionTrackItem} item - The heading item.
   * @returns {number} Proximity score (0 = edge, 1 = center).
   */
  const centerProximity = useCallback(
    (item: SectionTrackItem): number => {
      const centerY = scrollY + viewportH / 2;
      const maxDist = viewportH / 2;
      const dist = Math.abs(item.top - centerY);
      return Math.max(0, 1 - dist / maxDist);
    },
    [scrollY, viewportH],
  );

  /** Export stable items + docH for external consumer; items array reference changes on rescan. */
  const trackState = useMemo<SectionTrackState>(
    () => ({
      items,
      activeAnchor,
      visible,
      docH,
      centerProximity,
    }),
    [items, activeAnchor, visible, docH, centerProximity],
  );

  return trackState;
}
