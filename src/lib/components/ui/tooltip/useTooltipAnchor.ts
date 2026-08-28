/**
 * @fileoverview Tooltip Anchoring
 * @description Binds a floating surface to its trigger: CSS anchor positioning
 * where supported, {@link useAnchoredPosition} otherwise.
 *
 * @module lib/components/ui/tooltip/useTooltipAnchor
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import {
  toAnchorName,
  useAnchoredPosition,
  useCssAnchorSupport,
} from '@/lib/hooks/useAnchoredPosition';
import { useCallback, useId, useRef, useState } from 'react';
import { calculatePosition, type TooltipPlacement } from './calculatePosition';

export type { TooltipPlacement } from './calculatePosition';

/**
 * Result of {@link useTooltipAnchor}.
 *
 * @interface TooltipAnchor
 * @property {React.RefObject<HTMLElement | null>} triggerRef - Ref for the anchor element
 * @property {React.RefObject<HTMLDivElement | null>} surfaceRef - Ref for the floating element
 * @property {string} anchorName - `anchor-name` to set on the trigger and target from the surface
 * @property {TooltipPlacement} actualPlacement - Placement after flipping
 * @property {boolean} cssAnchored - Whether the engine positions the surface natively
 * @property {string} anchorId - Stable id for ARIA wiring
 * @property {() => void} reposition - Writes the surface position immediately
 */
export interface TooltipAnchor {
  triggerRef: React.RefObject<HTMLElement | null>;
  surfaceRef: React.RefObject<HTMLDivElement | null>;
  anchorName: string;
  actualPlacement: TooltipPlacement;
  cssAnchored: boolean;
  anchorId: string;
  reposition: () => void;
}

/**
 * Keeps a floating surface aligned to its trigger.
 *
 * @param {TooltipPlacement} placement - Preferred placement
 * @param {boolean} active - Whether the surface is mounted and should track
 * @returns {TooltipAnchor} Refs, anchor name and resolved placement
 */
export function useTooltipAnchor(
  placement: TooltipPlacement,
  active: boolean,
): TooltipAnchor {
  const triggerRef = useRef<HTMLElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [actualPlacement, setActualPlacement] = useState(placement);

  const anchorId = useId();
  const anchorName = toAnchorName(anchorId);
  const cssAnchored = useCssAnchorSupport();

  const compute = useCallback(
    (triggerRect: DOMRect, surfaceEl: HTMLElement) => {
      const {
        x,
        y,
        actualPlacement: resolved,
      } = calculatePosition(
        triggerRect,
        surfaceEl.getBoundingClientRect(),
        placement,
      );
      return { x, y, placement: resolved };
    },
    [placement],
  );

  const { reposition } = useAnchoredPosition(triggerRef, surfaceRef, compute, {
    active: !cssAnchored && active,
    onPlacementChange: (resolved) =>
      setActualPlacement(resolved as TooltipPlacement),
  });

  /** Repositions only under the JS fallback; a native write would double the offset. */
  const repositionIfOwned = useCallback(() => {
    if (cssAnchored) return;
    reposition();
  }, [cssAnchored, reposition]);

  return {
    triggerRef,
    surfaceRef,
    anchorName,
    actualPlacement,
    cssAnchored,
    anchorId,
    reposition: repositionIfOwned,
  };
}
