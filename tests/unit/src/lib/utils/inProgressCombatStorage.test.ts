/**
 * @fileoverview Unit tests for In-Progress Combat Storage Utilities
 * @description Tests for combat snapshot management and Play Mode operations.
 * Tests pure functions directly and localStorage operations with mocked storage.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest - Test framework
 * @requires @/lib/utils/inProgressCombatStorage - Combat storage utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createInProgressCombatant,
  sortCombatantsByInitiative,
  resortCombatants,
  getInProgressCombats,
  getInProgressCombat,
  saveInProgressCombat,
  deleteInProgressCombat,
  getActiveInProgressCombatId,
  setActiveInProgressCombatId,
  exportInProgressCombat,
  getNextActiveCombatantIndex,
  forceHeroicAwakening,
} from '@/lib/utils/inProgressCombatStorage';
import { createEmptyCreature } from '@/lib/utils/encounterStorage';
import { EncounterStorage } from '@/lib/enums/encounterPlanner';
import type { InProgressCombat, InProgressCombatant } from '@/lib/types/inProgressCombat';
import type { CreatureEntry } from '@/lib/types/encounterPlanner';

describe('inProgressCombatStorage', () => {
  describe('createInProgressCombatant', () => {
    it('should convert creature to combatant', () => {
      const creature = createEmptyCreature();
      creature.name = 'Test Creature';
      const combatant = createInProgressCombatant(creature);

      expect(combatant.name).toBe('Test Creature');
      expect(combatant.id).toBe(creature.id);
    });

    it('should copy HP values', () => {
      const creature = createEmptyCreature();
      creature.hpCurrent = 25;
      creature.hpMax = 30;
      creature.tempHp = 5;

      const combatant = createInProgressCombatant(creature);
      expect(combatant.hpCurrent).toBe(25);
      expect(combatant.hpMax).toBe(30);
      expect(combatant.tempHp).toBe(5);
    });

    it('should initialize hpMaxOverride as null', () => {
      const creature = createEmptyCreature();
      const combatant = createInProgressCombatant(creature);
      expect(combatant.hpMaxOverride).toBeNull();
    });

    it('should copy stats as new object', () => {
      const creature = createEmptyCreature();
      creature.stats.str = 18;
      const combatant = createInProgressCombatant(creature);

      expect(combatant.stats.str).toBe(18);
      combatant.stats.str = 10;
      expect(creature.stats.str).toBe(18);
    });

    it('should copy conditions as new array', () => {
      const creature = createEmptyCreature();
      creature.conditions = [{ id: '1', text: 'Poisoned' }];
      const combatant = createInProgressCombatant(creature);

      expect(combatant.conditions).toHaveLength(1);
      expect(combatant.conditions[0].text).toBe('Poisoned');
      combatant.conditions.push({ id: '2', text: 'Stunned' });
      expect(creature.conditions).toHaveLength(1);
    });

    it('should initialize slain as false', () => {
      const creature = createEmptyCreature();
      const combatant = createInProgressCombatant(creature);
      expect(combatant.slain).toBe(false);
    });

    it('should initialize sessionOnly as false', () => {
      const creature = createEmptyCreature();
      const combatant = createInProgressCombatant(creature);
      expect(combatant.sessionOnly).toBe(false);
    });

    it('should initialize heroicAwakening state', () => {
      const creature = createEmptyCreature();
      const combatant = createInProgressCombatant(creature);

      expect(combatant.heroicAwakening.tier).toBe('none');
      expect(combatant.heroicAwakening.awakened).toBe(false);
      expect(combatant.heroicAwakening.fateDieResult).toBe(0);
      expect(combatant.heroicAwakening.affixes).toEqual([]);
    });

    it('should copy details arrays as new arrays', () => {
      const creature = createEmptyCreature();
      creature.details.buffs = ['Bless'];
      creature.details.items = ['Sword'];
      const combatant = createInProgressCombatant(creature);

      expect(combatant.details.buffs).toEqual(['Bless']);
      expect(combatant.details.items).toEqual(['Sword']);

      combatant.details.buffs.push('Shield');
      expect(creature.details.buffs).toEqual(['Bless']);
    });

    it('should preserve sourceHref and crText', () => {
      const creature = createEmptyCreature() as CreatureEntry;
      creature.sourceHref = '/library/monsters/goblin';
      creature.crText = 'CR 1/4';
      const combatant = createInProgressCombatant(creature);

      expect(combatant.sourceHref).toBe('/library/monsters/goblin');
      expect(combatant.crText).toBe('CR 1/4');
    });
  });

  describe('sortCombatantsByInitiative', () => {
    const createCombatant = (
      id: string,
      name: string,
      initiative: number | null,
      dex: number = 10
    ): InProgressCombatant => {
      const creature = createEmptyCreature();
      creature.id = id;
      creature.name = name;
      creature.stats.dex = dex;
      const combatant = createInProgressCombatant(creature);
      combatant.initiativeValue = initiative;
      return combatant;
    };

    it('should sort by initiative descending', () => {
      const combatants = [
        createCombatant('a', 'A', 10),
        createCombatant('b', 'B', 20),
        createCombatant('c', 'C', 15),
      ];

      const order = sortCombatantsByInitiative(combatants);
      expect(order).toEqual(['b', 'c', 'a']);
    });

    it('should break ties by dex modifier descending', () => {
      const combatants = [
        createCombatant('a', 'A', 15, 10),
        createCombatant('b', 'B', 15, 16),
        createCombatant('c', 'C', 15, 14),
      ];

      const order = sortCombatantsByInitiative(combatants);
      expect(order).toEqual(['b', 'c', 'a']);
    });

    it('should break ties by name alphabetically', () => {
      const combatants = [
        createCombatant('a', 'Charlie', 15, 10),
        createCombatant('b', 'Alpha', 15, 10),
        createCombatant('c', 'Bravo', 15, 10),
      ];

      const order = sortCombatantsByInitiative(combatants);
      expect(order).toEqual(['b', 'c', 'a']);
    });

    it('should treat null initiative as 0', () => {
      const combatants = [
        createCombatant('a', 'A', null),
        createCombatant('b', 'B', 5),
      ];

      const order = sortCombatantsByInitiative(combatants);
      expect(order).toEqual(['b', 'a']);
    });

    it('should return empty array for empty input', () => {
      const order = sortCombatantsByInitiative([]);
      expect(order).toEqual([]);
    });

    it('should not mutate original array', () => {
      const combatants = [
        createCombatant('a', 'A', 10),
        createCombatant('b', 'B', 20),
      ];
      const originalOrder = combatants.map((c) => c.id);

      sortCombatantsByInitiative(combatants);

      expect(combatants.map((c) => c.id)).toEqual(originalOrder);
    });
  });

  describe('resortCombatants', () => {
    const createCombatant = (
      id: string,
      name: string,
      initiative: number
    ): InProgressCombatant => {
      const creature = createEmptyCreature();
      creature.id = id;
      creature.name = name;
      const combatant = createInProgressCombatant(creature);
      combatant.initiativeValue = initiative;
      return combatant;
    };

    it('should update turn order', () => {
      const combat: InProgressCombat = {
        id: 'combat-1',
        encounterId: 'enc-1',
        encounterName: 'Test',
        createdAt: '2024-01-01T00:00:00Z',
        startedAt: '2024-01-01T00:00:00Z',
        combatants: [
          createCombatant('a', 'A', 10),
          createCombatant('b', 'B', 20),
        ],
        roundNumber: 1,
        activeTurnIndex: 0,
        turnOrder: ['a', 'b'],
      };

      const result = resortCombatants(combat);
      expect(result.turnOrder).toEqual(['b', 'a']);
    });

    it('should preserve active combatant', () => {
      const combat: InProgressCombat = {
        id: 'combat-1',
        encounterId: 'enc-1',
        encounterName: 'Test',
        createdAt: '2024-01-01T00:00:00Z',
        startedAt: '2024-01-01T00:00:00Z',
        combatants: [
          createCombatant('a', 'A', 10),
          createCombatant('b', 'B', 20),
        ],
        roundNumber: 1,
        activeTurnIndex: 0,
        turnOrder: ['a', 'b'],
      };

      const result = resortCombatants(combat);
      expect(result.turnOrder[result.activeTurnIndex]).toBe('a');
    });

    it('should not mutate original combat', () => {
      const combat: InProgressCombat = {
        id: 'combat-1',
        encounterId: 'enc-1',
        encounterName: 'Test',
        createdAt: '2024-01-01T00:00:00Z',
        startedAt: '2024-01-01T00:00:00Z',
        combatants: [
          createCombatant('a', 'A', 10),
          createCombatant('b', 'B', 20),
        ],
        roundNumber: 1,
        activeTurnIndex: 0,
        turnOrder: ['a', 'b'],
      };

      const result = resortCombatants(combat);
      expect(combat.turnOrder).toEqual(['a', 'b']);
      expect(result.turnOrder).toEqual(['b', 'a']);
    });
  });

  describe('getNextActiveCombatantIndex', () => {
    const createCombatant = (
      id: string,
      slain: boolean
    ): InProgressCombatant => {
      const creature = createEmptyCreature();
      creature.id = id;
      const combatant = createInProgressCombatant(creature);
      combatant.slain = slain;
      return combatant;
    };

    it('should return next index for non-slain combatants', () => {
      const combatants = [
        createCombatant('a', false),
        createCombatant('b', false),
        createCombatant('c', false),
      ];
      const turnOrder = ['a', 'b', 'c'];

      const next = getNextActiveCombatantIndex(combatants, turnOrder, 0);
      expect(next).toBe(1);
    });

    it('should skip slain combatants', () => {
      const combatants = [
        createCombatant('a', false),
        createCombatant('b', true),
        createCombatant('c', false),
      ];
      const turnOrder = ['a', 'b', 'c'];

      const next = getNextActiveCombatantIndex(combatants, turnOrder, 0);
      expect(next).toBe(2);
    });

    it('should wrap around to beginning', () => {
      const combatants = [
        createCombatant('a', false),
        createCombatant('b', false),
      ];
      const turnOrder = ['a', 'b'];

      const next = getNextActiveCombatantIndex(combatants, turnOrder, 1);
      expect(next).toBe(0);
    });

    it('should return current index if all combatants slain', () => {
      const combatants = [
        createCombatant('a', true),
        createCombatant('b', true),
      ];
      const turnOrder = ['a', 'b'];

      const next = getNextActiveCombatantIndex(combatants, turnOrder, 0);
      expect(next).toBe(0);
    });

    it('should handle single non-slain combatant', () => {
      const combatants = [
        createCombatant('a', true),
        createCombatant('b', false),
        createCombatant('c', true),
      ];
      const turnOrder = ['a', 'b', 'c'];

      const next = getNextActiveCombatantIndex(combatants, turnOrder, 1);
      expect(next).toBe(1);
    });
  });

  describe('exportInProgressCombat', () => {
    it('should return valid JSON string', () => {
      const combat: InProgressCombat = {
        id: 'combat-1',
        encounterId: 'enc-1',
        encounterName: 'Test',
        createdAt: '2024-01-01T00:00:00Z',
        startedAt: '2024-01-01T00:00:00Z',
        combatants: [],
        roundNumber: 1,
        activeTurnIndex: 0,
        turnOrder: [],
      };

      const exported = exportInProgressCombat(combat);
      expect(() => JSON.parse(exported)).not.toThrow();
    });

    it('should preserve combat data', () => {
      const combat: InProgressCombat = {
        id: 'combat-1',
        encounterId: 'enc-1',
        encounterName: 'Dragon Battle',
        createdAt: '2024-01-01T00:00:00Z',
        startedAt: '2024-01-01T00:00:00Z',
        combatants: [],
        roundNumber: 3,
        activeTurnIndex: 1,
        turnOrder: [],
      };

      const exported = exportInProgressCombat(combat);
      const parsed = JSON.parse(exported);
      expect(parsed.encounterName).toBe('Dragon Battle');
      expect(parsed.roundNumber).toBe(3);
    });
  });

  describe('localStorage operations', () => {
    let mockStorage: { [key: string]: string };

    beforeEach(() => {
      mockStorage = {};
      vi.stubGlobal('localStorage', {
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
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    const createTestCombat = (id: string = 'combat-1'): InProgressCombat => ({
      id,
      encounterId: 'enc-1',
      encounterName: 'Test Combat',
      createdAt: '2024-01-01T00:00:00Z',
      startedAt: '2024-01-01T00:00:00Z',
      combatants: [],
      roundNumber: 1,
      activeTurnIndex: 0,
      turnOrder: [],
    });

    describe('getInProgressCombats', () => {
      it('should return empty array when no combats stored', () => {
        const combats = getInProgressCombats();
        expect(combats).toEqual([]);
      });

      it('should return stored combats', () => {
        const combat = createTestCombat();
        mockStorage[EncounterStorage.InProgressCombats] = JSON.stringify([
          combat,
        ]);
        const combats = getInProgressCombats();
        expect(combats).toHaveLength(1);
        expect(combats[0].encounterName).toBe('Test Combat');
      });

      it('should handle invalid JSON gracefully', () => {
        const originalError = console.error;
        console.error = vi.fn();
        mockStorage[EncounterStorage.InProgressCombats] = 'invalid json';
        const combats = getInProgressCombats();
        expect(combats).toEqual([]);
        console.error = originalError;
      });
    });

    describe('getInProgressCombat', () => {
      it('should return null for non-existent combat', () => {
        const combat = getInProgressCombat('missing-id');
        expect(combat).toBeNull();
      });

      it('should return combat by ID', () => {
        const combat = createTestCombat('test-id');
        mockStorage[EncounterStorage.InProgressCombats] = JSON.stringify([
          combat,
        ]);
        const found = getInProgressCombat('test-id');
        expect(found?.id).toBe('test-id');
      });
    });

    describe('saveInProgressCombat', () => {
      it('should add new combat', () => {
        const combat = createTestCombat();
        saveInProgressCombat(combat);

        const stored = JSON.parse(
          mockStorage[EncounterStorage.InProgressCombats]
        );
        expect(stored).toHaveLength(1);
        expect(stored[0].id).toBe('combat-1');
      });

      it('should update existing combat', () => {
        const combat = createTestCombat();
        mockStorage[EncounterStorage.InProgressCombats] = JSON.stringify([
          combat,
        ]);

        const updated = { ...combat, roundNumber: 5 };
        saveInProgressCombat(updated);

        const stored = JSON.parse(
          mockStorage[EncounterStorage.InProgressCombats]
        );
        expect(stored).toHaveLength(1);
        expect(stored[0].roundNumber).toBe(5);
      });
    });

    describe('deleteInProgressCombat', () => {
      it('should remove combat by ID', () => {
        const combat1 = createTestCombat('c1');
        const combat2 = createTestCombat('c2');
        mockStorage[EncounterStorage.InProgressCombats] = JSON.stringify([
          combat1,
          combat2,
        ]);

        deleteInProgressCombat('c1');

        const stored = JSON.parse(
          mockStorage[EncounterStorage.InProgressCombats]
        );
        expect(stored).toHaveLength(1);
        expect(stored[0].id).toBe('c2');
      });

      it('should not affect active combat ID', () => {
        const combat = createTestCombat('active-combat');
        mockStorage[EncounterStorage.InProgressCombats] = JSON.stringify([
          combat,
        ]);
        mockStorage[EncounterStorage.ActiveCombatId] = 'active-combat';

        deleteInProgressCombat('active-combat');

        expect(mockStorage[EncounterStorage.ActiveCombatId]).toBe('active-combat');
      });
    });

    describe('getActiveInProgressCombatId', () => {
      it('should return null when no active combat', () => {
        const id = getActiveInProgressCombatId();
        expect(id).toBeNull();
      });

      it('should return stored active combat ID', () => {
        mockStorage[EncounterStorage.ActiveCombatId] = 'test-id';
        const id = getActiveInProgressCombatId();
        expect(id).toBe('test-id');
      });
    });

    describe('setActiveInProgressCombatId', () => {
      it('should store active combat ID', () => {
        setActiveInProgressCombatId('new-id');
        expect(mockStorage[EncounterStorage.ActiveCombatId]).toBe('new-id');
      });

      it('should remove active combat ID when null', () => {
        mockStorage[EncounterStorage.ActiveCombatId] = 'existing-id';
        setActiveInProgressCombatId(null);
        expect(mockStorage[EncounterStorage.ActiveCombatId]).toBeUndefined();
      });
    });
  });

  describe('Mechanics Features', () => {
    describe('createInProgressCombatant with mechanics', () => {
      it('should initialize default mechanics as all false', () => {
        const creature = createEmptyCreature();
        const combatant = createInProgressCombatant(creature);

        expect(combatant.mechanics).toEqual({
          lair: false,
          stratagem: false,
          legendaryDeed: false,
          resist: false,
          phase: false,
        });
      });

      it('should parse lair mechanic from tags', () => {
        const creature = createEmptyCreature() as CreatureEntry;
        creature.tags = ['mechanic:lair', 'creature:aberration'];
        const combatant = createInProgressCombatant(creature);

        expect(combatant.mechanics.lair).toBe(true);
        expect(combatant.mechanics.stratagem).toBe(false);
      });

      it('should parse stratagem mechanic from tags', () => {
        const creature = createEmptyCreature() as CreatureEntry;
        creature.tags = ['mechanic:stratagem'];
        const combatant = createInProgressCombatant(creature);

        expect(combatant.mechanics.stratagem).toBe(true);
      });

      it('should parse legendary-deed mechanic from tags', () => {
        const creature = createEmptyCreature() as CreatureEntry;
        creature.tags = ['mechanic:legendary-deed'];
        const combatant = createInProgressCombatant(creature);

        expect(combatant.mechanics.legendaryDeed).toBe(true);
        expect(combatant.legendaryDeedsUsed).toHaveLength(3);
        expect(combatant.legendaryDeedsUsed.every((d) => d === false)).toBe(true);
      });

      it('should parse resist mechanic from tags', () => {
        const creature = createEmptyCreature() as CreatureEntry;
        creature.tags = ['mechanic:resist'];
        const combatant = createInProgressCombatant(creature);

        expect(combatant.mechanics.resist).toBe(true);
        expect(combatant.resistRemaining).toBe(3);
      });

      it('should not initialize legendaryDeedsUsed without mechanic', () => {
        const creature = createEmptyCreature();
        const combatant = createInProgressCombatant(creature);

        expect(combatant.legendaryDeedsUsed).toHaveLength(0);
      });

      it('should not initialize resistRemaining without mechanic', () => {
        const creature = createEmptyCreature();
        const combatant = createInProgressCombatant(creature);

        expect(combatant.resistRemaining).toBe(0);
      });

      it('should handle multiple mechanics from tags', () => {
        const creature = createEmptyCreature() as CreatureEntry;
        creature.tags = ['mechanic:lair', 'mechanic:stratagem', 'mechanic:legendary-deed', 'mechanic:resist'];
        const combatant = createInProgressCombatant(creature);

        expect(combatant.mechanics.lair).toBe(true);
        expect(combatant.mechanics.stratagem).toBe(true);
        expect(combatant.mechanics.legendaryDeed).toBe(true);
        expect(combatant.mechanics.resist).toBe(true);
        expect(combatant.legendaryDeedsUsed).toHaveLength(3);
        expect(combatant.resistRemaining).toBe(3);
      });

      it('should handle undefined tags', () => {
        const creature = createEmptyCreature();
        // Explicitly set tags to undefined
        (creature as CreatureEntry).tags = undefined;
        const combatant = createInProgressCombatant(creature);

        expect(combatant.mechanics).toEqual({
          lair: false,
          stratagem: false,
          legendaryDeed: false,
          resist: false,
          phase: false,
        });
      });

      it('should handle empty tags array', () => {
        const creature = createEmptyCreature() as CreatureEntry;
        creature.tags = [];
        const combatant = createInProgressCombatant(creature);

        expect(combatant.mechanics).toEqual({
          lair: false,
          stratagem: false,
          legendaryDeed: false,
          resist: false,
          phase: false,
        });
      });
    });

    describe('Migration of old combatant data', () => {
      let mockStorage: Record<string, string>;

      beforeEach(() => {
        mockStorage = {};
        vi.stubGlobal('localStorage', {
          getItem: vi.fn((key: string) => mockStorage[key] || null),
          setItem: vi.fn((key: string, value: string) => {
            mockStorage[key] = value;
          }),
          removeItem: vi.fn((key: string) => {
            delete mockStorage[key];
          }),
        });
      });

      afterEach(() => {
        vi.unstubAllGlobals();
      });

      it('should migrate combatant without mechanics field', () => {
        const oldCombat = {
          id: 'combat-1',
          encounterId: 'enc-1',
          encounterName: 'Test',
          createdAt: '2024-01-01T00:00:00Z',
          startedAt: '2024-01-01T00:00:00Z',
          combatants: [
            {
              id: 'c-1',
              name: 'Old Creature',
              hpCurrent: 50,
              hpMax: 50,
              hpMaxOverride: null,
              tempHp: null,
              ac: 15,
              stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
              conditions: [],
              initiativeValue: 15,
              initiativeBonus: 0,
              proficiencyBonus: null,
              proficiencyBonusOverride: null,
              speed: null,
              hpFormula: null,
              details: { buffs: [], items: [], spells: [], affixes: [] },
              slain: false,
              sessionOnly: false,
              heroicAwakening: {
                fateDieResult: 0,
                heroicDc: 0,
                awakened: false,
                tier: 'none',
                affixes: [],
                bonuses: { proficiencyBonus: 0, acBonus: 0, savingThrowBonus: 0 },
                hpOverride: null,
              },
              // Note: Missing mechanics, legendaryDeedsUsed, resistRemaining
            },
          ],
          roundNumber: 1,
          activeTurnIndex: 0,
          turnOrder: ['c-1'],
        };

        mockStorage[EncounterStorage.InProgressCombats] = JSON.stringify([oldCombat]);

        const combats = getInProgressCombats();
        expect(combats).toHaveLength(1);
        
        const migratedCombatant = combats[0].combatants[0];
        expect(migratedCombatant.mechanics).toEqual({
          lair: false,
          stratagem: false,
          legendaryDeed: false,
          resist: false,
          phase: false,
        });
        expect(migratedCombatant.legendaryDeedsUsed).toEqual([]);
        expect(migratedCombatant.resistRemaining).toBe(0);
        expect(migratedCombatant.phaseDeeds).toEqual({
          wounded: false,
          bloodied: false,
          doomed: false,
        });
      });

      it('should preserve existing mechanics data during migration', () => {
        const existingCombat: InProgressCombat = {
          id: 'combat-1',
          encounterId: 'enc-1',
          encounterName: 'Test',
          createdAt: '2024-01-01T00:00:00Z',
          startedAt: '2024-01-01T00:00:00Z',
          combatants: [
            {
              id: 'c-1',
              name: 'New Creature',
              hpCurrent: 50,
              hpMax: 50,
              hpMaxOverride: null,
              tempHp: null,
              ac: 15,
              stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
              conditions: [],
              initiativeValue: 15,
              initiativeBonus: 0,
              proficiencyBonus: null,
              proficiencyBonusOverride: null,
              speed: null,
              hpFormula: null,
              details: { buffs: [], items: [], spells: [], affixes: [] },
              slain: false,
              sessionOnly: false,
              heroicAwakening: {
                fateDieResult: 0,
                heroicDc: 0,
                awakened: false,
                tier: 'none',
                affixes: [],
                bonuses: { proficiencyBonus: 0, acBonus: 0, savingThrowBonus: 0 },
                hpOverride: null,
              },
              mechanics: {
                lair: true,
                stratagem: true,
                legendaryDeed: true,
                resist: true,
              },
              legendaryDeedsUsed: [true, false, true],
              resistRemaining: 2,
            },
          ],
          roundNumber: 3,
          activeTurnIndex: 0,
          turnOrder: ['c-1'],
        };

        mockStorage[EncounterStorage.InProgressCombats] = JSON.stringify([existingCombat]);

        const combats = getInProgressCombats();
        const migratedCombatant = combats[0].combatants[0];
        
        expect(migratedCombatant.mechanics.lair).toBe(true);
        expect(migratedCombatant.mechanics.stratagem).toBe(true);
        expect(migratedCombatant.legendaryDeedsUsed).toEqual([true, false, true]);
        expect(migratedCombatant.resistRemaining).toBe(2);
      });
    });
  });

  describe('forceHeroicAwakening', () => {
    it('should apply awakened tier bonuses correctly', () => {
      const combatant = createInProgressCombatant(
        createEmptyCreature()
      );
      combatant.crText = 'CR 5';
      combatant.ac = 15;
      combatant.hpMax = 100;
      combatant.hpCurrent = 100;
      combatant.proficiencyBonus = 3;

      forceHeroicAwakening(combatant, 'awakened', 'en');

      expect(combatant.heroicAwakening.tier).toBe('awakened');
      expect(combatant.heroicAwakening.awakened).toBe(true);
      expect(combatant.heroicAwakening.bonuses.acBonus).toBe(1);
      expect(combatant.ac).toBe(16); // 15 + 1
      expect(combatant.hpMax).toBe(105); // 100 + (1 * 5)
      expect(combatant.heroicAwakening.affixes).toHaveLength(1);
    });

    it('should prevent infinite stacking when clicking awakened multiple times', () => {
      const combatant = createInProgressCombatant(
        createEmptyCreature()
      );
      combatant.crText = 'CR 5';
      combatant.ac = 15;
      combatant.hpMax = 100;
      combatant.hpCurrent = 100;
      combatant.proficiencyBonus = 3;

      // First click
      forceHeroicAwakening(combatant, 'awakened', 'en');
      const firstAc = combatant.ac;
      const firstHpMax = combatant.hpMax;

      // Second click (should not stack)
      forceHeroicAwakening(combatant, 'awakened', 'en');
      const secondAc = combatant.ac;
      const secondHpMax = combatant.hpMax;

      expect(firstAc).toBe(16);
      expect(secondAc).toBe(16); // Should stay 16, not become 17
      expect(firstHpMax).toBe(105);
      expect(secondHpMax).toBe(105); // Should stay 105, not become 110
    });

    it('should properly transition from awakened to legendary', () => {
      const combatant = createInProgressCombatant(
        createEmptyCreature()
      );
      combatant.crText = 'CR 5';
      combatant.ac = 15;
      combatant.hpMax = 100;
      combatant.hpCurrent = 100;
      combatant.proficiencyBonus = 3;

      // First: awakened
      forceHeroicAwakening(combatant, 'awakened', 'en');
      expect(combatant.ac).toBe(16); // 15 + 1
      expect(combatant.hpMax).toBe(105); // 100 + 5

      // Second: legendary (should undo awakened and apply legendary)
      forceHeroicAwakening(combatant, 'legendary', 'en');
      expect(combatant.ac).toBe(17); // (15 + 1 - 1) + 2 = 17
      expect(combatant.hpMax).toBe(110); // (100 + 5 - 5) + 10 = 110
      expect(combatant.heroicAwakening.tier).toBe('legendary');
      expect(combatant.heroicAwakening.bonuses.acBonus).toBe(2);
      expect(combatant.heroicAwakening.affixes).toHaveLength(2);
    });

    it('should apply mythic tier with 3 affixes', () => {
      const combatant = createInProgressCombatant(
        createEmptyCreature()
      );
      combatant.crText = 'CR 5';
      combatant.ac = 15;
      combatant.hpMax = 100;
      combatant.hpCurrent = 100;
      combatant.proficiencyBonus = 3;

      forceHeroicAwakening(combatant, 'mythic', 'en');

      expect(combatant.heroicAwakening.tier).toBe('mythic');
      expect(combatant.heroicAwakening.bonuses.acBonus).toBe(3);
      expect(combatant.ac).toBe(18); // 15 + 3
      expect(combatant.hpMax).toBe(115); // 100 + (3 * 5)
      expect(combatant.heroicAwakening.affixes).toHaveLength(3);
    });
  });
});
