/**
 * PreferencesModal Tests
 *
 * @fileoverview Covers the controls writing through the persistent UI port.
 */

import { PreferencesModal } from '@/lib/components/preferences/PreferencesModal';
import { PersistentUiProvider } from '@/lib/context/PersistentUiContext';
import { PERSISTENT_UI_STORAGE_KEY } from '@/lib/types/persistentUiState';
import { render, screen, within } from '@testing-library/react';
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
    document.documentElement.removeAttribute('data-stream-text');
    document.documentElement.removeAttribute('data-section-decor');
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

  it('should stamp the stream decorator on the root when the pip is toggled', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('checkbox', { name: 'streamText' }));

    expect(document.documentElement.getAttribute('data-stream-text')).toBe(
      'false',
    );
  });

  it('should stamp the section decorator on the root when the pip is toggled', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('checkbox', { name: 'sectionDecor' }));

    expect(document.documentElement.getAttribute('data-section-decor')).toBe(
      'false',
    );
  });

  it('should render both decorators drawn by default', () => {
    renderModal();

    expect(
      screen.getByRole('checkbox', { name: 'streamText' }),
    ).toHaveAttribute('aria-checked', 'true');
    expect(
      screen.getByRole('checkbox', { name: 'sectionDecor' }),
    ).toHaveAttribute('aria-checked', 'true');
  });

  it('should carry the unit switcher, headed by the panel itself', () => {
    renderModal();

    expect(
      screen.getByRole('radiogroup', { name: 'dimensionDistance' }),
    ).toBeTruthy();
    expect(screen.queryByText('switcherLabel')).toBeNull();
  });

  it('should write a unit choice through the shared port', async () => {
    const user = userEvent.setup();
    renderModal();

    const group = screen.getByRole('radiogroup', { name: 'dimensionWeight' });
    await user.click(
      within(group).getByRole('radio', { name: 'switcherMetric' }),
    );

    const stored = JSON.parse(
      localStorage.getItem(PERSISTENT_UI_STORAGE_KEY) as string,
    );
    expect(stored.unitSystem.weight).toBe('metric');
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
