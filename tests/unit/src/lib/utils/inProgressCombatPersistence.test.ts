/**
 * @fileoverview Tests for inProgressCombatPersistence
 * @description Validates CRUD operations, backward-compatibility migration,
 * active combat tracking, turn order logic, export, and SSR guards.
 */

import { EncounterStorage } from '@/lib/enums/encounterPlanner';
import type {
    InProgressCombat,
    InProgressCombatant,
} from '@/lib/types/inProgressCombat';
import { storePersistentDataRef } from '@/lib/utils/storePersistentData';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Build a minimal combatant fixture with required fields.
 *
 * @param overrides - Partial overrides for the combatant
 * @returns A well-formed InProgressCombatant
 */
function makeCombatant(
  overrides: Partial<InProgressCombatant> = {},
): InProgressCombatant {
  return {
    id: 'c1',
    name: 'Test Combatant',
    hpCurrent: 20,
    hpMax: 20,
    hpMaxOverride: null,
    tempHp: null,
    ac: 15,
    stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    conditions: [],
    initiativeValue: 10,
    initiativeBonus: 0,
    proficiencyBonus: 2,
    proficiencyBonusOverride: null,
    speed: '30 ft.',
    hpFormula: '3d8+6',
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
      lair: false,
      stratagem: false,
      legendaryDeed: false,
      resist: false,
      phase: false,
    },
    legendaryDeedsUsed: [],
    resistRemaining: 0,
    phaseDeeds: { wounded: false, bloodied: false, doomed: false },
    ...overrides,
  };
}

/**
 * Build a minimal combat fixture.
 *
 * @param overrides - Partial overrides for the combat
 * @returns A well-formed InProgressCombat
 */
function makeCombat(
  overrides: Partial<InProgressCombat> = {},
): InProgressCombat {
  return {
    id: 'combat-1',
    encounterId: 'enc-1',
    encounterName: 'Test Encounter',
    createdAt: '2026-01-01T00:00:00.000Z',
    startedAt: '2026-01-01T00:01:00.000Z',
    combatants: [makeCombatant()],
    roundNumber: 1,
    activeTurnIndex: 0,
    turnOrder: ['c1'],
    ...overrides,
  };
}

