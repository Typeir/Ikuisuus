/**
 * PreferencesModal Tests
 *
 * @fileoverview Covers the controls writing through the persistent UI port.
 */

import { PreferencesModal } from '@/lib/components/preferences/PreferencesModal';
import { PersistentUiProvider } from '@/lib/context/PersistentUiContext';
import { PERSISTENT_UI_STORAGE_KEY } from '@/lib/types/persistentUiState';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** Renders the modal open, inside the real provider. */
function renderModal() {
  return render(
    <PersistentUiProvider initialExpandedPaths={[]}>
      <PreferencesModal isOpen onClose={vi.fn()} />
    </PersistentUiProvider>,
  );
}

describe('PreferencesModal', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie = `${PERSISTENT_UI_STORAGE_KEY}=; Max-Age=0; Path=/`;
    document.documentElement.removeAttribute('data-constrained-hue');
  });

  it('should render nothing when closed', () => {
    render(
      <PersistentUiProvider initialExpandedPaths={[]}>
        <PreferencesModal isOpen={false} onClose={vi.fn()} />
      </PersistentUiProvider>,
    );

    expect(screen.queryByText('textSize')).toBeNull();
  });

  it('should show the text scale as a percentage of the base size', () => {
    renderModal();

    const field = screen.getByLabelText('textSize') as HTMLInputElement;
    expect(field.value).toBe('100');
  });

  it('should show the shipped measure default', () => {
    renderModal();

    const field = screen.getByLabelText('proseMeasure') as HTMLInputElement;
    expect(field.value).toBe('100');
  });

  it('should stamp constrained hue on the root when the pip is toggled', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('checkbox', { name: 'constrainedHue' }));

    expect(document.documentElement.getAttribute('data-constrained-hue')).toBe(
      'true',
    );
  });

  it('should drive theme through the shared port', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: 'themeToggle' }));

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  /* The modal portals to document.body, so the reveal is not under container. */
  it('should render the scoped reveal layer', () => {
    renderModal();

    expect(
      document.body.querySelector('[data-flashlight="true"]'),
    ).toBeTruthy();
  });
});
