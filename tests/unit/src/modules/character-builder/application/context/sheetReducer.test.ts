/**
 * CharacterSheetReducer Unit Tests
 *
 * @fileoverview Tests for all character sheet state transitions.
 */

import { characterSheetReducer } from '@/lib/reducers/characterSheetReducer';
import {
    CHARACTER_SHEET_ACTION_TYPES,
    DEFAULT_CHARACTER_SHEET_STATE,
    type CharacterSheetState,
} from '@/lib/types/characterSheet';
import {
    getCharacterTierBonus,
    getTotalCharacterLevel,
} from '@/modules/character-builder/lib/utils/characterDerivation';
import { createEmptyCharacter } from '@/modules/character-builder/lib/utils/characterStorage';
import { sheetReducer } from '@/modules/character-builder/application/context/sheetReducer';
import type { VocationEntry } from '@/lib/types/character';
import { describe, expect, it } from 'vitest';

describe('level and tierBonus have a single authority', () => {
  const wizard = (level: number): VocationEntry => ({
    slug: 'wizard',
    title: 'Wizard',
    level,
    specializationSlug: null,
    specializationTitle: '',
    vocationFeatures: [],
    specializationFeatures: [],
  });

  it('the sheet reducer writes exactly what the derivation defines', () => {
    const seed = createEmptyCharacter();
    const next = sheetReducer(
      { character: seed, draft: seed, editing: true, activeTab: 'overview' },
      { type: 'PATCH_VOCATIONS', payload: { vocations: [wizard(7)] } },
    ).draft;

    expect(next.level).toBe(getTotalCharacterLevel(next));
    expect(next.tierBonus).toBe(getCharacterTierBonus(next));
  });

  it('the roster reducer agrees with the sheet reducer for the same character', () => {
    const seed = createEmptyCharacter();
    const edited = sheetReducer(
      { character: seed, draft: seed, editing: true, activeTab: 'overview' },
      { type: 'PATCH_VOCATIONS', payload: { vocations: [wizard(7)] } },
    ).draft;

    const persisted = characterSheetReducer(DEFAULT_CHARACTER_SHEET_STATE, {
      type: CHARACTER_SHEET_ACTION_TYPES.UPSERT_CHARACTER,
      payload: { character: edited },
    }).characters[0];

    expect(persisted.level).toBe(edited.level);
    expect(persisted.tierBonus).toBe(edited.tierBonus);
  });

  it('round-tripping a persisted character through either writer is a no-op', () => {
    const seed = { ...createEmptyCharacter(), vocations: [wizard(11)] };
    const persisted = characterSheetReducer(DEFAULT_CHARACTER_SHEET_STATE, {
      type: CHARACTER_SHEET_ACTION_TYPES.UPSERT_CHARACTER,
      payload: { character: seed },
    }).characters[0];

    const resynced = characterSheetReducer(DEFAULT_CHARACTER_SHEET_STATE, {
      type: CHARACTER_SHEET_ACTION_TYPES.UPSERT_CHARACTER,
      payload: { character: persisted },
    }).characters[0];

    expect(resynced.level).toBe(persisted.level);
    expect(resynced.tierBonus).toBe(persisted.tierBonus);
    expect(persisted.level).toBe(getTotalCharacterLevel(persisted));
    expect(persisted.tierBonus).toBe(getCharacterTierBonus(persisted));
  });
});

