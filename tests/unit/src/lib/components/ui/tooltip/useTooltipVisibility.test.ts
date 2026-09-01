/**
 * @fileoverview useTooltipVisibility Tests
 * @description Covers the open/close lifecycle every hover surface shares:
 * delays, the held-open exit phase, and the immediate variants.
 *
 * @module tests/unit/src/lib/components/ui/tooltip/useTooltipVisibility.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react act and renderHook
 * @requires @/lib/components/ui/tooltip/useTooltipVisibility Module under test
 */

import { useTooltipVisibility } from '@/lib/components/ui/tooltip/useTooltipVisibility';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('useTooltipVisibility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts closed', () => {
    const { result } = renderHook(() => useTooltipVisibility());

    expect(result.current.isVisible).toBe(false);
    expect(result.current.showPortal).toBe(false);
  });

  it('opens only once the show delay has elapsed', () => {
    const { result } = renderHook(() =>
      useTooltipVisibility({ showDelay: 200 }),
    );

    act(() => result.current.show());
    expect(result.current.isVisible).toBe(false);

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.isVisible).toBe(true);
  });

  it('stays mounted through the exit phase, then unmounts', () => {
    const { result } = renderHook(() =>
      useTooltipVisibility({ showDelay: 0, hideDelay: 0, exitDuration: 150 }),
    );

    act(() => {
      result.current.show();
      vi.advanceTimersByTime(0);
    });

    act(() => {
      result.current.hide();
      vi.advanceTimersByTime(0);
    });
    expect(result.current.exiting).toBe(true);
    expect(result.current.showPortal).toBe(true);

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current.showPortal).toBe(false);
  });

  it('cancels an in-progress exit instead of restarting the enter', () => {
    const { result } = renderHook(() =>
      useTooltipVisibility({ showDelay: 0, hideDelay: 0, exitDuration: 150 }),
    );

    act(() => {
      result.current.show();
      vi.advanceTimersByTime(0);
    });
    act(() => {
      result.current.hide();
      vi.advanceTimersByTime(0);
    });
    act(() => result.current.show());

    expect(result.current.exiting).toBe(false);
    expect(result.current.isVisible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.isVisible).toBe(true);
  });

  it('does not open while disabled', () => {
    const { result } = renderHook(() =>
      useTooltipVisibility({ showDelay: 0, disabled: true }),
    );

    act(() => {
      result.current.show();
      vi.advanceTimersByTime(50);
    });

    expect(result.current.isVisible).toBe(false);
  });

  it('opens on the spot with showNow', () => {
    const { result } = renderHook(() =>
      useTooltipVisibility({ showDelay: 500 }),
    );

    act(() => result.current.showNow());

    expect(result.current.isVisible).toBe(true);
  });

  it('closes on the spot with hideNow, skipping the exit phase', () => {
    const { result } = renderHook(() =>
      useTooltipVisibility({ showDelay: 0, exitDuration: 150 }),
    );

    act(() => {
      result.current.show();
      vi.advanceTimersByTime(0);
    });
    act(() => result.current.hideNow());

    expect(result.current.isVisible).toBe(false);
    expect(result.current.exiting).toBe(false);
    expect(result.current.showPortal).toBe(false);
  });
});