describe('inProgressCombatPersistence', () => {
  let storage: Record<string, string>;
  const cookieStore: Record<string, string> = {};

  beforeEach(() => {
    storage = {};

    const storageMock = {
      getItem: vi.fn((key: string) => storage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key];
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

  describe('getInProgressCombats', () => {
    it('should return empty array when no data in storage', async () => {
      const { getInProgressCombats } =
        await import('@/lib/utils/inProgressCombatPersistence');
      expect(getInProgressCombats()).toEqual([]);
    });

    it('should return parsed combats from storage', async () => {
      const combat = makeCombat();
      storePersistentDataRef(
        EncounterStorage.InProgressCombats,
        JSON.stringify([combat]),
      );

      const { getInProgressCombats } =
        await import('@/lib/utils/inProgressCombatPersistence');
      const result = getInProgressCombats();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('combat-1');
    });

    it('should migrate combatants missing mechanics fields', async () => {
      const legacyCombatant = {
        id: 'c1',
        name: 'Legacy Creature',
        hpCurrent: 10,
        hpMax: 10,
        hpMaxOverride: null,
        tempHp: null,
        ac: 12,
        stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        conditions: [],
        initiativeValue: 5,
        initiativeBonus: 0,
        proficiencyBonus: 2,
        proficiencyBonusOverride: null,
        speed: '30 ft.',
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
      };

      storePersistentDataRef(
        EncounterStorage.InProgressCombats,
        JSON.stringify([
          {
            ...makeCombat(),
            combatants: [legacyCombatant],
          },
        ]),
      );

      const { getInProgressCombats } =
        await import('@/lib/utils/inProgressCombatPersistence');
      const result = getInProgressCombats();
      const migrated = result[0].combatants[0];

      expect(migrated.mechanics).toEqual({
        lair: false,
        stratagem: false,
        legendaryDeed: false,
        resist: false,
        phase: false,
      });
      expect(migrated.legendaryDeedsUsed).toEqual([]);
      expect(migrated.resistRemaining).toBe(0);
      expect(migrated.phaseDeeds).toEqual({
        wounded: false,
        bloodied: false,
        doomed: false,
      });
    });
  });

  describe('getInProgressCombat', () => {
    it('should return combat by ID', async () => {
      storePersistentDataRef(
        EncounterStorage.InProgressCombats,
        JSON.stringify([makeCombat()]),
      );

      const { getInProgressCombat } =
        await import('@/lib/utils/inProgressCombatPersistence');
      const result = getInProgressCombat('combat-1');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('combat-1');
    });

    it('should return null for non-existent ID', async () => {
      storePersistentDataRef(
        EncounterStorage.InProgressCombats,
        JSON.stringify([makeCombat()]),
      );

      const { getInProgressCombat } =
        await import('@/lib/utils/inProgressCombatPersistence');
      expect(getInProgressCombat('nonexistent')).toBeNull();
    });
  });

  describe('saveInProgressCombat', () => {
    it('should save a new combat to localStorage', async () => {
      const { saveInProgressCombat } =
        await import('@/lib/utils/inProgressCombatPersistence');
      saveInProgressCombat(makeCombat());

      const stored = JSON.parse(storage[EncounterStorage.InProgressCombats]);
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe('combat-1');
    });

    it('should update an existing combat by ID', async () => {
      const original = makeCombat();
      storePersistentDataRef(
        EncounterStorage.InProgressCombats,
        JSON.stringify([original]),
      );

      const { saveInProgressCombat } =
        await import('@/lib/utils/inProgressCombatPersistence');
      saveInProgressCombat(makeCombat({ roundNumber: 5 }));

      const stored = JSON.parse(storage[EncounterStorage.InProgressCombats]);
      expect(stored).toHaveLength(1);
      expect(stored[0].roundNumber).toBe(5);
    });
  });

  describe('deleteInProgressCombat', () => {
    it('should remove combat by ID', async () => {
      storePersistentDataRef(
        EncounterStorage.InProgressCombats,
        JSON.stringify([
          makeCombat({ id: 'keep' }),
          makeCombat({ id: 'remove' }),
        ]),
      );

      const { deleteInProgressCombat } =
        await import('@/lib/utils/inProgressCombatPersistence');
      deleteInProgressCombat('remove');

      const stored = JSON.parse(storage[EncounterStorage.InProgressCombats]);
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe('keep');
    });
  });

  describe('active combat ID', () => {
    it('should get and set active combat ID', async () => {
      const { setActiveInProgressCombatId, getActiveInProgressCombatId } =
        await import('@/lib/utils/inProgressCombatPersistence');

      setActiveInProgressCombatId('combat-1');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        EncounterStorage.ActiveCombatId,
        'combat-1',
      );
    });

    it('should clear active combat ID when set to null', async () => {
      const { setActiveInProgressCombatId } =
        await import('@/lib/utils/inProgressCombatPersistence');

      setActiveInProgressCombatId(null);
      expect(localStorage.removeItem).toHaveBeenCalledWith(
        EncounterStorage.ActiveCombatId,
      );
    });
  });

  describe('exportInProgressCombat', () => {
    it('should return formatted JSON string', async () => {
      const { exportInProgressCombat } =
        await import('@/lib/utils/inProgressCombatPersistence');
      const combat = makeCombat();
      const result = exportInProgressCombat(combat);

      expect(result).toBe(JSON.stringify(combat, null, 2));
      expect(result).toContain('\n');
    });
  });

  describe('getNextActiveCombatantIndex', () => {
    it('should advance to the next non-slain combatant', async () => {
      const { getNextActiveCombatantIndex } =
        await import('@/lib/utils/inProgressCombatPersistence');
      const combatants = [
        makeCombatant({ id: 'a', slain: false }),
        makeCombatant({ id: 'b', slain: false }),
        makeCombatant({ id: 'c', slain: false }),
      ];
      const turnOrder = ['a', 'b', 'c'];

      expect(getNextActiveCombatantIndex(combatants, turnOrder, 0)).toBe(1);
      expect(getNextActiveCombatantIndex(combatants, turnOrder, 1)).toBe(2);
    });

    it('should skip slain combatants', async () => {
      const { getNextActiveCombatantIndex } =
        await import('@/lib/utils/inProgressCombatPersistence');
      const combatants = [
        makeCombatant({ id: 'a', slain: false }),
        makeCombatant({ id: 'b', slain: true }),
        makeCombatant({ id: 'c', slain: false }),
      ];
      const turnOrder = ['a', 'b', 'c'];

      expect(getNextActiveCombatantIndex(combatants, turnOrder, 0)).toBe(2);
    });

    it('should wrap around to the beginning', async () => {
      const { getNextActiveCombatantIndex } =
        await import('@/lib/utils/inProgressCombatPersistence');
      const combatants = [
        makeCombatant({ id: 'a', slain: false }),
        makeCombatant({ id: 'b', slain: false }),
      ];
      const turnOrder = ['a', 'b'];

      expect(getNextActiveCombatantIndex(combatants, turnOrder, 1)).toBe(0);
    });

    it('should return current index when all combatants are slain', async () => {
      const { getNextActiveCombatantIndex } =
        await import('@/lib/utils/inProgressCombatPersistence');
      const combatants = [
        makeCombatant({ id: 'a', slain: true }),
        makeCombatant({ id: 'b', slain: true }),
      ];
      const turnOrder = ['a', 'b'];

      expect(getNextActiveCombatantIndex(combatants, turnOrder, 0)).toBe(0);
    });
  });
});
