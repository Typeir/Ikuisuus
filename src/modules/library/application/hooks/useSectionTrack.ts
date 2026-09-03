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
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useScrollProgress } from './useScrollProgress';

/** Mobile auto-hide idle duration (ms). */
const MOBILE_IDLE_MS = 1_500;

/** Breakpoint below which mobile auto-hide activates. */
const MOBILE_BREAKPOINT = 768;

/**
 * Label of a heading: the part marked `[data-heading-title]` when the heading
 * also carries a tag or cost, otherwise its whole text.
 *
 * @param {HTMLElement} el - Heading element
 * @returns {string | null} Trimmed label, or null when empty
 */
function headingLabel(el: HTMLElement): string | null {
  const title = el.querySelector<HTMLElement>('[data-heading-title]');
  const text = (title ?? el).textContent?.trim();
  return text ? text : null;
}

/**
 * Extracts H1–H6 `[data-anchor]` elements from the DOM, sorted by document position.
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
      label: headingLabel(el) ?? anchor,
    });
  }

  return items.sort((a, b) => a.top - b.top);
}

/**
 * Returns true when two SectionTrackItem arrays have equal length, anchors, and positions.
 *
 * @param {SectionTrackItem[]} a - Previous items.
 * @param {SectionTrackItem[]} b - Next items.
 * @returns {boolean} True when arrays are equivalent.
 */
function itemsEqual(a: SectionTrackItem[], b: SectionTrackItem[]): boolean {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i].anchor !== b[i].anchor || a[i].top !== b[i].top) {
      return false;
    }
  }

  return true;
}

/**
 * Return type for `useSectionTrack`.
 *
 * @property {SectionTrackItem[]} items - All heading items.
 * @property {string | null} activeAnchor - Anchor of the currently active section.
 * @property {boolean} visible - Whether the track is visible (mobile auto-hide).
 * @property {number} docH - Total document height for proportional positioning.
 * @property {number} viewportH - Current viewport height (px).
 * @property {(item: SectionTrackItem) => number} centerProximity - 0–1 score for center distance.
 */
interface SectionTrackState {
  items: SectionTrackItem[];
  activeAnchor: string | null;
  visible: boolean;
  docH: number;
  viewportH: number;
  centerProximity: (item: SectionTrackItem) => number;
}

/**
 * Tracks `[data-anchor]` headings: active section, proportional positions, mobile auto-hide.
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

  /** Scan headings synchronously on mount, throttled on resize and details toggle. */
  useLayoutEffect(() => {
    setItems(scanHeadings());

    const rescan = () => {
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(() => {
        setItems((prev) => {
          const next = scanHeadings();
          return itemsEqual(prev, next) ? prev : next;
        });
        rafRef.current = null;
      });
    };

    const onDetailsToggle = (e: Event) => {
      if ((e.target as HTMLElement).tagName === 'DETAILS') {
        rescan();
      }
    };

    window.addEventListener('resize', rescan, { passive: true });
    window.addEventListener('ik:details-opened', rescan);
    document.addEventListener('toggle', onDetailsToggle, true);

    return () => {
      window.removeEventListener('resize', rescan);
      window.removeEventListener('ik:details-opened', rescan);
      document.removeEventListener('toggle', onDetailsToggle, true);

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
      viewportH,
      docH,
      centerProximity,
    }),
    [items, activeAnchor, visible, viewportH, docH, centerProximity],
  );

  return trackState;
}
