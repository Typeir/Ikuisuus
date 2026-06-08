/**
 * @fileoverview Tests for useEditableField hook
 * @description Validates the edit/commit/cancel state machine including
 * the cancel-pending ref coordination that prevents blur-after-Escape commits.
 */

import { useEditableField } from '@/modules/encounter-planner/presentation/combatantRow/utils/useEditableField';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

/**
 * Create a mock cancel-pending ref for testing.
 *
 * @returns MutableRefObject<boolean> with current = false
 */
function makeCancelRef(): React.MutableRefObject<boolean> {
  return { current: false };
}

describe('useEditableField', () => {
  it('should start with editing as null', () => {
    const updater = vi.fn();
    const cancelRef = makeCancelRef();
    const { result } = renderHook(() => useEditableField(cancelRef, updater));

    expect(result.current.editing).toBeNull();
  });

  it('should set editing value via setEditing', () => {
    const updater = vi.fn();
    const cancelRef = makeCancelRef();
    const { result } = renderHook(() => useEditableField(cancelRef, updater));

    act(() => {
      result.current.setEditing('42');
    });

    expect(result.current.editing).toBe('42');
  });

  it('should update editing value via onChange', () => {
    const updater = vi.fn();
    const cancelRef = makeCancelRef();
    const { result } = renderHook(() => useEditableField(cancelRef, updater));

    act(() => {
      result.current.setEditing('10');
    });

    act(() => {
      result.current.onChange('15');
    });

    expect(result.current.editing).toBe('15');
  });

  it('should call updater and reset editing on commit', () => {
    const updater = vi.fn();
    const cancelRef = makeCancelRef();
    const { result } = renderHook(() => useEditableField(cancelRef, updater));

    act(() => {
      result.current.setEditing('25');
    });

    act(() => {
      result.current.commit();
    });

    expect(updater).toHaveBeenCalledWith('25');
    expect(result.current.editing).toBeNull();
  });

  it('should not call updater on commit when editing is null', () => {
    const updater = vi.fn();
    const cancelRef = makeCancelRef();
    const { result } = renderHook(() => useEditableField(cancelRef, updater));

    act(() => {
      result.current.commit();
    });

    expect(updater).not.toHaveBeenCalled();
  });

  it('should reset editing and set cancelPendingRef on cancel', () => {
    const updater = vi.fn();
    const cancelRef = makeCancelRef();
    const { result } = renderHook(() => useEditableField(cancelRef, updater));

    act(() => {
      result.current.setEditing('50');
    });

    act(() => {
      result.current.cancel();
    });

    expect(result.current.editing).toBeNull();
    expect(cancelRef.current).toBe(true);
  });

  it('should skip updater on commit after cancel (blur-after-Escape)', () => {
    const updater = vi.fn();
    const cancelRef = makeCancelRef();
    const { result } = renderHook(() => useEditableField(cancelRef, updater));

    act(() => {
      result.current.setEditing('99');
    });

    act(() => {
      result.current.cancel();
    });

    act(() => {
      result.current.commit();
    });

    expect(updater).not.toHaveBeenCalled();
    expect(cancelRef.current).toBe(false);
  });
});
