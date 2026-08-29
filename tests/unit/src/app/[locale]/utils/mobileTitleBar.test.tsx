/**
 * @fileoverview Unit tests for MobileTitleBar
 * @module tests/unit/src/app/[locale]/utils/mobileTitleBar.test
 * @description Renders the slots, forwards the hamburger toggle and search navigation.
 *
 * @version 1.0.0
 * @author Typeir
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MobileTitleBar } from '@/app/[locale]/utils/mobileTitleBar';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/modules/search/presentation/SearchBar/SearchBar', () => ({
  SearchBar: ({ onNavigate }: { onNavigate: () => void }) => (
    <button type='button' onClick={onNavigate}>
      search
    </button>
  ),
}));

vi.mock('@/modules/character-builder', () => ({
  SelectedCharacterBadge: () => <span>badge</span>,
}));

describe('MobileTitleBar', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders logo, controls, search and character slots', () => {
    render(
      <MobileTitleBar
        open={false}
        onToggle={vi.fn()}
        onNavigate={vi.fn()}
        controls={<span>controls</span>}
      />,
    );

    expect(screen.getByRole('link', { name: 'libraryTitle' })).toBeInTheDocument();
    expect(screen.getByText('controls')).toBeInTheDocument();
    expect(screen.getByText('search')).toBeInTheDocument();
    expect(screen.getByText('badge')).toBeInTheDocument();
  });

  it('toggles the sidebar from the hamburger', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <MobileTitleBar
        open={false}
        onToggle={onToggle}
        onNavigate={vi.fn()}
        controls={null}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'toggleSidebar' }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('closes the menu when the search bar navigates', async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <MobileTitleBar
        open={true}
        onToggle={vi.fn()}
        onNavigate={onNavigate}
        controls={null}
      />,
    );

    await user.click(screen.getByText('search'));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
