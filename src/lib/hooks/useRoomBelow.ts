/**
 * Viewport Room Measurement
 *
 * @fileoverview Measures the vertical space between an element's edge and the
 * viewport bottom, re-measured on resize. Sizes dropdowns and scroll boxes
 * that must fit under their anchor.
 *
 * @module lib/hooks/useRoomBelow
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import {
  useCallback,
  useLayoutEffect,
  useState,
  type RefObject,
} from 'react';

/**
 * Options for {@link useRoomBelow}.
 *
 * @interface UseRoomBelowOptions
 * @property {'top' | 'bottom'} [edge] - Element edge the room is measured from (default `'bottom'`)
 * @property {number} [min] - Smallest value ever returned (default `0`)
 * @property {number} [margin] - Breathing room subtracted from the measure (default `16`)
 * @property {boolean} [active] - Measure only while true (default `true`)
 */
export interface UseRoomBelowOptions {
  edge?: 'top' | 'bottom';
  min?: number;
  margin?: number;
  active?: boolean;
}

/**
 * Pixel room between an element's edge and the viewport bottom.
 *
 * @param {RefObject<HTMLElement | null>} ref - Element the room is measured under
 * @param {UseRoomBelowOptions} [options] - Edge, floor, margin, and activity
 * @returns {number | null} Pixel room, or null before the first measure
 *
 * @example
 * const maxHeight = useRoomBelow(wrapRef, { min: 160, active: open }) ?? 160;
 */
export function useRoomBelow(
  ref: RefObject<HTMLElement | null>,
  options: UseRoomBelowOptions = {},
): number | null {
  const { edge = 'bottom', min = 0, margin = 16, active = true } = options;
  const [room, setRoom] = useState<number | null>(null);

  const measure = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const base = edge === 'top' ? rect.top : rect.bottom;
    setRoom(Math.max(min, window.innerHeight - base - margin));
  }, [ref, edge, min, margin]);

  useLayoutEffect(() => {
    if (!active) return;
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [active, measure]);

  return room;
}
