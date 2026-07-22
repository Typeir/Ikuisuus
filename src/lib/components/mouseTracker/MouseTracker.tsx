/**
 * @fileoverview Minimal client mouse tracker — writes cursor position to CSS variables
 * @module lib/components/mouseTracker/MouseTracker
 * @author Typeir
 * @version 0.2.0
 * @since 29-4-2026
 */

'use client';

import { useEffect } from 'react';

type Props = {
  /** Optional ref to the element that should receive the CSS vars. If omitted, falls back to document.documentElement */
  targetRef?: React.RefObject<HTMLElement>;
  /** Optional callback fired on first mouse movement */
  onFirstMove?: () => void;
};

/**
 * Write mouse coordinates to CSS variables on the target element.
 * Emits both percentage vars (--mouse-x/--mouse-y, for gradient positions)
 * and pixel vars (--mouse-px/--mouse-py, for transform-driven consumers —
 * percentages inside translate() resolve against the element's own box, so
 * transforms need absolute pixels).
 * @param {number} clientX
 * @param {number} clientY
 */
function setMouseVars(
  clientX: number,
  clientY: number,
  target: HTMLElement | null,
) {
  const xPct = (clientX / window.innerWidth) * 100;
  const yPct = (clientY / window.innerHeight) * 100;
  const el = target;
  if (!el) return;
  el.style.setProperty('--mouse-x', `${xPct}%`);
  el.style.setProperty('--mouse-y', `${yPct}%`);
  el.style.setProperty('--mouse-px', `${clientX}px`);
  el.style.setProperty('--mouse-py', `${clientY}px`);
}

/**
 * Client component that tracks pointer movement and updates CSS variables.
 * Stateless — does not cause React re-renders on movement.
 * Respects user preferences for reduced motion and coarse pointers by disabling tracking.
 * Coalesces updates to one write per animation frame; consumers are expected
 * to use the vars in transform-only ways, so a full-rate rAF is composite-cheap.
 *
 * @param {Props} props
 * @param {React.RefObject<HTMLElement>} props.targetRef - Optional ref to the element that should receive the CSS vars. If omitted, falls back to document.documentElement
 * @param {() => void} props.onFirstMove - Optional callback fired once on first mouse movement
 *
 * @returns {null}
 */
export default function MouseTracker({ targetRef, onFirstMove }: Props): null {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mmReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const mmCoarse = window.matchMedia?.('(hover: none), (pointer: coarse)');
    if (mmReduced?.matches || mmCoarse?.matches) return;

    const getTarget = () => targetRef && targetRef.current;

    let rafId: number | null = null;
    let lastX = 0;
    let lastY = 0;
    let hasMovedRef = { moved: false };

    const flush = () => {
      rafId = null;
      const target = getTarget();
      if (!target) return;
      setMouseVars(lastX, lastY, target);
    };

    const schedule = () => {
      if (rafId == null) {
        rafId = requestAnimationFrame(flush);
      }
    };

    const handler = (e: PointerEvent | MouseEvent) => {
      if (!hasMovedRef.moved && onFirstMove) {
        hasMovedRef.moved = true;
        onFirstMove();
      }
      lastX = (e as PointerEvent).clientX ?? (e as MouseEvent).clientX;
      lastY = (e as PointerEvent).clientY ?? (e as MouseEvent).clientY;
      schedule();
    };

    window.addEventListener('pointermove', handler as EventListener, {
      passive: true,
    });
    window.addEventListener('mousemove', handler as EventListener, {
      passive: true,
    });

    return () => {
      if (rafId != null) cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', handler as EventListener);
      window.removeEventListener('mousemove', handler as EventListener);
    };
  }, [targetRef, onFirstMove]);

  return null;
}
