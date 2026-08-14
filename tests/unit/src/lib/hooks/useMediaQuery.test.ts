/**
 * @fileoverview Unit tests for the useMediaQuery and useIsMobileViewport hooks.
 * @description Tests matchMedia queries against the vitest.setup.ts stub,
 * which matches `(max-width: Npx)` against window.innerWidth and re-evaluates
 * on window resize.
 *
 * @module tests/unit/lib/hooks/useMediaQuery
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react React Testing Library
 * @requires @/lib/hooks/useMediaQuery Hooks under test
 */

import {
    MOBILE_VIEWPORT_QUERY,
    useIsMobileViewport,
    useMediaQuery,
} from '@/lib/hooks/useMediaQuery';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

/**
 * Sets window.innerWidth to width and dispatches a resize event.
 *
 * @param width - New innerWidth value
 */
function setViewportWidth(width: number): void {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event('resize'));
}

describe('useMediaQuery', () => {
  it('returns true when the query matches the current width', () => {
    setViewportWidth(500);
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(result.current).toBe(true);
  });

  it('returns false when the query does not match', () => {
    setViewportWidth(1200);
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(result.current).toBe(false);
  });

  it('updates when the viewport crosses the breakpoint', () => {
    setViewportWidth(1200);
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(result.current).toBe(false);

    act(() => {
      setViewportWidth(400);
    });
    expect(result.current).toBe(true);

    act(() => {
      setViewportWidth(1024);
    });
    expect(result.current).toBe(false);
  });
});

describe('useIsMobileViewport', () => {
  it('exposes the sidebar-aligned breakpoint constant (strictly below 1024px)', () => {
    expect(MOBILE_VIEWPORT_QUERY).toBe('(max-width: 1023.98px)');
  });

  it('reports true on phone-sized viewports', () => {
    setViewportWidth(390);
    const { result } = renderHook(() => useIsMobileViewport());
    expect(result.current).toBe(true);
  });

  it('reports false on desktop viewports', () => {
    setViewportWidth(1440);
    const { result } = renderHook(() => useIsMobileViewport());
    expect(result.current).toBe(false);
  });
});
