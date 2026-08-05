/**
 * @fileoverview Selected Character Badge Tests
 * @description Unit tests for the sidebar-footer character badge: avatar
 * rendering, picker dropdown, selection dispatch, and manage navigation.
 *
 * @module tests/unit/src/modules/character-builder/presentation/SelectedCharacter/selectedCharacterBadge
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import type { CharacterSheet } from '@/lib/types/character';
import { CHARACTER_SHEET_ACTION_TYPES } from '@/lib/types/characterSheet';
import { createEmptyCharacter } from '@/modules/character-builder/lib/utils/characterStorage';
import { SelectedCharacterBadge } from '@/modules/character-builder/presentation/SelectedCharacter/selectedCharacterBadge';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ locale: 'en' }),
}));

const mockDispatch = vi.fn();
const state: {
  characters: CharacterSheet[];
  activeId: string | null;
  isHydrated: boolean;
} = { characters: [], activeId: null, isHydrated: true };

vi.mock('@/lib/context/CharacterSheetContext', () => ({
  useCharacters: () => state.characters,
  useCharacterSheetState: () => state,
  useCharacterSheetDispatch: () => mockDispatch,
  useActiveCharacter: () =>
    state.characters.find((c) => c.id === state.activeId) ?? null,
}));

/**
 * Build a named test character.
 *
 * @function makeCharacter
 * @param {string} id - Character id
 * @param {string} name - Character name
 * @returns {CharacterSheet} Complete character
 */
const makeCharacter = (id: string, name: string): CharacterSheet => ({
  ...createEmptyCharacter(),
  id,
  name,
});

describe('SelectedCharacterBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.characters = [];
    state.activeId = null;
    state.isHydrated = true;
  });

  it('renders nothing before hydration', () => {
    state.isHydrated = false;
    const { container } = render(<SelectedCharacterBadge />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the active character initial in a round avatar', () => {
    state.characters = [makeCharacter('a', 'Aila')];
    state.activeId = 'a';
    render(<SelectedCharacterBadge />);
    const trigger = screen.getByRole('button', {
      name: 'characterBadge.ariaToggle',
    });
    expect(trigger).toHaveAttribute('title', 'Aila');
    expect(trigger.textContent).toBe('A');
  });

  it('opens the picker and lists characters', async () => {
    const user = userEvent.setup();
    state.characters = [makeCharacter('a', 'Aila'), makeCharacter('b', 'Bo')];
    state.activeId = 'a';
    render(<SelectedCharacterBadge />);
    await user.click(
      screen.getByRole('button', { name: 'characterBadge.ariaToggle' }),
    );
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Aila')).toBeInTheDocument();
    expect(screen.getByText('Bo')).toBeInTheDocument();
  });

  it('dispatches SET_ACTIVE_ID when a character is picked', async () => {
    const user = userEvent.setup();
    state.characters = [makeCharacter('a', 'Aila'), makeCharacter('b', 'Bo')];
    state.activeId = 'a';
    render(<SelectedCharacterBadge />);
    await user.click(
      screen.getByRole('button', { name: 'characterBadge.ariaToggle' }),
    );
    await user.click(screen.getByText('Bo'));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: CHARACTER_SHEET_ACTION_TYPES.SET_ACTIVE_ID,
      payload: { id: 'b' },
    });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('shows empty state and navigates to the manager page', async () => {
    const user = userEvent.setup();
    render(<SelectedCharacterBadge />);
    await user.click(
      screen.getByRole('button', { name: 'characterBadge.ariaToggle' }),
    );
    expect(screen.getByText('characterBadge.empty')).toBeInTheDocument();
    const manage = screen.getByText('characterBadge.manage');
    expect(manage.tagName).toBe('A');
    expect(manage).toHaveAttribute('href', '/en/utils/characters');
    await user.click(manage);
    expect(mockPush).toHaveBeenCalledWith('/en/utils/characters');
  });
});
