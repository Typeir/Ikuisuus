/**
 * ThemeToggleButton Tests
 *
 * @fileoverview Covers the toggle driving theme through the persistent UI port.
 */

import { ThemeToggleButton } from '@/lib/components/themeToggle/ThemeToggleButton';
import { PersistentUiProvider } from '@/lib/context/PersistentUiContext';
import { PERSISTENT_UI_STORAGE_KEY } from '@/lib/types/persistentUiState';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

function renderToggle() {
  return render(
    <PersistentUiProvider initialExpandedPaths={[]}>
      <ThemeToggleButton />
    </PersistentUiProvider>,
  );
}

describe('ThemeToggleButton', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = `${PERSISTENT_UI_STORAGE_KEY}=; Max-Age=0; Path=/`;
    document.documentElement.setAttribute('data-theme', 'dark');
  });

  it('should expose an accessible label', () => {
    renderToggle();

    expect(screen.getByRole('button', { name: 'Toggle theme' })).toBeTruthy();
  });

  /* Asserted as a flip rather than an absolute value: the cookie layer is the
     source of truth and outlives a localStorage clear, so the theme a test
     starts from depends on what ran before it. */
  it('should flip the theme on the root element', async () => {
    const user = userEvent.setup();
    renderToggle();
    const before = document.documentElement.getAttribute('data-theme');

    await user.click(screen.getByRole('button', { name: 'Toggle theme' }));

    expect(document.documentElement.getAttribute('data-theme')).not.toBe(
      before,
    );
  });

  it('should persist the theme through the storage port', async () => {
    const user = userEvent.setup();
    renderToggle();

    await user.click(screen.getByRole('button', { name: 'Toggle theme' }));

    const stored = localStorage.getItem(PERSISTENT_UI_STORAGE_KEY);
    expect(JSON.parse(stored as string).theme).toBe(
      document.documentElement.getAttribute('data-theme'),
    );
  });

  it('should accept an overriding label', () => {
    render(
      <PersistentUiProvider initialExpandedPaths={[]}>
        <ThemeToggleButton ariaLabel='themeToggle' />
      </PersistentUiProvider>,
    );

    expect(screen.getByRole('button', { name: 'themeToggle' })).toBeTruthy();
  });
});
