/**
 * ThemeColorSync Tests
 *
 * @fileoverview Covers the theme-color meta tag tracking the palette token.
 */

import { ThemeColorSync } from '@/lib/components/viewport/ThemeColorSync';
import { PersistentUiProvider } from '@/lib/context/PersistentUiContext';
import { PERSISTENT_UI_STORAGE_KEY } from '@/lib/types/persistentUiState';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/** Reads the meta tag the component owns. */
const readMeta = (): HTMLMetaElement | null =>
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

/** Renders the sync component inside the real persistent UI provider. */
function renderSync() {
  return render(
    <PersistentUiProvider initialExpandedPaths={[]}>
      <ThemeColorSync />
    </PersistentUiProvider>,
  );
}

describe('ThemeColorSync', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = `${PERSISTENT_UI_STORAGE_KEY}=; Max-Age=0; Path=/`;
    readMeta()?.remove();
  });

  afterEach(() => {
    document.documentElement.style.removeProperty('--color-bg');
  });

  it('should create the meta tag from the background token', () => {
    document.documentElement.style.setProperty('--color-bg', 'rgb(1, 2, 3)');

    renderSync();

    expect(readMeta()?.content).toBe('rgb(1, 2, 3)');
  });

  it('should reuse an existing meta tag rather than appending a second one', () => {
    document.documentElement.style.setProperty('--color-bg', 'rgb(4, 5, 6)');
    const existing = document.createElement('meta');
    existing.name = 'theme-color';
    document.head.appendChild(existing);

    renderSync();

    expect(document.querySelectorAll('meta[name="theme-color"]')).toHaveLength(
      1,
    );
    expect(existing.content).toBe('rgb(4, 5, 6)');
  });

  it('should leave the head untouched when the token is unset', () => {
    renderSync();

    expect(readMeta()).toBeNull();
  });

  it('should render no DOM of its own', () => {
    document.documentElement.style.setProperty('--color-bg', 'rgb(7, 8, 9)');

    const { container } = renderSync();

    expect(container.innerHTML).toBe('');
  });
});
