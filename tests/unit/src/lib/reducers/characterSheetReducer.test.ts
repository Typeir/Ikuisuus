/**
 * Smoke test for characterSheetReducer
 *
 * @fileoverview Verifies reducer function exists and handles basic state transitions
 * @module tests/unit/src/lib/reducers/characterSheetReducer.test
 */

import { characterSheetReducer } from '@/lib/reducers/characterSheetReducer';
import type { CharacterSheetState } from '@/lib/types/characterSheet';
import {
    CHARACTER_SHEET_ACTION_TYPES,
    DEFAULT_CHARACTER_SHEET_STATE,
} from '@/lib/types/characterSheet';
import { describe, expect, it } from 'vitest';

describe('characterSheetReducer', () => {
  it('is a function', () => {
    expect(typeof characterSheetReducer).toBe('function');
  });

  it('handles RESET action', () => {
    const state: CharacterSheetState = {
      characters: [
        {
          id: 'test-char',
          name: 'Test Character',
          updatedAt: 0,
          bloodline: { slug: '' },
          vocations: [],
          feats: [],
          equipment: {},
          notes: '',
        },
      ],
      activeId: 'test-char',
    };

    const result = characterSheetReducer(state, {
      type: CHARACTER_SHEET_ACTION_TYPES.RESET,
      payload: {},
    });

    expect(result).toEqual(DEFAULT_CHARACTER_SHEET_STATE);
  });

  it('preserves state for unknown action types', () => {
    const state: CharacterSheetState = DEFAULT_CHARACTER_SHEET_STATE;

    const result = characterSheetReducer(state, {
      type: 'UNKNOWN_ACTION' as any,
      payload: {},
    });

    expect(result).toBe(state);
  });
});
