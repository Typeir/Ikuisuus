/**
 * Outside Click
 *
 * @fileoverview One document pointerdown listener that fires a callback when
 * the press lands outside every given element.
 *
 * @module lib/hooks/useOutsideClick
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { useEffect, useRef, type RefObject } from 'react';

/** One element ref, or several that together count as inside. */
export type OutsideClickTargets =
  | RefObject<HTMLElement | null>
  | ReadonlyArray<RefObject<HTMLElement | null>>;

/**
 * Calls `onOutside` on a pointerdown outside every target element.
 *
 * Listens on `pointerdown`, so touch and pen behave like mouse. Targets and
 * callback are read through refs; only `active` re-attaches the listener.
 *
 * @param {OutsideClickTargets} targets - Element ref or refs that count as inside
 * @param {() => void} onOutside - Called when the press lands outside all targets
 * @param {boolean} [active] - Attach the listener (default `true`)
 * @returns {void}
 *
 * @example
 * useOutsideClick(panelRef, close, isOpen);
 */
export function useOutsideClick(
  targets: OutsideClickTargets,
  onOutside: () => void,
  active: boolean = true,
): void {
  const targetsRef = useRef(targets);
  targetsRef.current = targets;
  const onOutsideRef = useRef(onOutside);
  onOutsideRef.current = onOutside;

  useEffect(() => {
    if (!active) return;

    const handler = (event: Event) => {
      const current = targetsRef.current;
      const list = Array.isArray(current) ? current : [current];
      const node = event.target as Node | null;
      const inside =
        node !== null && list.some((ref) => ref.current?.contains(node));
      if (!inside) onOutsideRef.current();
    };

    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [active]);
}
