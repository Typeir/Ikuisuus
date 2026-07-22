/**
 * @fileoverview CharacterRoster Unit Tests
 * @description Tests for the CharacterRoster component.
 *
 * @module tests/unit/lib/components/characterSheet/characterRoster
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { CharacterRoster } from '@/modules/character-builder/presentation/Roster/characterRoster';
import { createEmptyCharacter } from '@/modules/character-builder/lib/utils/characterStorage';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const mockDispatch = vi.fn();
const mockCharacters = vi.fn(() => []);
const mockState = vi.fn(() => ({
  activeId: null,
  characters: [],
  isHydrated: true,
}));

vi.mock('@/lib/context/CharacterSheetContext', () => ({
  useCharacterSheetDispatch: () => mockDispatch,
  useCharacters: () => mockCharacters(),
  useCharacterSheetState: () => mockState(),
  useActiveCharacter: vi.fn(() => null),
}));

vi.stubGlobal('fetch', vi.fn());

describe('CharacterRoster', () => {
  it('shows empty state when no characters exist', () => {
    mockCharacters.mockReturnValue([]);
    mockState.mockReturnValue({
      activeId: null,
      characters: [],
      isHydrated: true,
    });
    render(<CharacterRoster />);
    expect(screen.getByText('noCharactersYet')).toBeTruthy();
  });

  it('renders character names in the sidebar', () => {
    const char = { ...createEmptyCharacter(), name: 'Theron Ash' };
    mockCharacters.mockReturnValue([char]);
    mockState.mockReturnValue({
      activeId: char.id,
      characters: [char],
      isHydrated: true,
    });
    render(<CharacterRoster />);
    expect(screen.getAllByText('Theron Ash')[0]).toBeTruthy();
  });

  it('dispatches UPSERT + SET_ACTIVE_ID when New is clicked', async () => {
    mockCharacters.mockReturnValue([]);
    mockState.mockReturnValue({
      activeId: null,
      characters: [],
      isHydrated: true,
    });
    render(<CharacterRoster />);
    await userEvent.click(
      screen.getByRole('button', { name: 'ariaCreateCharacter' }),
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'CHARACTER_SHEET/UPSERT_CHARACTER' }),
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'CHARACTER_SHEET/SET_ACTIVE_ID' }),
    );
  });

  it('dispatches SET_ACTIVE_ID when a roster item is clicked', async () => {
    const char = { ...createEmptyCharacter(), name: 'Aria' };
    mockCharacters.mockReturnValue([char]);
    mockState.mockReturnValue({
      activeId: null,
      characters: [char],
      isHydrated: true,
    });
    render(<CharacterRoster />);
    const list = screen.getByRole('list');
    await userEvent.click(within(list).getByText('Aria'));
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'CHARACTER_SHEET/SET_ACTIVE_ID',
        payload: { id: char.id },
      }),
    );
  });

  it('dispatches DELETE_CHARACTER when trash is clicked', async () => {
    const char = { ...createEmptyCharacter(), name: 'Doomed' };
    mockCharacters.mockReturnValue([char]);
    mockState.mockReturnValue({
      activeId: char.id,
      characters: [char],
      isHydrated: true,
    });
    render(<CharacterRoster />);
    await userEvent.click(
      screen.getByRole('button', { name: 'ariaDeleteCharacter' }),
    );
    await screen.findByRole('dialog', { name: 'deleteConfirmTitle' });
    await userEvent.click(
      screen.getByRole('button', { name: 'delete' }),
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'CHARACTER_SHEET/DELETE_CHARACTER',
        payload: { id: char.id },
      }),
    );
  });
});
