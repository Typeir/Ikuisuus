/**
 * CharacterSheetContext Unit Tests
 *
 * @fileoverview Tests for the character sheet context provider including
 * hydration from storage, persistence on state change, and hook behavior.
 */

import {
    CharacterSheetProvider,
    useCharacterSheetDispatch,
    useCharacterSheetState,
} from '@/lib/context/CharacterSheetContext';
import {
    CHARACTER_SHEET_ACTION_TYPES,
    CHARACTER_SHEET_STORAGE_KEY,
} from '@/lib/types/characterSheet';
import { createEmptyCharacter } from '@/lib/utils/characterStorage';
import { storePersistentDataRef } from '@/lib/utils/storePersistentData';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Test consumer that renders character count and dispatch controls.
 */
function CharacterTestConsumer() {
  const { characters, activeId, isHydrated } = useCharacterSheetState();
  const dispatch = useCharacterSheetDispatch();
  const newChar = createEmptyCharacter();

  return (
    <div>
      <span data-testid='count'>{characters.length}</span>
      <span data-testid='active-id'>{activeId ?? 'none'}</span>
      <span data-testid='hydrated'>{isHydrated ? 'yes' : 'no'}</span>
      <button
        onClick={() =>
          dispatch({
            type: CHARACTER_SHEET_ACTION_TYPES.UPSERT_CHARACTER,
            payload: { character: newChar },
          })
        }>
        Add
      </button>
      <button
        onClick={() =>
          dispatch({
            type: CHARACTER_SHEET_ACTION_TYPES.RESET,
          })
        }>
        Reset
      </button>
    </div>
  );
}

describe('CharacterSheetContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Provider initialization', () => {
    it('should render children', () => {
      render(
        <CharacterSheetProvider>
          <div data-testid='child'>content</div>
        </CharacterSheetProvider>,
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should start with an empty characters list', () => {
      render(
        <CharacterSheetProvider>
          <CharacterTestConsumer />
        </CharacterSheetProvider>,
      );
      expect(screen.getByTestId('count').textContent).toBe('0');
    });

    it('should be hydrated after mount', async () => {
      render(
        <CharacterSheetProvider>
          <CharacterTestConsumer />
        </CharacterSheetProvider>,
      );
      await waitFor(() =>
        expect(screen.getByTestId('hydrated').textContent).toBe('yes'),
      );
    });
  });

  describe('UPSERT_CHARACTER dispatch', () => {
    it('should add a character and increase count', async () => {
      const user = userEvent.setup();
      render(
        <CharacterSheetProvider>
          <CharacterTestConsumer />
        </CharacterSheetProvider>,
      );
      await user.click(screen.getByText('Add'));
      expect(screen.getByTestId('count').textContent).toBe('1');
    });

    it('should persist characters to storage', async () => {
      const user = userEvent.setup();
      render(
        <CharacterSheetProvider>
          <CharacterTestConsumer />
        </CharacterSheetProvider>,
      );
      await user.click(screen.getByText('Add'));
      await waitFor(() => {
        const stored = localStorage.getItem(CHARACTER_SHEET_STORAGE_KEY);
        expect(stored).not.toBeNull();
        const parsed = JSON.parse(stored!);
        expect(parsed.characters).toHaveLength(1);
      });
    });
  });

  describe('RESET dispatch', () => {
    it('should clear all characters', async () => {
      const user = userEvent.setup();
      render(
        <CharacterSheetProvider>
          <CharacterTestConsumer />
        </CharacterSheetProvider>,
      );
      await user.click(screen.getByText('Add'));
      await user.click(screen.getByText('Reset'));
      expect(screen.getByTestId('count').textContent).toBe('0');
    });
  });

  describe('Hydration from storage', () => {
    it('should rehydrate characters from localStorage on mount', async () => {
      const character = createEmptyCharacter();
      storePersistentDataRef(
        CHARACTER_SHEET_STORAGE_KEY,
        JSON.stringify({ characters: [character], activeId: null }),
      );
      render(
        <CharacterSheetProvider>
          <CharacterTestConsumer />
        </CharacterSheetProvider>,
      );
      await waitFor(() =>
        expect(screen.getByTestId('count').textContent).toBe('1'),
      );
    });
  });

  describe('Hook guards', () => {
    it('useCharacterSheetState should throw outside provider', () => {
      const Unguarded = () => {
        useCharacterSheetState();
        return null;
      };
      expect(() => render(<Unguarded />)).toThrow(
        'useCharacterSheetState must be used within a CharacterSheetProvider',
      );
    });

    it('useCharacterSheetDispatch should throw outside provider', () => {
      const Unguarded = () => {
        useCharacterSheetDispatch();
        return null;
      };
      expect(() => render(<Unguarded />)).toThrow(
        'useCharacterSheetDispatch must be used within a CharacterSheetProvider',
      );
    });
  });
});
