/**
 * @fileoverview Anchored position hook.
 * @description Positions a floating element against an anchor element on scroll
 * and resize.
 *
 * @module lib/hooks/useAnchoredPosition
 * @version 1.0.0
 * @author Typeir
 * @since 9.0.0
 */

'use client';

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';

/**
 * Reports whether the browser supports CSS anchor positioning.
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
 * Result of useAnchorName.
 *
 * @interface AnchorNameResult
 * @property {string} anchorName - Dashed-ident for the floating element's `position-anchor`
 * @property {boolean} cssAnchored - True when the engine honours CSS anchor positioning
 */
export interface AnchorNameResult {
  anchorName: string;
  cssAnchored: boolean;
}

/**
 * Names an anchor element for CSS anchor positioning while active.
 *
 * @param {RefObject<HTMLElement | null>} anchorRef - Element that receives `anchor-name`
 * @param {boolean} [active] - Write the name only while true (default `true`)
 * @returns {AnchorNameResult} The name and whether the engine supports it
 * @example
 * ```tsx
 * const { anchorName, cssAnchored } = useAnchorName(triggerRef, open);
 * <div style={{ positionAnchor: anchorName }} />
 * ```
 */
export function useAnchorName(
  anchorRef: RefObject<HTMLElement | null>,
  active: boolean = true,
): AnchorNameResult {
  const cssAnchored = useCssAnchorSupport();
  const anchorName = toAnchorName(useId());

  useLayoutEffect(() => {
    const el = anchorRef.current;
    if (!cssAnchored || !active || !el) return;
    el.style.setProperty('anchor-name', anchorName);
    return () => {
      el.style.removeProperty('anchor-name');
    };
  }, [anchorRef, anchorName, cssAnchored, active]);

  return { anchorName, cssAnchored };
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
