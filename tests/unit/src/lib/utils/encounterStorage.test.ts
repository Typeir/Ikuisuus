/**
 * @fileoverview Unit tests for Encounter Storage Utilities
 * @description Tests for encounter persistence and management functions.
 * Tests pure functions directly and localStorage operations with mocked storage.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest - Test framework
 * @requires @/lib/utils/encounterStorage - Encounter storage utilities
 */

import { EncounterStorage } from '@/lib/enums/encounterPlanner';
import type { Encounter } from '@/lib/types/encounterPlanner';
import {
    calculateInitiativeMod,
    createEmptyCreature,
    createEmptyEncounter,
    deleteEncounter,
    exportEncounter,
    generateId,
    getActiveEncounter,
    getActiveEncounterId,
    getEncounters,
    importEncounter,
    rollInitiative,
    saveEncounter,
    saveEncounters,
    setActiveEncounterId,
} from '@/lib/utils/encounterStorage';
import { storePersistentDataRef } from '@/lib/utils/storePersistentData';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('encounterStorage', () => {
  describe('generateId', () => {
    it('should generate a string ID', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
    });

    it('should generate unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateId()));
      expect(ids.size).toBe(100);
    });

    it('should include timestamp component', () => {
      const before = Date.now();
      const id = generateId();
      const after = Date.now();

      const timestampPart = parseInt(id.split('-')[0], 10);
      expect(timestampPart).toBeGreaterThanOrEqual(before);
      expect(timestampPart).toBeLessThanOrEqual(after);
    });

    it('should have format timestamp-randomString', () => {
      const id = generateId();
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('calculateInitiativeMod', () => {
    it('should return 0 for dex 10', () => {
      expect(calculateInitiativeMod(10)).toBe(0);
    });

    it('should return 0 for dex 11', () => {
      expect(calculateInitiativeMod(11)).toBe(0);
    });

    it('should return +1 for dex 12', () => {
      expect(calculateInitiativeMod(12)).toBe(1);
    });

    it('should return +3 for dex 16', () => {
      expect(calculateInitiativeMod(16)).toBe(3);
    });

    it('should return +5 for dex 20', () => {
      expect(calculateInitiativeMod(20)).toBe(5);
    });

    it('should return -1 for dex 8', () => {
      expect(calculateInitiativeMod(8)).toBe(-1);
    });

    it('should return -5 for dex 1', () => {
      expect(calculateInitiativeMod(1)).toBe(-5);
    });

    it('should return +10 for dex 30', () => {
      expect(calculateInitiativeMod(30)).toBe(10);
    });

    it('should floor fractional results', () => {
      expect(calculateInitiativeMod(9)).toBe(-1);
      expect(calculateInitiativeMod(13)).toBe(1);
      expect(calculateInitiativeMod(15)).toBe(2);
    });
  });

  describe('createEmptyCreature', () => {
    it('should create a creature with unique ID', () => {
      const creature1 = createEmptyCreature();
      const creature2 = createEmptyCreature();
      expect(creature1.id).not.toBe(creature2.id);
    });

    it('should have default name "New Creature"', () => {
      const creature = createEmptyCreature();
      expect(creature.name).toBe('New Creature');
    });

    it('should have default HP of 10/10', () => {
      const creature = createEmptyCreature();
      expect(creature.hpCurrent).toBe(10);
      expect(creature.hpMax).toBe(10);
    });

    it('should have null tempHp', () => {
      const creature = createEmptyCreature();
      expect(creature.tempHp).toBeNull();
    });

    it('should have default AC of 10', () => {
      const creature = createEmptyCreature();
      expect(creature.ac).toBe(10);
    });

    it('should have all ability scores at 10', () => {
      const creature = createEmptyCreature();
      expect(creature.stats.str).toBe(10);
      expect(creature.stats.dex).toBe(10);
      expect(creature.stats.con).toBe(10);
      expect(creature.stats.int).toBe(10);
      expect(creature.stats.wis).toBe(10);
      expect(creature.stats.cha).toBe(10);
    });

    it('should have initiative bonus of 0 (from dex 10)', () => {
      const creature = createEmptyCreature();
      expect(creature.initiativeBonus).toBe(0);
    });

    it('should have null initiativeValue', () => {
      const creature = createEmptyCreature();
      expect(creature.initiativeValue).toBeNull();
    });

    it('should have empty conditions array', () => {
      const creature = createEmptyCreature();
      expect(creature.conditions).toEqual([]);
    });

    it('should have empty details arrays', () => {
      const creature = createEmptyCreature();
      expect(creature.details.buffs).toEqual([]);
      expect(creature.details.items).toEqual([]);
      expect(creature.details.spells).toEqual([]);
      expect(creature.details.affixes).toEqual([]);
    });

    it('should have null optional fields', () => {
      const creature = createEmptyCreature();
      expect(creature.proficiencyBonus).toBeNull();
      expect(creature.speed).toBeNull();
      expect(creature.hpFormula).toBeNull();
    });
  });

  describe('createEmptyEncounter', () => {
    it('should create an encounter with unique ID', () => {
      const enc1 = createEmptyEncounter();
      const enc2 = createEmptyEncounter();
      expect(enc1.id).not.toBe(enc2.id);
    });

    it('should have default name "New Encounter"', () => {
      const encounter = createEmptyEncounter();
      expect(encounter.name).toBe('New Encounter');
    });

    it('should have ISO date strings for timestamps', () => {
      const encounter = createEmptyEncounter();
      expect(encounter.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(encounter.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should have matching createdAt and updatedAt initially', () => {
      const encounter = createEmptyEncounter();
      expect(encounter.createdAt).toBe(encounter.updatedAt);
    });
  });

  describe('rollInitiative', () => {
    it('should return a number', () => {
      const result = rollInitiative(0);
      expect(typeof result).toBe('number');
    });

    it('should include modifier in result', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      const result = rollInitiative(5);
      expect(result).toBe(11 + 5);
      vi.restoreAllMocks();
    });

    it('should produce minimum result with modifier', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      expect(rollInitiative(0)).toBe(1);
      expect(rollInitiative(3)).toBe(4);
      expect(rollInitiative(-2)).toBe(-1);
      vi.restoreAllMocks();
    });

    it('should produce maximum result with modifier', () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.999);
      expect(rollInitiative(0)).toBe(20);
      expect(rollInitiative(5)).toBe(25);
      vi.restoreAllMocks();
    });
  });

  describe('exportEncounter', () => {
    it('should return valid JSON string', () => {
      const encounter = createEmptyEncounter();
      const exported = exportEncounter(encounter);
      expect(() => JSON.parse(exported)).not.toThrow();
    });

    it('should preserve encounter data', () => {
      const encounter = createEmptyEncounter();
      encounter.name = 'Test Export';
      const exported = exportEncounter(encounter);
      const parsed = JSON.parse(exported);
      expect(parsed.name).toBe('Test Export');
    });

    it('should include all encounter properties', () => {
      const encounter = createEmptyEncounter();
      const exported = exportEncounter(encounter);
      const parsed = JSON.parse(exported);
      expect(parsed).toHaveProperty('id');
      expect(parsed).toHaveProperty('name');
      expect(parsed).toHaveProperty('createdAt');
      expect(parsed).toHaveProperty('updatedAt');
      expect(parsed).toHaveProperty('creatures');
    });
  });

  describe('importEncounter', () => {
    it('should parse valid JSON', () => {
      const encounter = createEmptyEncounter();
      const json = JSON.stringify(encounter);
      const imported = importEncounter(json);
      expect(imported.name).toBe(encounter.name);
    });

    it('should generate new ID for imported encounter', () => {
      const encounter = createEmptyEncounter();
      const originalId = encounter.id;
      const json = JSON.stringify(encounter);
      const imported = importEncounter(json);
      expect(imported.id).not.toBe(originalId);
    });

    it('should update updatedAt timestamp on import', () => {
      const encounter = createEmptyEncounter();
      encounter.createdAt = '2020-01-01T00:00:00Z';
      encounter.updatedAt = '2020-01-01T00:00:00Z';
      const json = JSON.stringify(encounter);

      const imported = importEncounter(json);

      expect(imported.createdAt).toBe('2020-01-01T00:00:00Z');
      expect(imported.updatedAt).not.toBe('2020-01-01T00:00:00Z');
    });

    it('should throw on invalid JSON', () => {
      expect(() => importEncounter('invalid json')).toThrow();
    });

    it('should preserve creature data', () => {
      const encounter = createEmptyEncounter();
      encounter.creatures.push(createEmptyCreature());
      encounter.creatures[0].name = 'Test Creature';
      const json = JSON.stringify(encounter);
      const imported = importEncounter(json);
      expect(imported.creatures[0].name).toBe('Test Creature');
    });
  });

  describe('localStorage operations', () => {
    let mockStorage: { [key: string]: string };
    const cookieStore: Record<string, string> = {};

    beforeEach(() => {
      mockStorage = {};
      sessionStorage.clear();

      const storageMock = {
        getItem: vi.fn((key: string) => mockStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          mockStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockStorage[key];
        }),
        clear: vi.fn(() => {
          mockStorage = {};
        }),
      };
      vi.stubGlobal('localStorage', storageMock);
      vi.stubGlobal('sessionStorage', storageMock);

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
      vi.unstubAllGlobals();
      Object.keys(cookieStore).forEach((k) => delete cookieStore[k]);
    });

    describe('getEncounters', () => {
      it('should return empty array when no encounters stored', () => {
        const encounters = getEncounters();
        expect(encounters).toEqual([]);
      });

      it('should return stored encounters', () => {
        const encounter = createEmptyEncounter();
        storePersistentDataRef(
          EncounterStorage.Encounters,
          JSON.stringify([encounter]),
        );
        const encounters = getEncounters();
        expect(encounters).toHaveLength(1);
        expect(encounters[0].name).toBe(encounter.name);
      });

      it('should handle invalid JSON gracefully', () => {
        const originalError = console.error;
        console.error = vi.fn();
        storePersistentDataRef(EncounterStorage.Encounters, 'invalid json');
        const encounters = getEncounters();
        expect(encounters).toEqual([]);
        console.error = originalError;
      });
    });

    describe('getActiveEncounterId', () => {
      it('should return null when no active encounter', () => {
        const id = getActiveEncounterId();
        expect(id).toBeNull();
      });

      it('should return stored active encounter ID', () => {
        mockStorage[EncounterStorage.ActiveEncounterId] = 'test-id';
        const id = getActiveEncounterId();
        expect(id).toBe('test-id');
      });
    });

    describe('setActiveEncounterId', () => {
      it('should store active encounter ID', () => {
        setActiveEncounterId('new-id');
        expect(mockStorage[EncounterStorage.ActiveEncounterId]).toBe('new-id');
      });

      it('should remove active encounter ID when null', () => {
        mockStorage[EncounterStorage.ActiveEncounterId] = 'existing-id';
        setActiveEncounterId(null);
        expect(mockStorage[EncounterStorage.ActiveEncounterId]).toBeUndefined();
      });
    });

    describe('getActiveEncounter', () => {
      it('should return null when no active encounter ID', () => {
        const encounter = getActiveEncounter();
        expect(encounter).toBeNull();
      });

      it('should return null when active ID not found in encounters', () => {
        mockStorage[EncounterStorage.ActiveEncounterId] = 'missing-id';
        storePersistentDataRef(EncounterStorage.Encounters, JSON.stringify([]));
        const encounter = getActiveEncounter();
        expect(encounter).toBeNull();
      });

      it('should return active encounter when found', () => {
        const enc = createEmptyEncounter();
        enc.name = 'Active Test';
        storePersistentDataRef(
          EncounterStorage.Encounters,
          JSON.stringify([enc]),
        );
        mockStorage[EncounterStorage.ActiveEncounterId] = enc.id;
        const encounter = getActiveEncounter();
        expect(encounter?.name).toBe('Active Test');
      });
    });

    describe('saveEncounters', () => {
      it('should store encounters array', () => {
        const encounters = [createEmptyEncounter(), createEmptyEncounter()];
        saveEncounters(encounters);
        const stored = JSON.parse(mockStorage[EncounterStorage.Encounters]);
        expect(stored).toHaveLength(2);
      });
    });

    describe('saveEncounter', () => {
      it('should add new encounter', () => {
        const encounter = createEmptyEncounter();
        saveEncounter(encounter);
        const stored = JSON.parse(mockStorage[EncounterStorage.Encounters]);
        expect(stored).toHaveLength(1);
        expect(stored[0].id).toBe(encounter.id);
      });

      it('should update existing encounter', () => {
        const encounter = createEmptyEncounter();
        storePersistentDataRef(
          EncounterStorage.Encounters,
          JSON.stringify([encounter]),
        );

        encounter.name = 'Updated Name';
        saveEncounter(encounter);

        const stored = JSON.parse(mockStorage[EncounterStorage.Encounters]);
        expect(stored).toHaveLength(1);
        expect(stored[0].name).toBe('Updated Name');
      });

      it('should update updatedAt timestamp', () => {
        const encounter = createEmptyEncounter();
        const originalUpdatedAt = encounter.updatedAt;

        vi.useFakeTimers();
        vi.advanceTimersByTime(1000);

        saveEncounter(encounter);

        const stored = JSON.parse(
          mockStorage[EncounterStorage.Encounters],
        ) as Encounter[];
        expect(stored[0].updatedAt).not.toBe(originalUpdatedAt);

        vi.useRealTimers();
      });
    });

    describe('deleteEncounter', () => {
      it('should remove encounter by ID', () => {
        const enc1 = createEmptyEncounter();
        const enc2 = createEmptyEncounter();
        storePersistentDataRef(
          EncounterStorage.Encounters,
          JSON.stringify([enc1, enc2]),
        );

        deleteEncounter(enc1.id);

        const stored = JSON.parse(mockStorage[EncounterStorage.Encounters]);
        expect(stored).toHaveLength(1);
        expect(stored[0].id).toBe(enc2.id);
      });

      it('should clear active ID if deleted encounter was active', () => {
        const encounter = createEmptyEncounter();
        storePersistentDataRef(
          EncounterStorage.Encounters,
          JSON.stringify([encounter]),
        );
        mockStorage[EncounterStorage.ActiveEncounterId] = encounter.id;

        deleteEncounter(encounter.id);

        expect(mockStorage[EncounterStorage.ActiveEncounterId]).toBeUndefined();
      });

      it('should not clear active ID if different encounter deleted', () => {
        const enc1 = createEmptyEncounter();
        const enc2 = createEmptyEncounter();
        storePersistentDataRef(
          EncounterStorage.Encounters,
          JSON.stringify([enc1, enc2]),
        );
        mockStorage[EncounterStorage.ActiveEncounterId] = enc2.id;

        deleteEncounter(enc1.id);

        expect(mockStorage[EncounterStorage.ActiveEncounterId]).toBe(enc2.id);
      });
    });
  });
});
