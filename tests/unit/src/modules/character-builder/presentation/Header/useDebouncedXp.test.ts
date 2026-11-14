/**
 * @fileoverview useDebouncedXp tests.
 *
 * @module tests/unit/src/modules/character-builder/presentation/Header/useDebouncedXp.test
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import { pendingBuilderTasks } from '@/modules/character-builder/application/builderCore/builderActivity';
import {
  XP_DEBOUNCE_MS,
  useDebouncedXp,
} from '@/modules/character-builder/presentation/Header/useDebouncedXp';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useDebouncedXp', () => {
  it('writes after the debounce and holds a builder task until then', async () => {
    const patch = vi.fn();
    const { result } = renderHook(() => useDebouncedXp(0, patch));
    act(() => result.current.onXpInput(900));
    expect(result.current.xpInput).toBe(900);
    expect(pendingBuilderTasks()).toBe(1);
    await act(async () => {
      vi.advanceTimersByTime(XP_DEBOUNCE_MS);
    });
    expect(patch).toHaveBeenCalledWith(900);
    expect(pendingBuilderTasks()).toBe(0);
  });

  it('releases the task when the input returns to the debounced value', async () => {
    const patch = vi.fn();
    const { result } = renderHook(() => useDebouncedXp(0, patch));
    act(() => result.current.onXpInput(50));
    act(() => result.current.onXpInput(0));
    expect(pendingBuilderTasks()).toBe(0);
    await act(async () => {
      vi.advanceTimersByTime(XP_DEBOUNCE_MS);
    });
  });

  it('mirrors stored XP', () => {
    const { result, rerender } = renderHook(({ xp }) => useDebouncedXp(xp, vi.fn()), {
      initialProps: { xp: 10 },
    });
    rerender({ xp: 20 });
    expect(result.current.xpInput).toBe(20);
  });
});
