/**
 * @fileoverview Unit tests for Party Storage Utilities
 * @description Tests CRUD operations for saved parties in localStorage.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest - Test framework
 * @requires @/modules/encounter-planner/infrastructure/persistence/partyRepository - Party storage utilities
 */

import { EncounterStorage } from '@/modules/encounter-planner/domain/storage/encounterStorageKeys';
import type { SavedParty } from '@/modules/encounter-planner/domain/parties/party.types';
import {
    deleteParty,
    getPartyById,
    getSavedParties,
    saveParty,
} from '@/modules/encounter-planner/infrastructure/persistence/partyRepository';
import { storePersistentDataRef } from '@/lib/utils/storePersistentData';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockParty: SavedParty = {
  id: 'party-1',
  name: 'Adventurers',
  members: [
    { id: 'm1', name: 'Alaric' },
    { id: 'm2', name: 'Brenna' },
  ],
};

const mockParty2: SavedParty = {
  id: 'party-2',
  name: 'Mercenaries',
  members: [{ id: 'm3', name: 'Caius' }],
};

describe('partyStorage', () => {
  let storage: Record<string, string>;
  const cookieStore: Record<string, string> = {};

  beforeEach(() => {
    storage = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key: string) => storage[key] ?? null,
    );
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
      (key: string, value: string) => {
        storage[key] = value;
      },
    );
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(
      (key: string) => {
        delete storage[key];
      },
    );

    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () =>
        Object.entries(cookieStore)
          .map(([k, v]) => `${k}=${v}`)
          .join('; '),
      set: (cookieStr: string) => {
        const parts = cookieStr.split('; ');
        const [nameVal] = parts;
        const eqIdx = nameVal.indexOf('=');
        if (eqIdx === -1) return;
        const name = nameVal.slice(0, eqIdx);
        const value = nameVal.slice(eqIdx + 1);
        const maxAgePart = parts.find((p) =>
          p.toLowerCase().startsWith('max-age='),
        );
        if (maxAgePart) {
          const age = parseInt(maxAgePart.split('=')[1], 10);
          if (age <= 0) {
            delete cookieStore[name];
            return;
          }
        }
        cookieStore[name] = value;
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.keys(cookieStore).forEach((k) => delete cookieStore[k]);
  });

  describe('getSavedParties', () => {
    it('should return empty array when no parties exist', () => {
      expect(getSavedParties()).toEqual([]);
    });

    it('should return empty array when stored value is invalid JSON', () => {
      storePersistentDataRef(EncounterStorage.SavedParties, 'not-json');
      expect(getSavedParties()).toEqual([]);
    });

    it('should return saved parties from storage', () => {
      storePersistentDataRef(
        EncounterStorage.SavedParties,
        JSON.stringify([mockParty]),
      );
      expect(getSavedParties()).toEqual([mockParty]);
    });
  });

  describe('saveParty', () => {
    it('should add a new party when none exist', () => {
      saveParty(mockParty);
      const stored = JSON.parse(storage[EncounterStorage.SavedParties]);
      expect(stored).toEqual([mockParty]);
    });

    it('should append a party to existing list', () => {
      storePersistentDataRef(
        EncounterStorage.SavedParties,
        JSON.stringify([mockParty]),
      );
      saveParty(mockParty2);
      const stored = JSON.parse(storage[EncounterStorage.SavedParties]);
      expect(stored).toHaveLength(2);
      expect(stored[1]).toEqual(mockParty2);
    });

    it('should replace existing party with same ID', () => {
      storePersistentDataRef(
        EncounterStorage.SavedParties,
        JSON.stringify([mockParty]),
      );
      const updated = { ...mockParty, name: 'Updated Adventurers' };
      saveParty(updated);
      const stored = JSON.parse(storage[EncounterStorage.SavedParties]);
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe('Updated Adventurers');
    });
  });

  describe('deleteParty', () => {
    it('should remove a party by ID', () => {
      storePersistentDataRef(
        EncounterStorage.SavedParties,
        JSON.stringify([mockParty, mockParty2]),
      );
      deleteParty('party-1');
      const stored = JSON.parse(storage[EncounterStorage.SavedParties]);
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe('party-2');
    });

    it('should handle deleting non-existent ID gracefully', () => {
      storePersistentDataRef(
        EncounterStorage.SavedParties,
        JSON.stringify([mockParty]),
      );
      deleteParty('nonexistent');
      const stored = JSON.parse(storage[EncounterStorage.SavedParties]);
      expect(stored).toHaveLength(1);
    });
  });

  describe('getPartyById', () => {
    it('should return matching party', () => {
      storePersistentDataRef(
        EncounterStorage.SavedParties,
        JSON.stringify([mockParty, mockParty2]),
      );
      expect(getPartyById('party-2')).toEqual(mockParty2);
    });

    it('should return null when party not found', () => {
      storePersistentDataRef(
        EncounterStorage.SavedParties,
        JSON.stringify([mockParty]),
      );
      expect(getPartyById('nonexistent')).toBeNull();
    });

    it('should return null when no parties exist', () => {
      expect(getPartyById('party-1')).toBeNull();
    });
  });
});
