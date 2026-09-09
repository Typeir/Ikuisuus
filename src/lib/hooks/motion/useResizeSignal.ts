/**
 * @fileoverview Binds an element size watcher to a component's lifetime.
 * @module lib/hooks/motion/useResizeSignal
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { watchResize } from '@/lib/utils/motion';
import { useEffect, useRef } from 'react';

/**
 * Watches one element for as long as the component is mounted.
 *
 * @description The target is resolved once on mount, after refs are filled and
 * while `document` is available.
 *
 * @param {() => Element | null} pick - Finds the element to watch.
 * @param {() => void} run - What to do when it changed, and once on mount.
 * @returns {void} Nothing.
 */
export function useResizeSignal(
  pick: () => Element | null,
  run: () => void,
): void {
  const latest = useRef(run);
  const target = useRef(pick);
  latest.current = run;
  target.current = pick;

  useEffect(() => watchResize(target.current(), () => latest.current()), []);
}
