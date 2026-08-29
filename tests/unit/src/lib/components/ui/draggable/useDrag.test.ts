/**
 * @fileoverview useDrag Tests
 * @description Covers pointer drag, corner resize, bounds clamping and the
 * value-compared repositioning that lets a caller move an element after mount.
 *
 * @module tests/unit/src/lib/components/ui/draggable/useDrag
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react act and renderHook
 * @requires @/lib/components/ui/draggable/useDrag Module under test
 */

import {
  KEY_STEP,
  KEY_STEP_COARSE,
  MIN_HEIGHT,
  MIN_WIDTH,
  useDrag,
} from '@/lib/components/ui/draggable/useDrag';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from 'react';

/**
 * Builds an element with a fixed rect, optionally inside a bounding parent.
 *
 * @param {number} width - Element width
 * @param {number} height - Element height
 * @param {number} [boundsWidth] - Parent width, when bounds are wanted
 * @param {number} [boundsHeight] - Parent height
 * @returns {{ container: RefObject<HTMLElement | null>; bounds: RefObject<HTMLElement | null> }} Refs
 */
function refs(
  width: number,
  height: number,
  boundsWidth = 1000,
  boundsHeight = 800,
) {
  /* `clientWidth`/`clientHeight` are stubbed too: the positioning-function path
     measures the bounds with those rather than with the rect. */
  const stub = (w: number, h: number) => (el: HTMLElement) => {
    el.getBoundingClientRect = () =>
      ({ x: 0, y: 0, width: w, height: h, top: 0, left: 0, right: w, bottom: h, toJSON() { return this; } }) as DOMRect;
    Object.defineProperty(el, 'clientWidth', { value: w, configurable: true });
    Object.defineProperty(el, 'clientHeight', { value: h, configurable: true });
    return el;
  };

  const parent = stub(boundsWidth, boundsHeight)(document.createElement('div'));
  const child = stub(width, height)(document.createElement('div'));
  parent.appendChild(child);

  return {
    container: { current: child } as RefObject<HTMLElement | null>,
    bounds: { current: parent } as RefObject<HTMLElement | null>,
  };
}

/**
 * Builds a pointer event stub.
 *
 * @param {number} x - Client x
 * @param {number} y - Client y
 * @returns {ReactPointerEvent} Event stub
 */
function pointer(x: number, y: number): ReactPointerEvent {
  return {
    clientX: x,
    clientY: y,
    pointerId: 1,
    preventDefault: () => {},
    stopPropagation: () => {},
    target: { setPointerCapture: () => {} },
  } as unknown as ReactPointerEvent;
}

/**
 * Builds a keyboard event stub.
 *
 * @param {string} key - Key value
 * @param {boolean} [shiftKey] - Whether Shift is held
 * @returns {ReactKeyboardEvent} Event stub
 */
function arrow(key: string, shiftKey = false): ReactKeyboardEvent {
  return {
    key,
    shiftKey,
    preventDefault: () => {},
  } as unknown as ReactKeyboardEvent;
}

