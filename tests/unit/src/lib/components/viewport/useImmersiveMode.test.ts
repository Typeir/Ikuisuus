/**
 * useImmersiveMode Tests
 *
 * @fileoverview Covers feature detection, toggling, and change tracking for
 * the fullscreen hook.
 */

import { useImmersiveMode } from '@/lib/components/viewport/useImmersiveMode';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

/** Property names this suite stubs onto the document / root element. */
const STUBBED = [
  'requestFullscreen',
  'webkitRequestFullscreen',
  'exitFullscreen',
  'webkitExitFullscreen',
  'fullscreenElement',
  'webkitFullscreenElement',
] as const;

/** Defines a configurable own property so each test can clean up after itself. */
const stub = (target: object, key: string, value: unknown): void => {
  Object.defineProperty(target, key, {
    value,
    configurable: true,
    writable: true,
  });
};

/** Removes every stub this suite may have installed. */
const clearStubs = (): void => {
  for (const key of STUBBED) {
    delete (document as unknown as Record<string, unknown>)[key];
    delete (document.documentElement as unknown as Record<string, unknown>)[
      key
    ];
  }
};

describe('useImmersiveMode', () => {
  afterEach(() => {
    clearStubs();
  });

  it('should report no support when the UA exposes neither spelling', () => {
    clearStubs();

    const { result } = renderHook(() => useImmersiveMode());

    expect(result.current.supported).toBe(false);
  });

  it('should report support from the unprefixed API', () => {
    stub(document.documentElement, 'requestFullscreen', vi.fn());

    const { result } = renderHook(() => useImmersiveMode());

    expect(result.current.supported).toBe(true);
  });

  it('should report support from the WebKit-prefixed API', () => {
    stub(document.documentElement, 'webkitRequestFullscreen', vi.fn());

    const { result } = renderHook(() => useImmersiveMode());

    expect(result.current.supported).toBe(true);
  });

  it('should request fullscreen on the root element when inactive', () => {
    const request = vi.fn(() => Promise.resolve());
    stub(document.documentElement, 'requestFullscreen', request);
    stub(document, 'fullscreenElement', null);

    const { result } = renderHook(() => useImmersiveMode());
    act(() => result.current.toggle());

    expect(request).toHaveBeenCalledTimes(1);
  });

  it('should exit fullscreen when already active', () => {
    const exit = vi.fn(() => Promise.resolve());
    stub(document.documentElement, 'requestFullscreen', vi.fn());
    stub(document, 'exitFullscreen', exit);
    stub(document, 'fullscreenElement', document.documentElement);

    const { result } = renderHook(() => useImmersiveMode());
    act(() => result.current.toggle());

    expect(exit).toHaveBeenCalledTimes(1);
  });

  it('should track fullscreenchange events', () => {
    stub(document.documentElement, 'requestFullscreen', vi.fn());
    stub(document, 'fullscreenElement', null);

    const { result } = renderHook(() => useImmersiveMode());
    expect(result.current.active).toBe(false);

    stub(document, 'fullscreenElement', document.documentElement);
    act(() => {
      document.dispatchEvent(new Event('fullscreenchange'));
    });

    expect(result.current.active).toBe(true);
  });
});
