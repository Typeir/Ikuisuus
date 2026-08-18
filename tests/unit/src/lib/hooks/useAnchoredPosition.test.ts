/**
 * @fileoverview Tests for useAnchoredPosition.
 * @module tests/unit/lib/hooks/useAnchoredPosition
 */

import { useAnchoredPosition } from '@/lib/hooks/useAnchoredPosition';
import { act, renderHook } from '@testing-library/react';
import { createRef, type RefObject } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const makeRefs = () => {
  const anchor = document.createElement('div');
  const float = document.createElement('div');
  document.body.append(anchor, float);

  anchor.getBoundingClientRect = () =>
    ({ top: 100, bottom: 120, left: 50, right: 150, width: 100, height: 20 }) as DOMRect;

  const anchorRef = createRef<HTMLElement>() as RefObject<HTMLElement | null>;
  const floatRef = createRef<HTMLElement>() as RefObject<HTMLElement | null>;
  (anchorRef as { current: HTMLElement }).current = anchor;
  (floatRef as { current: HTMLElement }).current = float;

  return { anchor, float, anchorRef, floatRef };
};

describe('useAnchoredPosition', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('writes the computed position as a transform on activation', () => {
    const { float, anchorRef, floatRef } = makeRefs();

    renderHook(() =>
      useAnchoredPosition(
        anchorRef,
        floatRef,
        (rect) => ({ x: rect.left, y: rect.bottom + 4 }),
        { active: true },
      ),
    );

    expect(float.style.transform).toBe('translate3d(50px, 124px, 0)');
  });

  it('does not write while inactive', () => {
    const { float, anchorRef, floatRef } = makeRefs();

    renderHook(() =>
      useAnchoredPosition(anchorRef, floatRef, (rect) => ({ x: rect.left, y: rect.top }), {
        active: false,
      }),
    );

    expect(float.style.transform).toBe('');
  });

  it('repositions on scroll', () => {
    const { anchor, float, anchorRef, floatRef } = makeRefs();
    const raf = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: FrameRequestCallback) => {
        cb(0);
        return 1;
      });

    renderHook(() =>
      useAnchoredPosition(anchorRef, floatRef, (rect) => ({ x: rect.left, y: rect.top }), {
        active: true,
      }),
    );

    anchor.getBoundingClientRect = () =>
      ({ top: 40, bottom: 60, left: 50, right: 150, width: 100, height: 20 }) as DOMRect;

    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    expect(float.style.transform).toBe('translate3d(50px, 40px, 0)');
    raf.mockRestore();
  });

  it('coalesces multiple scroll events into one frame', () => {
    const { anchorRef, floatRef } = makeRefs();
    const compute = vi.fn((rect: DOMRect) => ({ x: rect.left, y: rect.top }));
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);

    renderHook(() =>
      useAnchoredPosition(anchorRef, floatRef, compute, { active: true }),
    );
    compute.mockClear();

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new Event('scroll'));
    });

    expect(compute).not.toHaveBeenCalled();
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
  });

  it('reports placement changes once per change', () => {
    const { anchorRef, floatRef } = makeRefs();
    const onPlacementChange = vi.fn();

    const { rerender } = renderHook(() =>
      useAnchoredPosition(
        anchorRef,
        floatRef,
        (rect) => ({ x: rect.left, y: rect.top, placement: 'top' }),
        { active: true, onPlacementChange },
      ),
    );

    rerender();

    expect(onPlacementChange).toHaveBeenCalledTimes(1);
    expect(onPlacementChange).toHaveBeenCalledWith('top');
  });

  it('removes listeners on deactivation', () => {
    const { anchorRef, floatRef } = makeRefs();
    const remove = vi.spyOn(window, 'removeEventListener');

    const { rerender } = renderHook(
      ({ active }) =>
        useAnchoredPosition(anchorRef, floatRef, (rect) => ({ x: rect.left, y: rect.top }), {
          active,
        }),
      { initialProps: { active: true } },
    );

    rerender({ active: false });

    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function), true);
    expect(remove).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
