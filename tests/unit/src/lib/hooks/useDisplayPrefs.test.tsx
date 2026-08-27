/**
 * useDisplayPrefs Hook Tests
 *
 * @fileoverview Covers reads through the persistent UI port and the round trip
 * from action to root-level custom property.
 */

import { PersistentUiProvider } from '@/lib/context/PersistentUiContext';
import {
  useDisplayPrefsActions,
  useDisplayPrefsState,
} from '@/lib/hooks/useDisplayPrefs';
import { PERSISTENT_UI_STORAGE_KEY } from '@/lib/types/persistentUiState';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

const wrapper = ({ children }: { children: ReactNode }) => (
  <PersistentUiProvider initialExpandedPaths={[]}>
    {children}
  </PersistentUiProvider>
);

/** Renders both hooks against one provider so actions and reads share state. */
function renderPrefs() {
  return renderHook(
    () => ({
      state: useDisplayPrefsState(),
      actions: useDisplayPrefsActions(),
    }),
    { wrapper },
  );
}

describe('useDisplayPrefs', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = `${PERSISTENT_UI_STORAGE_KEY}=; Max-Age=0; Path=/`;
    document.documentElement.removeAttribute('data-constrained-hue');
    document.documentElement.removeAttribute('data-stream-text');
    document.documentElement.removeAttribute('data-section-decor');
    document.documentElement.style.removeProperty('--text-scale-user');
    document.documentElement.style.removeProperty('--prose-measure');
  });

  it('should expose the shipped defaults before anything is stored', () => {
    const { result } = renderPrefs();

    expect(result.current.state.textScale).toBe(1);
    expect(result.current.state.proseMeasure).toBe(100);
    expect(result.current.state.constrainedHue).toBe(false);
    expect(result.current.state.streamText).toBe(true);
    expect(result.current.state.sectionDecor).toBe(true);
  });

  it('should apply the text scale as a root custom property', () => {
    const { result } = renderPrefs();

    act(() => result.current.actions.setTextScale(1.25));

    expect(result.current.state.textScale).toBe(1.25);
    expect(
      document.documentElement.style.getPropertyValue('--text-scale-user'),
    ).toBe('1.25');
  });

  it('should write the measure with a ch unit so it tracks the font size', () => {
    const { result } = renderPrefs();

    act(() => result.current.actions.setProseMeasure(111));

    expect(
      document.documentElement.style.getPropertyValue('--prose-measure'),
    ).toBe('111ch');
  });

  it('should stamp constrained hue on the root element', () => {
    const { result } = renderPrefs();

    act(() => result.current.actions.setConstrainedHue(true));

    expect(
      document.documentElement.getAttribute('data-constrained-hue'),
    ).toBe('true');
  });

  it('should persist preferences through the storage port', () => {
    const { result } = renderPrefs();

    act(() => result.current.actions.setProseMeasure(111));

    const stored = localStorage.getItem(PERSISTENT_UI_STORAGE_KEY);
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored as string).proseMeasure).toBe(111);
  });

  it('should fall back to defaults when the stored value is unusable', () => {
    localStorage.setItem(
      PERSISTENT_UI_STORAGE_KEY,
      JSON.stringify({ textScale: 0, proseMeasure: 'wide' }),
    );

    const { result } = renderPrefs();

    expect(result.current.state.textScale).toBe(1);
    expect(result.current.state.proseMeasure).toBe(100);
  });
});
