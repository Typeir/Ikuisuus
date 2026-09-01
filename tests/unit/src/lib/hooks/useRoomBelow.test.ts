/**
 * @fileoverview useRoomBelow Unit Tests
 * @description Tests edge selection, the floor, inactivity, and resize
 * re-measurement.
 *
 * @module tests/unit/src/lib/hooks/useRoomBelow.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @/lib/hooks/useRoomBelow Module under test
 */

import { useRoomBelow } from '@/lib/hooks/useRoomBelow';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

/**
 * Builds a ref whose element reports the given rect edges.
 *
 * @param {number} top - Reported top edge
 * @param {number} bottom - Reported bottom edge
 * @returns {{ current: HTMLElement }} Ref with a stubbed measurement
 */
function refWithRect(top: number, bottom: number): { current: HTMLElement } {
  const el = document.createElement('div');
  el.getBoundingClientRect = () =>
    ({ top, bottom }) as DOMRect;
  return { current: el };
}

describe('useRoomBelow', () => {
  it('measures from the bottom edge by default', () => {
    const ref = refWithRect(100, 140);
    const { result } = renderHook(() =>
      useRoomBelow(ref, { margin: 16 }),
    );

    expect(result.current).toBe(window.innerHeight - 140 - 16);
  });

  it('measures from the top edge when asked', () => {
    const ref = refWithRect(100, 140);
    const { result } = renderHook(() =>
      useRoomBelow(ref, { edge: 'top', margin: 16 }),
    );

    expect(result.current).toBe(window.innerHeight - 100 - 16);
  });

  it('never reports less than the floor', () => {
    const ref = refWithRect(0, window.innerHeight + 500);
    const { result } = renderHook(() => useRoomBelow(ref, { min: 240 }));

    expect(result.current).toBe(240);
  });

  it('reports null while inactive', () => {
    const ref = refWithRect(100, 140);
    const { result } = renderHook(() =>
      useRoomBelow(ref, { active: false }),
    );

    expect(result.current).toBeNull();
  });

  it('re-measures on resize', () => {
    const ref = refWithRect(100, 140);
    const { result } = renderHook(() => useRoomBelow(ref, { margin: 0 }));
    const before = result.current;

    ref.current.getBoundingClientRect = () =>
      ({ top: 300, bottom: 340 }) as DOMRect;
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(before).toBe(window.innerHeight - 140);
    expect(result.current).toBe(window.innerHeight - 340);
  });
});
