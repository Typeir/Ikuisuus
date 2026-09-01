/**
 * @fileoverview useTooltipAnchor Tests
 * @description Covers anchor naming, placement reporting, and the rule that the
 * JavaScript fallback never writes a position the engine already resolved.
 *
 * @module tests/unit/src/lib/components/ui/tooltip/useTooltipAnchor.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react act and renderHook
 * @requires @/lib/components/ui/tooltip/useTooltipAnchor Module under test
 */

import { useTooltipAnchor } from '@/lib/components/ui/tooltip/useTooltipAnchor';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Replaces the global `CSS` object so anchor support can be forced either way.
 *
 * @param {boolean} supported - Whether `anchor-name` should report as supported
 * @returns {void}
 */
function setAnchorSupport(supported: boolean): void {
  vi.stubGlobal('CSS', { supports: () => supported });
}

/**
 * Builds an element whose bounding rect is fixed.
 *
 * @param {number} x - Left edge
 * @param {number} y - Top edge
 * @param {number} width - Rect width
 * @param {number} height - Rect height
 * @returns {HTMLElement} Element with a stubbed rect
 */
function elementAt(
  x: number,
  y: number,
  width: number,
  height: number,
): HTMLElement {
  const el = document.createElement('div');
  el.getBoundingClientRect = () =>
    ({
      x,
      y,
      width,
      height,
      top: y,
      left: x,
      right: x + width,
      bottom: y + height,
      toJSON() {
        return this;
      },
    }) as DOMRect;
  return el;
}

describe('useTooltipAnchor', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      writable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 768,
      writable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('derives a dashed-ident anchor name', () => {
    setAnchorSupport(true);
    const { result } = renderHook(() => useTooltipAnchor('top', false));

    expect(result.current.anchorName).toMatch(/^--ik-anchor-[a-zA-Z0-9]+$/);
  });

  it('reports the requested placement until one is resolved', () => {
    setAnchorSupport(true);
    const { result } = renderHook(() => useTooltipAnchor('right', false));

    expect(result.current.actualPlacement).toBe('right');
  });

  it('reports native anchoring when the engine supports it', () => {
    setAnchorSupport(true);
    const { result } = renderHook(() => useTooltipAnchor('top', true));

    expect(result.current.cssAnchored).toBe(true);
  });

  it('writes no transform when the engine positions natively', () => {
    setAnchorSupport(true);
    const { result } = renderHook(() => useTooltipAnchor('top', true));

    const trigger = elementAt(100, 400, 60, 20);
    const surface = elementAt(0, 0, 200, 80);

    act(() => {
      result.current.triggerRef.current = trigger;
      result.current.surfaceRef.current = surface;
      result.current.reposition();
    });

    expect(surface.style.transform).toBe('');
  });

  it('writes a transform when the fallback owns the surface', () => {
    setAnchorSupport(false);
    const { result } = renderHook(() => useTooltipAnchor('top', true));

    const trigger = elementAt(100, 400, 60, 20);
    const surface = elementAt(0, 0, 200, 80);

    act(() => {
      result.current.triggerRef.current = trigger;
      result.current.surfaceRef.current = surface;
      result.current.reposition();
    });

    expect(result.current.cssAnchored).toBe(false);
    expect(surface.style.transform).toMatch(/^translate3d\(-?\d+px, -?\d+px, 0\)$/);
  });

  it('does nothing when either element is missing', () => {
    setAnchorSupport(false);
    const { result } = renderHook(() => useTooltipAnchor('top', true));

    expect(() => act(() => result.current.reposition())).not.toThrow();
  });
});
