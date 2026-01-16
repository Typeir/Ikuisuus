/**
 * @fileoverview useDebouncedValueWithRaceControl Hook Unit Tests
 * @description Tests for the useDebouncedValueWithRaceControl hook that debounces
 * values and ensures only the most recent async response is accepted.
 *
 * @module tests/unit/lib/hooks/useDebouncedValueWithRaceControl
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react React Testing Library
 * @requires @/lib/hooks/useDebouncedValueWithRaceControl Hook under test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDebouncedValueWithRaceControl } from '@/lib/hooks/useDebouncedValueWithRaceControl';
import { logger } from '@/lib/logging/logger';

describe('useDebouncedValueWithRaceControl', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should return undefined result initially', () => {
      const mockCallback = vi.fn().mockResolvedValue('result');
      const { result } = renderHook(() =>
        useDebouncedValueWithRaceControl('test', mockCallback, 400)
      );

      expect(result.current.result).toBeUndefined();
    });

    it('should start with loading false', () => {
      const mockCallback = vi.fn().mockResolvedValue('result');
      const { result } = renderHook(() =>
        useDebouncedValueWithRaceControl('test', mockCallback, 400)
      );

      expect(result.current.loading).toBe(false);
    });
  });

  describe('debounce behavior', () => {
    it('should not call callback before delay expires', async () => {
      const mockCallback = vi.fn().mockResolvedValue('result');
      renderHook(() =>
        useDebouncedValueWithRaceControl('test', mockCallback, 400)
      );

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should call callback after delay expires', async () => {
      const mockCallback = vi.fn().mockResolvedValue('result');
      renderHook(() =>
        useDebouncedValueWithRaceControl('test', mockCallback, 400)
      );

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(mockCallback).toHaveBeenCalledWith('test');
    });

    it('should reset timer on value changes', async () => {
      const mockCallback = vi.fn().mockResolvedValue('result');
      const { rerender } = renderHook(
        ({ value }) => useDebouncedValueWithRaceControl(value, mockCallback, 400),
        { initialProps: { value: 'first' } }
      );

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      rerender({ value: 'second' });

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(mockCallback).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(mockCallback).toHaveBeenCalledWith('second');
    });
  });

  describe('loading state', () => {
    it('should set loading true when async call starts', async () => {
      let resolvePromise: (value: string) => void;
      const mockCallback = vi.fn().mockImplementation(
        () => new Promise<string>((resolve) => { resolvePromise = resolve; })
      );

      const { result } = renderHook(() =>
        useDebouncedValueWithRaceControl('test', mockCallback, 400)
      );

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise!('done');
      });
    });

    it('should set loading false when async call completes', async () => {
      const mockCallback = vi.fn().mockResolvedValue('result');
      const { result } = renderHook(() =>
        useDebouncedValueWithRaceControl('test', mockCallback, 400)
      );

      await act(async () => {
        vi.advanceTimersByTime(400);
        await Promise.resolve();
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('race condition handling', () => {
    it('should only accept result from most recent request', async () => {
      let resolvers: Array<(value: string) => void> = [];
      const mockCallback = vi.fn().mockImplementation((value: string) =>
        new Promise<string>((resolve) => {
          resolvers.push(() => resolve(value + '-result'));
        })
      );

      const { result, rerender } = renderHook(
        ({ value }) => useDebouncedValueWithRaceControl(value, mockCallback, 100),
        { initialProps: { value: 'first' } }
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      rerender({ value: 'second' });

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(mockCallback).toHaveBeenCalledTimes(2);

      await act(async () => {
        resolvers[0]();
        await Promise.resolve();
      });

      expect(result.current.result).toBeUndefined();

      await act(async () => {
        resolvers[1]();
        await Promise.resolve();
      });

      expect(result.current.result).toBe('second-result');
    });

    it('should ignore stale requests', async () => {
      const responses: string[] = [];
      const mockCallback = vi.fn().mockImplementation(async (value: string) => {
        const delay = value === 'slow' ? 500 : 100;
        await new Promise(resolve => setTimeout(resolve, delay));
        return `${value}-response`;
      });

      const { result, rerender } = renderHook(
        ({ value }) => useDebouncedValueWithRaceControl(value, mockCallback, 50),
        { initialProps: { value: 'slow' } }
      );

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      rerender({ value: 'fast' });

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      await act(async () => {
        vi.advanceTimersByTime(100);
        await Promise.resolve();
      });

      expect(result.current.result).toBe('fast-response');
    });
  });

  describe('null/undefined handling', () => {
    it('should not call callback for null values', async () => {
      const mockCallback = vi.fn().mockResolvedValue('result');
      renderHook(() =>
        useDebouncedValueWithRaceControl(null, mockCallback, 400)
      );

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should not call callback for undefined values', async () => {
      const mockCallback = vi.fn().mockResolvedValue('result');
      renderHook(() =>
        useDebouncedValueWithRaceControl(undefined, mockCallback, 400)
      );

      await act(async () => {
        vi.advanceTimersByTime(400);
      });

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should set result to undefined on error', async () => {
      const mockCallback = vi.fn().mockRejectedValue(new Error('test error'));

      const { result } = renderHook(() =>
        useDebouncedValueWithRaceControl('test', mockCallback, 100)
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
        await Promise.resolve();
      });

      expect(result.current.result).toBeUndefined();
    });

    it('should set loading false on error', async () => {
      const mockCallback = vi.fn().mockRejectedValue(new Error('test error'));

      const { result } = renderHook(() =>
        useDebouncedValueWithRaceControl('test', mockCallback, 100)
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
        await Promise.resolve();
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('custom delay', () => {
    it('should use default 400ms delay when not specified', async () => {
      const mockCallback = vi.fn().mockResolvedValue('result');
      renderHook(() =>
        useDebouncedValueWithRaceControl('test', mockCallback)
      );

      await act(async () => {
        vi.advanceTimersByTime(399);
      });
      expect(mockCallback).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(1);
      });
      expect(mockCallback).toHaveBeenCalled();
    });

    it('should respect custom delay', async () => {
      const mockCallback = vi.fn().mockResolvedValue('result');
      renderHook(() =>
        useDebouncedValueWithRaceControl('test', mockCallback, 1000)
      );

      await act(async () => {
        vi.advanceTimersByTime(999);
      });
      expect(mockCallback).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(1);
      });
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should cleanup timeout on unmount', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const mockCallback = vi.fn().mockResolvedValue('result');

      const { unmount } = renderHook(() =>
        useDebouncedValueWithRaceControl('test', mockCallback, 400)
      );

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });
});
