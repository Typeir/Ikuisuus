/**
 * @fileoverview useDebounce Hook Unit Tests
 * @description Tests for the useDebounce hook that delays value updates
 * until the input stops changing for a specified duration.
 *
 * @module tests/unit/lib/hooks/useDebounce
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react React Testing Library
 * @requires @/lib/hooks/useDebounce Hook under test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/lib/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial value', () => {
    it('should return initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('initial', 300));
      expect(result.current).toBe('initial');
    });

    it('should work with number values', () => {
      const { result } = renderHook(() => useDebounce(42, 300));
      expect(result.current).toBe(42);
    });

    it('should work with object values', () => {
      const obj = { key: 'value' };
      const { result } = renderHook(() => useDebounce(obj, 300));
      expect(result.current).toEqual({ key: 'value' });
    });

    it('should work with null values', () => {
      const { result } = renderHook(() => useDebounce(null, 300));
      expect(result.current).toBeNull();
    });

    it('should work with undefined values', () => {
      const { result } = renderHook(() => useDebounce(undefined, 300));
      expect(result.current).toBeUndefined();
    });
  });

  describe('debounce behavior', () => {
    it('should not update value before delay expires', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });
      
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current).toBe('initial');
    });

    it('should update value after delay expires', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current).toBe('updated');
    });

    it('should reset timer on rapid value changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'first' });
      act(() => {
        vi.advanceTimersByTime(200);
      });

      rerender({ value: 'second' });
      act(() => {
        vi.advanceTimersByTime(200);
      });

      rerender({ value: 'third' });
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(result.current).toBe('initial');

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current).toBe('third');
    });

    it('should only emit last value after rapid changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: 'a' } }
      );

      rerender({ value: 'b' });
      rerender({ value: 'c' });
      rerender({ value: 'd' });
      rerender({ value: 'final' });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current).toBe('final');
    });
  });

  describe('custom delay', () => {
    it('should respect custom delay value', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: 'start' } }
      );

      rerender({ value: 'end' });

      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(result.current).toBe('start');

      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current).toBe('end');
    });

    it('should use default 300ms delay when not specified', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value),
        { initialProps: { value: 'start' } }
      );

      rerender({ value: 'end' });

      act(() => {
        vi.advanceTimersByTime(299);
      });
      expect(result.current).toBe('start');

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(result.current).toBe('end');
    });

    it('should work with very short delays', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 10),
        { initialProps: { value: 'start' } }
      );

      rerender({ value: 'end' });

      act(() => {
        vi.advanceTimersByTime(10);
      });
      expect(result.current).toBe('end');
    });

    it('should work with zero delay', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 0),
        { initialProps: { value: 'start' } }
      );

      rerender({ value: 'end' });

      act(() => {
        vi.advanceTimersByTime(0);
      });
      expect(result.current).toBe('end');
    });
  });

  describe('delay changes', () => {
    it('should handle delay changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'start', delay: 200 } }
      );

      rerender({ value: 'middle', delay: 200 });
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(result.current).toBe('middle');

      rerender({ value: 'end', delay: 500 });
      act(() => {
        vi.advanceTimersByTime(499);
      });
      expect(result.current).toBe('middle');

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(result.current).toBe('end');
    });
  });

  describe('type preservation', () => {
    it('should preserve string type', () => {
      const { result } = renderHook(() => useDebounce<string>('test', 100));
      expect(typeof result.current).toBe('string');
    });

    it('should preserve number type', () => {
      const { result } = renderHook(() => useDebounce<number>(123, 100));
      expect(typeof result.current).toBe('number');
    });

    it('should preserve boolean type', () => {
      const { result } = renderHook(() => useDebounce<boolean>(true, 100));
      expect(typeof result.current).toBe('boolean');
    });

    it('should preserve array type', () => {
      const { result } = renderHook(() => useDebounce<number[]>([1, 2, 3], 100));
      expect(Array.isArray(result.current)).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('should cleanup timeout on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      const { unmount, rerender } = renderHook(
        ({ value }) => useDebounce(value, 300),
        { initialProps: { value: 'initial' } }
      );

      rerender({ value: 'updated' });
      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });
});
