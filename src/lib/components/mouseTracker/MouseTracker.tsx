/**
 * @fileoverview Minimal client mouse tracker — writes cursor position to CSS variables
 * @module lib/components/mouseTracker/MouseTracker
 * @author Typeir
 * @version 0.1.0
 * @since 29-4-2026
 */

'use client';

import { useEffect } from 'react';

/**
 * Write normalized mouse coordinates to root CSS variables as percentages.
 * @param {number} clientX
 * @param {number} clientY
 */
function setMouseVars(clientX: number, clientY: number) {
  const xPct = (clientX / window.innerWidth) * 100;
  const yPct = (clientY / window.innerHeight) * 100;
  document.documentElement.style.setProperty('--mouse-x', `${xPct}%`);
  document.documentElement.style.setProperty('--mouse-y', `${yPct}%`);
}

/**
 * Client component that tracks pointer movement and updates CSS variables.
 * Stateless — does not cause React re-renders on movement.
 * @returns {null}
 */
export default function MouseTracker(): null {
  useEffect(() => {
    const onMove = (e: MouseEvent) => setMouseVars(e.clientX, e.clientY);
    const onPointer = (e: PointerEvent) => setMouseVars(e.clientX, e.clientY);
    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('pointermove', onPointer, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('pointermove', onPointer);
    };
  }, []);

  return null;
}
