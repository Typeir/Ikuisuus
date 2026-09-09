/**
 * @fileoverview Binds a sticky watcher to a component's lifetime and render.
 * @module lib/hooks/motion/useStuck
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { watchStuck } from '@/lib/utils/motion';
import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

/**
 * What a watched sticky element reports.
 *
 * @property {boolean} stuck - Whether it is pinned, for rendering.
 * @property {RefObject<boolean>} pinned - The same answer, for reading in an effect.
 */
export interface Stuck {
  stuck: boolean;
  pinned: RefObject<boolean>;
}

/**
 * Says whether a sticky element has reached its resting line.
 *
 * @description The answer arrives as state so it may be rendered, and beside it
 * as a ref, since an effect running in the same commit would otherwise read the
 * state it is about to replace.
 *
 * @param {RefObject<HTMLElement | null>} row - The sticky element.
 * @param {number} offset - Where it comes to rest, in pixels from the top.
 * @returns {Stuck} Whether it is pinned, as state and as a ref.
 */
export function useStuck(
  row: RefObject<HTMLElement | null>,
  offset: number,
): Stuck {
  const [stuck, setStuck] = useState(false);
  const pinned = useRef(false);

  useEffect(
    () =>
      watchStuck(row.current, offset, (on) => {
        pinned.current = on;
        setStuck(on);
      }),
    [row, offset],
  );

  return { stuck, pinned };
}
