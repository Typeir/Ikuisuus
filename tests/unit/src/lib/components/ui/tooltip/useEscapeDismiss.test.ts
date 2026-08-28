/**
 * @fileoverview useEscapeDismiss Tests
 * @description Covers last-in-first-out dismissal, the single shared listener,
 * and that one key press closes exactly one surface.
 *
 * @module tests/unit/src/lib/components/ui/tooltip/useEscapeDismiss
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @requires vitest Testing framework
 * @requires @testing-library/react renderHook
 * @requires @/lib/components/ui/tooltip/useEscapeDismiss Module under test
 */

import { useEscapeDismiss } from '@/lib/components/ui/tooltip/useEscapeDismiss';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

/**
 * Dispatches a key press on the document.
 *
 * @param {string} key - Key value to dispatch
 * @returns {boolean} Whether the event went un-cancelled
 */
function press(key: string): boolean {
  const event = new KeyboardEvent('keydown', { key, cancelable: true });
  act(() => {
    document.dispatchEvent(event);
  });
  return !event.defaultPrevented;
}

describe('useEscapeDismiss', () => {
  it('dismisses an active surface on Escape', () => {
    const dismiss = vi.fn();
    renderHook(() => useEscapeDismiss(true, dismiss));

    press('Escape');

    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('ignores keys other than Escape', () => {
    const dismiss = vi.fn();
    renderHook(() => useEscapeDismiss(true, dismiss));

    press('Enter');

    expect(dismiss).not.toHaveBeenCalled();
  });

  it('does nothing while inactive', () => {
    const dismiss = vi.fn();
    renderHook(() => useEscapeDismiss(false, dismiss));

    press('Escape');

    expect(dismiss).not.toHaveBeenCalled();
  });

  it('dismisses the most recent surface only', () => {
    const first = vi.fn();
    const second = vi.fn();
    const older = renderHook(() => useEscapeDismiss(true, first));
    const newer = renderHook(() => useEscapeDismiss(true, second));

    press('Escape');

    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();

    newer.unmount();
    press('Escape');

    expect(first).toHaveBeenCalledTimes(1);
    older.unmount();
  });

  it('marks the event handled so nothing else acts on it', () => {
    const dismiss = vi.fn();
    const { unmount } = renderHook(() => useEscapeDismiss(true, dismiss));

    expect(press('Escape')).toBe(false);
    unmount();
  });

  it('stops listening once every surface has unregistered', () => {
    const dismiss = vi.fn();
    const { unmount } = renderHook(() => useEscapeDismiss(true, dismiss));

    unmount();

    expect(press('Escape')).toBe(true);
    expect(dismiss).not.toHaveBeenCalled();
  });
});
