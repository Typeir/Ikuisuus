/**
 * @fileoverview Unit tests for useThemeChangedEvent
 * @module tests/unit/src/app/[locale]/utils/useThemeChangedEvent.test
 * @description The hook dispatches `ik:theme-changed` after mount and on every theme change.
 *
 * @version 1.0.0
 * @author Typeir
 */

import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useThemeChangedEvent } from '@/app/[locale]/utils/useThemeChangedEvent';

const themeState = { theme: 'dark' };

vi.mock('@/lib/context/PersistentUiContext', () => ({
  useThemeState: () => themeState,
}));

describe('useThemeChangedEvent', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    themeState.theme = 'dark';
  });

  it('dispatches the current theme once mounted', () => {
    const dispatch = vi.spyOn(window, 'dispatchEvent');
    renderHook(() => useThemeChangedEvent());

    const events = dispatch.mock.calls
      .map(([event]) => event)
      .filter((event): event is CustomEvent => event.type === 'ik:theme-changed');
    expect(events).toHaveLength(1);
    expect(events[0].detail).toEqual({ theme: 'dark' });
  });

  it('dispatches again when the theme changes', () => {
    const dispatch = vi.spyOn(window, 'dispatchEvent');
    const { rerender } = renderHook(() => useThemeChangedEvent());

    themeState.theme = 'light';
    rerender();

    const themes = dispatch.mock.calls
      .map(([event]) => event)
      .filter((event): event is CustomEvent => event.type === 'ik:theme-changed')
      .map((event) => event.detail.theme);
    expect(themes).toEqual(['dark', 'light']);
  });
});
