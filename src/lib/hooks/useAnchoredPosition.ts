/**
 * @fileoverview Anchored position hook.
 * @description Positions a floating element against an anchor element on scroll
 * and resize. Writes `transform` directly to the DOM node.
 *
 * @module lib/hooks/useAnchoredPosition
 * @version 1.0.0
 * @author Typeir
 * @since 9.0.0
 */

'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

/**
 * Reports whether the browser supports CSS anchor positioning.
 *
 * Returns false during SSR and on browsers without support, which is the signal
 * to run the JavaScript positioning fallback.
 *
 * @returns {boolean} True when `anchor-name` is supported
 */
export function useCssAnchorSupport(): boolean {
  const [supported] = useState(
    () =>
      typeof CSS !== 'undefined' &&
      typeof CSS.supports === 'function' &&
      CSS.supports('anchor-name: --a'),
  );
  return supported;
}

/**
 * Builds a CSS dashed-ident anchor name from a React id.
 *
 * @param {string} id - Value from `useId`
 * @returns {string} Anchor name usable as a custom property value
 */
export function toAnchorName(id: string): string {
  return `--ik-anchor-${id.replace(/[^a-zA-Z0-9]/g, '')}`;
}

/**
 * Position produced by a compute function.
 *
 * @interface AnchoredPoint
 * @property {number} x - Viewport x in px
 * @property {number} y - Viewport y in px
 * @property {string} [placement] - Resolved placement key
 */
export interface AnchoredPoint {
  x: number;
  y: number;
  placement?: string;
}

/**
 * Derives a floating element's viewport position from its anchor.
 *
 * @callback AnchoredCompute
 * @param {DOMRect} anchorRect - Anchor bounding rect
 * @param {HTMLElement} floatEl - Floating element
 * @returns {AnchoredPoint} Computed position
 */
export type AnchoredCompute = (
  anchorRect: DOMRect,
  floatEl: HTMLElement,
) => AnchoredPoint;

/**
 * Options for useAnchoredPosition.
 *
 * @interface AnchoredPositionOptions
 * @property {boolean} active - Whether listeners are attached and writes occur
 * @property {(placement: string) => void} [onPlacementChange] - Called when the resolved placement changes
 */
export interface AnchoredPositionOptions {
  active: boolean;
  onPlacementChange?: (placement: string) => void;
}

/**
 * Result of useAnchoredPosition.
 *
 * @interface AnchoredPositionResult
 * @property {() => void} reposition - Writes the position immediately
 * @property {() => void} schedule - Writes the position on the next animation frame
 */
export interface AnchoredPositionResult {
  reposition: () => void;
  schedule: () => void;
}

/**
 * Keeps a floating element aligned to an anchor element.
 *
 * Reads the anchor rect, applies `compute`, and writes the result as
 * `translate3d` on the floating element. Scroll and resize listeners are
 * passive and coalesced to one write per frame. The position never enters React
 * state, so scrolling triggers no re-render.
 *
 * The element stays `visibility: hidden` until the first position is written,
 * so it never paints at the viewport origin. Repositioning runs after every
 * render, which covers a floating element that mounts after activation and any
 * change to its size.
 *
 * The floating element must be laid out at the viewport origin
 * (`position: fixed; top: 0; left: 0`) and must not receive `transform` from any
 * other source.
 *
 * @param {RefObject<HTMLElement | null>} anchorRef - Element to align against
 * @param {RefObject<HTMLElement | null>} floatRef - Element to position
 * @param {AnchoredCompute} compute - Derives the position from the anchor rect
 * @param {AnchoredPositionOptions} options - Activation and placement callback
 * @returns {AnchoredPositionResult} Imperative reposition controls
 * @example
 * ```tsx
 * const { reposition } = useAnchoredPosition(
 *   triggerRef,
 *   panelRef,
 *   (rect, el) => ({ x: rect.left, y: rect.bottom + 4 }),
 *   { active: open },
 * );
 * ```
 */
export function useAnchoredPosition(
  anchorRef: RefObject<HTMLElement | null>,
  floatRef: RefObject<HTMLElement | null>,
  compute: AnchoredCompute,
  { active, onPlacementChange }: AnchoredPositionOptions,
): AnchoredPositionResult {
  const rafRef = useRef<number | null>(null);
  const placementRef = useRef<string | undefined>(undefined);
  const positionedRef = useRef(false);
  const computeRef = useRef(compute);
  const placementCbRef = useRef(onPlacementChange);

  computeRef.current = compute;
  placementCbRef.current = onPlacementChange;

  const reposition = useCallback(() => {
    const anchor = anchorRef.current;
    const float = floatRef.current;
    if (!anchor || !float) return;

    const point = computeRef.current(anchor.getBoundingClientRect(), float);
    float.style.transform = `translate3d(${Math.round(point.x)}px, ${Math.round(point.y)}px, 0)`;

    if (!positionedRef.current) {
      positionedRef.current = true;
      float.style.visibility = '';
    }

    if (point.placement && point.placement !== placementRef.current) {
      placementRef.current = point.placement;
      placementCbRef.current?.(point.placement);
    }
  }, [anchorRef, floatRef]);

  const schedule = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      reposition();
    });
  }, [reposition]);

  useLayoutEffect(() => {
    if (!active) {
      placementRef.current = undefined;
      positionedRef.current = false;
      return;
    }

    const float = floatRef.current;
    if (float && !positionedRef.current) {
      float.style.visibility = 'hidden';
    }

    reposition();
  });

  useEffect(() => {
    if (!active) return;

    window.addEventListener('scroll', schedule, { passive: true, capture: true });
    window.addEventListener('resize', schedule, { passive: true });

    return () => {
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [active, schedule]);

  return { reposition, schedule };
}

export default useAnchoredPosition;
