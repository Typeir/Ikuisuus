/**
 * persistentUiStorage Tests
 *
 * @fileoverview Covers reading stored preferences and stamping the root.
 */

import {
  readPersistedState,
  writePersistedState,
} from '@/lib/context/persistentUiStorage';
import {
  DEFAULT_PERSISTENT_UI_STATE,
  PERSISTENT_UI_STORAGE_KEY,
  type PersistentUiState,
} from '@/lib/types/persistentUiState';
import { beforeEach, describe, expect, it } from 'vitest';

/** Clears every layer the storage port reads from. */
function clearStorage(): void {
  localStorage.clear();
  sessionStorage.clear();
  document.cookie = `${PERSISTENT_UI_STORAGE_KEY}=; Max-Age=0; Path=/`;
  document.cookie = 'data-theme=; Max-Age=0; Path=/';
}

describe('persistentUiStorage', () => {
  beforeEach(clearStorage);

  describe('readPersistedState', () => {
    it('should return display defaults with nothing stored', () => {
      const state = readPersistedState([]);

      expect(state.textScale).toBe(1);
      expect(state.proseMeasure).toBe(100);
      expect(state.constrainedHue).toBe(false);
    });

    it('should read stored display preferences', () => {
      localStorage.setItem(
        PERSISTENT_UI_STORAGE_KEY,
        JSON.stringify({
          textScale: 1.5,
          proseMeasure: 111,
          constrainedHue: true,
        }),
      );

      const state = readPersistedState([]);

      expect(state.textScale).toBe(1.5);
      expect(state.proseMeasure).toBe(111);
      expect(state.constrainedHue).toBe(true);
    });

    it('should reject non-positive and non-numeric stored values', () => {
      localStorage.setItem(
        PERSISTENT_UI_STORAGE_KEY,
        JSON.stringify({ textScale: -2, proseMeasure: null }),
      );

      const state = readPersistedState([]);

      expect(state.textScale).toBe(1);
      expect(state.proseMeasure).toBe(100);
    });

    it('should survive a corrupt payload', () => {
      localStorage.setItem(PERSISTENT_UI_STORAGE_KEY, '{ not json');

      expect(() => readPersistedState([])).not.toThrow();
    });
  });

  describe('writePersistedState', () => {
    const state: PersistentUiState = {
      ...DEFAULT_PERSISTENT_UI_STATE,
      textScale: 1.25,
      proseMeasure: 111,
      constrainedHue: true,
    };

    it('should stamp preferences on the root element', () => {
      writePersistedState(state);

      const root = document.documentElement;
      expect(root.getAttribute('data-constrained-hue')).toBe('true');
      expect(root.style.getPropertyValue('--text-scale-user')).toBe('1.25');
      expect(root.style.getPropertyValue('--prose-measure')).toBe('111ch');
    });

    it('should serialise preferences into the store', () => {
      writePersistedState(state);

      const stored = JSON.parse(
        localStorage.getItem(PERSISTENT_UI_STORAGE_KEY) as string,
      );
      expect(stored.textScale).toBe(1.25);
      expect(stored.proseMeasure).toBe(111);
      expect(stored.constrainedHue).toBe(true);
    });

    it('should round-trip through the storage port', () => {
      writePersistedState(state);

      const read = readPersistedState([]);
      expect(read.textScale).toBe(1.25);
      expect(read.proseMeasure).toBe(111);
      expect(read.constrainedHue).toBe(true);
    });
  });
});
