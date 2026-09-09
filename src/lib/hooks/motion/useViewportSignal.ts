/**
 * @fileoverview Binds a viewport watcher to a component's lifetime.
 * @module lib/hooks/motion/useViewportSignal
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { watchViewport } from '@/lib/utils/motion';
import { useEffect, useRef } from 'react';

/**
 * Watches the viewport for as long as the component is mounted.
 *
 * @param {() => void} run - What to do when something moved.
 * @param {readonly string[]} [events] - Further window events to listen for.
 * @returns {void} Nothing.
 */
export function useViewportSignal(
  run: () => void,
  events: readonly string[] = [],
): void {
  const latest = useRef(run);
  latest.current = run;

  /* Joined so a call site may pass a fresh array each render without the
     listeners being torn down and rebuilt on every commit. */
  const names = events.join(' ');

  useEffect(
    () =>
      watchViewport(
        () => latest.current(),
        names === '' ? [] : names.split(' '),
      ),
    [names],
  );
}
