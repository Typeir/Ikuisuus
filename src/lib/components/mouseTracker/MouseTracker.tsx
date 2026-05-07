/**
 * @fileoverview Minimal client mouse tracker — writes cursor position to CSS variables
 * @module lib/components/mouseTracker/MouseTracker
 * @author Typeir
 * @version 0.1.0
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
 * Write normalized mouse coordinates to root CSS variables as percentages.
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
}

/**
 * Client component that tracks pointer movement and updates CSS variables.
 * Stateless — does not cause React re-renders on movement.
 * Respects user preferences for reduced motion and coarse pointers by disabling tracking.
 * Uses RAF to throttle updates to ~30fps.
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

    let lastFrameTime = 0;
    const fpsLimit = 1000 / 30;

    const flush = (currentTime: any) => {
      rafId = null;

      if (currentTime - lastFrameTime >= fpsLimit) {
        lastFrameTime = currentTime;
        const target = getTarget();
        if (!target) return;
        setMouseVars(lastX, lastY, target);
      }
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
