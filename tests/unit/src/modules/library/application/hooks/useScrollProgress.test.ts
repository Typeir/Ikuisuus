/**
 * @fileoverview useScrollProgress Hook Unit Tests
 * @module tests/unit/modules/library/application/hooks/useScrollProgress
 * @author Typeir
 * @version 1.0.0
 * @since 7.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useScrollProgress } from '@/modules/library/application/hooks/useScrollProgress';

describe('useScrollProgress', () => {
  let rafSpy: ReturnType<typeof vi.spyOn>;
  let cancelRafSpy: ReturnType<typeof vi.spyOn>;
  let mockRaf: number;

  beforeEach(() => {
    mockRaf = 0;
    rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0);
      return ++mockRaf;
    });
    cancelRafSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => { });

    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, writable: true, configurable: true });
  });

  afterEach(() => {
    rafSpy.mockRestore();
    cancelRafSpy.mockRestore();
  });

  describe('initial state', () => {
    it('should return initial scroll state on mount', () => {
      const { result } = renderHook(() => useScrollProgress());

      expect(result.current.viewportH).toBe(800);
      expect(result.current.docH).toBe(2000);
      expect(result.current.scrollY).toBe(0);
      expect(result.current.scrollPercent).toBe(0);
    });
  });

  describe('scroll tracking', () => {
    it('should update scrollY and scrollPercent on scroll', async () => {
      const { result } = renderHook(() => useScrollProgress());

      Object.defineProperty(window, 'scrollY', { value: 600, writable: true, configurable: true });

      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });

      await waitFor(() => {
        expect(result.current.scrollY).toBe(600);
      });
      expect(result.current.scrollPercent).toBe(0.5);
    });

    it('should clamp scrollPercent to 1 when fully scrolled', async () => {
      const { result } = renderHook(() => useScrollProgress());

      Object.defineProperty(window, 'scrollY', { value: 2000, writable: true, configurable: true });

      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });

      await waitFor(() => {
        expect(result.current.scrollPercent).toBe(1);
      });
    });
  });

  describe('resize handling', () => {
    it('should update viewportH on resize', async () => {
      const { result } = renderHook(() => useScrollProgress());

      Object.defineProperty(window, 'innerHeight', { value: 600, writable: true, configurable: true });

      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      await waitFor(() => {
        expect(result.current.viewportH).toBe(600);
      });
    });
  });

  describe('cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = renderHook(() => useScrollProgress());

      unmount();

      expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  describe('edge case: short document', () => {
    it('should report scrollPercent as 0 when doc is shorter than viewport', () => {
      Object.defineProperty(document.documentElement, 'scrollHeight', { value: 400, writable: true, configurable: true });

      const { result } = renderHook(() => useScrollProgress());

      expect(result.current.scrollPercent).toBe(0);
    });
  });
});
