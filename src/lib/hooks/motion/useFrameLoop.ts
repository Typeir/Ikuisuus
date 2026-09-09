/**
 * @fileoverview Binds a frame loop to a component's lifetime.
 * @module lib/hooks/motion/useFrameLoop
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { frameLoop } from '@/lib/utils/motion';
import { useEffect, useMemo, useRef } from 'react';

/**
 * Runs a callback at most once per frame, and drops a booked frame on unmount.
 *
 * @param {() => void} run - What to do on the frame.
 * @returns {() => void} Asks for a frame, ignored if one is already booked.
 */
export function useFrameLoop(run: () => void): () => void {
  const latest = useRef(run);

  /* Held in a ref so a call site may pass a fresh closure each render without
     tearing down the listeners that were wired to the previous one. */
  latest.current = run;

  const loop = useMemo(() => frameLoop(() => latest.current()), []);
  useEffect(() => loop.cancel, [loop]);

  return loop.schedule;
}
