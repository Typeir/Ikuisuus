/**
 * @fileoverview Tests for CharactersPage
 * @description Unit tests for the /[locale]/utils/characters page component.
 *
 * @module tests/unit/src/app/[locale]/utils/characters/page.test
 */

import CharactersPage from '@/app/[locale]/utils/characters/page';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/context/CharacterSheetContext', () => ({
  CharacterSheetProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid='character-provider'>{children}</div>
  ),
  useCharacters: () => [],
  useCharacterSheetState: () => ({ activeId: '1', isHydrated: true }),
  useCharacterSheetDispatch: () => vi.fn(),
}));

vi.mock(
  '@/modules/character-builder/presentation/Roster/characterRoster',
  () => ({
    CharacterRoster: () => <div data-testid='character-roster' />,
  }),
);

describe('CharactersPage', () => {
  const renderPage = async (locale = 'en') => {
    const jsx = await CharactersPage({ params: Promise.resolve({ locale }) });
    render(jsx as React.ReactElement);
  };

  it('does not mount a page-local provider (roster context is global)', async () => {
    await renderPage();
    expect(screen.queryByTestId('character-provider')).not.toBeInTheDocument();
  });

  it('renders the character roster', async () => {
    await renderPage();
    expect(screen.getByTestId('character-roster')).toBeInTheDocument();
  });
});