describe('characterSheetReducer', () => {
  describe('UPSERT_CHARACTER', () => {
    it('should append a new character when ID is not present', () => {
      const character = createEmptyCharacter();
      const state = characterSheetReducer(DEFAULT_CHARACTER_SHEET_STATE, {
        type: CHARACTER_SHEET_ACTION_TYPES.UPSERT_CHARACTER,
        payload: { character },
      });
      expect(state.characters).toHaveLength(1);
      expect(state.characters[0].id).toBe(character.id);
    });

    it('should replace an existing character when ID matches', () => {
      const character = { ...createEmptyCharacter(), name: 'Elara' };
      const initial: CharacterSheetState = {
        ...DEFAULT_CHARACTER_SHEET_STATE,
        characters: [character],
      };
      const updated = { ...character, name: 'Elara Updated' };
      const state = characterSheetReducer(initial, {
        type: CHARACTER_SHEET_ACTION_TYPES.UPSERT_CHARACTER,
        payload: { character: updated },
      });
      expect(state.characters).toHaveLength(1);
      expect(state.characters[0].name).toBe('Elara Updated');
    });

    it('should update the updatedAt timestamp on replace', () => {
      const character = {
        ...createEmptyCharacter(),
        updatedAt: '2000-01-01T00:00:00.000Z',
      };
      const initial: CharacterSheetState = {
        ...DEFAULT_CHARACTER_SHEET_STATE,
        characters: [character],
      };
      const state = characterSheetReducer(initial, {
        type: CHARACTER_SHEET_ACTION_TYPES.UPSERT_CHARACTER,
        payload: { character },
      });
      expect(state.characters[0].updatedAt).not.toBe(
        '2000-01-01T00:00:00.000Z',
      );
    });
  });

  describe('DELETE_CHARACTER', () => {
    it('should remove a character by ID', () => {
      const character = createEmptyCharacter();
      const initial: CharacterSheetState = {
        ...DEFAULT_CHARACTER_SHEET_STATE,
        characters: [character],
      };
      const state = characterSheetReducer(initial, {
        type: CHARACTER_SHEET_ACTION_TYPES.DELETE_CHARACTER,
        payload: { id: character.id },
      });
      expect(state.characters).toHaveLength(0);
    });

    it('should clear activeId when the active character is deleted', () => {
      const character = createEmptyCharacter();
      const initial: CharacterSheetState = {
        ...DEFAULT_CHARACTER_SHEET_STATE,
        characters: [character],
        activeId: character.id,
      };
      const state = characterSheetReducer(initial, {
        type: CHARACTER_SHEET_ACTION_TYPES.DELETE_CHARACTER,
        payload: { id: character.id },
      });
      expect(state.activeId).toBeNull();
    });

    it('should leave activeId unchanged when a different character is deleted', () => {
      const a = createEmptyCharacter();
      const b = createEmptyCharacter();
      const initial: CharacterSheetState = {
        ...DEFAULT_CHARACTER_SHEET_STATE,
        characters: [a, b],
        activeId: a.id,
      };
      const state = characterSheetReducer(initial, {
        type: CHARACTER_SHEET_ACTION_TYPES.DELETE_CHARACTER,
        payload: { id: b.id },
      });
      expect(state.activeId).toBe(a.id);
    });
  });

  describe('SET_ACTIVE_ID', () => {
    it('should set the active character ID', () => {
      const character = createEmptyCharacter();
      const state = characterSheetReducer(DEFAULT_CHARACTER_SHEET_STATE, {
        type: CHARACTER_SHEET_ACTION_TYPES.SET_ACTIVE_ID,
        payload: { id: character.id },
      });
      expect(state.activeId).toBe(character.id);
    });

    it('should allow setting activeId to null', () => {
      const initial: CharacterSheetState = {
        ...DEFAULT_CHARACTER_SHEET_STATE,
        activeId: 'some-id',
      };
      const state = characterSheetReducer(initial, {
        type: CHARACTER_SHEET_ACTION_TYPES.SET_ACTIVE_ID,
        payload: { id: null },
      });
      expect(state.activeId).toBeNull();
    });
  });

  describe('RESET', () => {
    it('should return to default state', () => {
      const character = createEmptyCharacter();
      const initial: CharacterSheetState = {
        characters: [character],
        activeId: character.id,
        isHydrated: true,
      };
      const state = characterSheetReducer(initial, {
        type: CHARACTER_SHEET_ACTION_TYPES.RESET,
      });
      expect(state.characters).toHaveLength(0);
      expect(state.activeId).toBeNull();
    });
  });
});
