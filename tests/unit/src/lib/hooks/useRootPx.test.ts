/**
 * @fileoverview useRootPx Tests
 * @description Covers root font-size measurement, the fallback when the value
 * cannot be read, and re-measurement when the root's style attribute changes.
 *
 * @module tests/unit/src/lib/hooks/useRootPx.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react Hook rendering
 * @requires @/lib/hooks/useRootPx Module under test
 */

import {
  FALLBACK_ROOT_PX,
  measureRootPx,
  useRootPx,
} from '@/lib/hooks/useRootPx';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('measureRootPx', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.style.fontSize = '';
  });

  it('should read the root font size in px', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      fontSize: '18px',
    } as CSSStyleDeclaration);
    expect(measureRootPx()).toBe(18);
  });

  it('should fall back when the value is unreadable', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      fontSize: '',
    } as CSSStyleDeclaration);
    expect(measureRootPx()).toBe(FALLBACK_ROOT_PX);
  });
});

describe('useRootPx', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.style.fontSize = '';
  });

  it('should return the measured root px', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      fontSize: '16px',
    } as CSSStyleDeclaration);
    const { result } = renderHook(() => useRootPx());
    expect(result.current).toBe(16);
  });

  it('should re-measure when the root style attribute changes', async () => {
    const spy = vi
      .spyOn(window, 'getComputedStyle')
      .mockReturnValue({ fontSize: '14px' } as CSSStyleDeclaration);
    const { result } = renderHook(() => useRootPx());
    expect(result.current).toBe(14);

    spy.mockReturnValue({ fontSize: '21px' } as CSSStyleDeclaration);
    await act(async () => {
      document.documentElement.style.setProperty('--text-scale-user', '1.5');
      await Promise.resolve();
    });
    expect(result.current).toBe(21);
  });
});