describe('useDrag', () => {
  it('starts at the given position', () => {
    const { container, bounds } = refs(200, 100);
    const { result } = renderHook(() =>
      useDrag({
        containerRef: container,
        boundsRef: bounds,
        initialPosition: { x: 30, y: 40 },
      }),
    );

    expect(result.current.position).toEqual({ x: 30, y: 40 });
  });

  it('moves by the pointer delta while dragging', () => {
    const { container, bounds } = refs(200, 100);
    const { result } = renderHook(() =>
      useDrag({
        containerRef: container,
        boundsRef: bounds,
        initialPosition: { x: 50, y: 50 },
      }),
    );

    act(() => result.current.dragHandleProps.onPointerDown(pointer(10, 10)));
    act(() => result.current.dragHandleProps.onPointerMove(pointer(40, 70)));

    expect(result.current.position).toEqual({ x: 80, y: 110 });
    expect(result.current.isDragging).toBe(true);

    act(() => result.current.dragHandleProps.onPointerUp());
    expect(result.current.isDragging).toBe(false);
  });

  it('ignores movement before the drag starts', () => {
    const { container, bounds } = refs(200, 100);
    const { result } = renderHook(() =>
      useDrag({ containerRef: container, boundsRef: bounds }),
    );

    act(() => result.current.dragHandleProps.onPointerMove(pointer(40, 70)));

    expect(result.current.position).toEqual({ x: 0, y: 0 });
  });

  it('clamps a drag inside the bounds', () => {
    const { container, bounds } = refs(200, 100, 500, 400);
    const { result } = renderHook(() =>
      useDrag({
        containerRef: container,
        boundsRef: bounds,
        initialPosition: { x: 0, y: 0 },
      }),
    );

    act(() => result.current.dragHandleProps.onPointerDown(pointer(0, 0)));
    act(() => result.current.dragHandleProps.onPointerMove(pointer(9999, 9999)));

    expect(result.current.position).toEqual({ x: 300, y: 300 });

    act(() => result.current.dragHandleProps.onPointerMove(pointer(-9999, -9999)));
    expect(result.current.position).toEqual({ x: 0, y: 0 });
  });

  it('resizes from the corner, never below the minimum', () => {
    const { container, bounds } = refs(300, 200);
    const { result } = renderHook(() =>
      useDrag({ containerRef: container, boundsRef: bounds }),
    );

    act(() => result.current.resizeHandleProps.onPointerDown(pointer(0, 0)));
    act(() => result.current.resizeHandleProps.onPointerMove(pointer(60, 40)));

    expect(result.current.size).toEqual({ width: 360, height: 240 });
    expect(result.current.isResizing).toBe(true);

    act(() => result.current.resizeHandleProps.onPointerMove(pointer(-9999, -9999)));
    expect(result.current.size).toEqual({
      width: MIN_WIDTH,
      height: MIN_HEIGHT,
    });

    act(() => result.current.resizeHandleProps.onPointerUp());
    expect(result.current.isResizing).toBe(false);
  });

  it('moves when new static coordinates arrive', () => {
    const { container, bounds } = refs(200, 100);
    const { result, rerender } = renderHook(
      ({ pos }) =>
        useDrag({
          containerRef: container,
          boundsRef: bounds,
          initialPosition: pos,
        }),
      { initialProps: { pos: { x: 10, y: 10 } } },
    );

    rerender({ pos: { x: 70, y: 90 } });

    expect(result.current.position).toEqual({ x: 70, y: 90 });
  });

  it('ignores a new object carrying the same coordinates', () => {
    const { container, bounds } = refs(200, 100);
    const { result, rerender } = renderHook(
      ({ pos }) =>
        useDrag({
          containerRef: container,
          boundsRef: bounds,
          initialPosition: pos,
        }),
      { initialProps: { pos: { x: 10, y: 10 } } },
    );

    act(() => result.current.dragHandleProps.onPointerDown(pointer(0, 0)));
    act(() => result.current.dragHandleProps.onPointerMove(pointer(25, 25)));
    expect(result.current.position).toEqual({ x: 35, y: 35 });

    /* A fresh literal with unchanged values must not undo the drag. */
    rerender({ pos: { x: 10, y: 10 } });

    expect(result.current.position).toEqual({ x: 35, y: 35 });
  });

  it('moves by arrow key, coarser with Shift', () => {
    const { container, bounds } = refs(200, 100);
    const { result } = renderHook(() =>
      useDrag({
        containerRef: container,
        boundsRef: bounds,
        initialPosition: { x: 100, y: 100 },
      }),
    );

    act(() => result.current.dragHandleProps.onKeyDown(arrow('ArrowRight')));
    expect(result.current.position).toEqual({ x: 100 + KEY_STEP, y: 100 });

    act(() =>
      result.current.dragHandleProps.onKeyDown(arrow('ArrowDown', true)),
    );
    expect(result.current.position).toEqual({
      x: 100 + KEY_STEP,
      y: 100 + KEY_STEP_COARSE,
    });
  });

  it('ignores keys that are not arrows', () => {
    const { container, bounds } = refs(200, 100);
    const { result } = renderHook(() =>
      useDrag({
        containerRef: container,
        boundsRef: bounds,
        initialPosition: { x: 10, y: 10 },
      }),
    );

    act(() => result.current.dragHandleProps.onKeyDown(arrow('Enter')));

    expect(result.current.position).toEqual({ x: 10, y: 10 });
  });

  it('clamps a keyboard move inside the bounds', () => {
    const { container, bounds } = refs(200, 100, 500, 400);
    const { result } = renderHook(() =>
      useDrag({
        containerRef: container,
        boundsRef: bounds,
        initialPosition: { x: 0, y: 0 },
      }),
    );

    act(() => result.current.dragHandleProps.onKeyDown(arrow('ArrowLeft')));

    expect(result.current.position).toEqual({ x: 0, y: 0 });
  });

  it('resizes by arrow key, never below the minimum', () => {
    const { container, bounds } = refs(300, 200);
    const { result } = renderHook(() =>
      useDrag({ containerRef: container, boundsRef: bounds }),
    );

    act(() => result.current.resizeHandleProps.onKeyDown(arrow('ArrowRight')));
    expect(result.current.size).toEqual({
      width: 300 + KEY_STEP,
      height: 200,
    });

    act(() =>
      result.current.resizeHandleProps.onKeyDown(arrow('ArrowUp', true)),
    );
    expect(result.current.size?.height).toBe(200 - KEY_STEP_COARSE);

    /* Enough coarse steps to overshoot the floor, which must still hold. */
    for (let i = 0; i < 10; i += 1) {
      act(() =>
        result.current.resizeHandleProps.onKeyDown(arrow('ArrowUp', true)),
      );
    }
    expect(result.current.size?.height).toBe(MIN_HEIGHT);
  });

  it('exposes both handles to the tab order', () => {
    const { container, bounds } = refs(200, 100);
    const { result } = renderHook(() =>
      useDrag({ containerRef: container, boundsRef: bounds }),
    );

    expect(result.current.dragHandleProps.tabIndex).toBe(0);
    expect(result.current.resizeHandleProps.tabIndex).toBe(0);
  });

  it('resolves a positioning function against the bounds', () => {
    const { container, bounds } = refs(200, 100, 800, 600);
    const { result } = renderHook(() =>
      useDrag({
        containerRef: container,
        boundsRef: bounds,
        initialPosition: ({ width, height }) => ({
          x: width / 2,
          y: height / 2,
        }),
      }),
    );

    expect(result.current.position.x).toBeGreaterThan(0);
    expect(result.current.position.y).toBeGreaterThan(0);
  });
});
