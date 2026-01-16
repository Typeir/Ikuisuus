/**
 * @fileoverview Unit tests for In-Progress Combat Type Definitions
 * @description Tests for TypeScript interfaces used in Play Mode combat snapshots.
 * Validates interface structure and type compatibility patterns.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest - Test framework
 * @requires @/lib/types/inProgressCombat - In-progress combat types
 */

import { describe, it, expect } from 'vitest';
import type {
  ConditionEntry,
  HeroicAwakeningState,
  InProgressCombatant,
  InProgressCombat,
} from '@/lib/types/inProgressCombat';

describe('inProgressCombat types', () => {
  describe('ConditionEntry interface', () => {
    it('should be assignable with required properties', () => {
      const condition: ConditionEntry = {
        id: 'cond-1',
        text: 'Stunned',
      };
      expect(condition.id).toBe('cond-1');
      expect(condition.text).toBe('Stunned');
    });

    it('should accept various combat conditions', () => {
      const conditions: ConditionEntry[] = [
        { id: '1', text: 'Prone' },
        { id: '2', text: 'Grappled by Dragon' },
        { id: '3', text: 'Concentration: Bless' },
      ];
      expect(conditions).toHaveLength(3);
    });
  });

  describe('HeroicAwakeningState interface', () => {
    it('should be assignable with none tier', () => {
      const state: HeroicAwakeningState = {
        fateDieResult: 5,
        heroicDc: 15,
        awakened: false,
        tier: 'none',
        affixes: [],
        bonuses: {
          proficiencyBonus: 0,
          acBonus: 0,
          savingThrowBonus: 0,
        },
        hpOverride: null,
      };
      expect(state.tier).toBe('none');
      expect(state.awakened).toBe(false);
    });

    it('should be assignable with awakened tier', () => {
      const state: HeroicAwakeningState = {
        fateDieResult: 17,
        heroicDc: 15,
        awakened: true,
        tier: 'awakened',
        affixes: [{ text: 'Bloodthirsty' }],
        bonuses: {
          proficiencyBonus: 1,
          acBonus: 1,
          savingThrowBonus: 1,
        },
        hpOverride: 120,
      };
      expect(state.tier).toBe('awakened');
      expect(state.affixes).toHaveLength(1);
      expect(state.bonuses.proficiencyBonus).toBe(1);
    });

    it('should be assignable with legendary tier', () => {
      const state: HeroicAwakeningState = {
        fateDieResult: 19,
        heroicDc: 15,
        awakened: true,
        tier: 'legendary',
        affixes: [{ text: 'Bloodthirsty' }, { text: 'Stormbound' }],
        bonuses: {
          proficiencyBonus: 2,
          acBonus: 2,
          savingThrowBonus: 2,
        },
        hpOverride: 180,
      };
      expect(state.tier).toBe('legendary');
      expect(state.affixes).toHaveLength(2);
      expect(state.bonuses.acBonus).toBe(2);
    });

    it('should be assignable with mythic tier', () => {
      const state: HeroicAwakeningState = {
        fateDieResult: 20,
        heroicDc: 15,
        awakened: true,
        tier: 'mythic',
        affixes: [
          { text: 'Bloodthirsty' },
          { text: 'Stormbound' },
          { text: 'Flametongued' },
        ],
        bonuses: {
          proficiencyBonus: 3,
          acBonus: 3,
          savingThrowBonus: 3,
        },
        hpOverride: 250,
      };
      expect(state.tier).toBe('mythic');
      expect(state.affixes).toHaveLength(3);
      expect(state.bonuses.savingThrowBonus).toBe(3);
    });

    it('should have fateDieResult in valid d20 range', () => {
      const validRolls = [1, 5, 10, 15, 20];
      validRolls.forEach((roll) => {
        const state: HeroicAwakeningState = {
          fateDieResult: roll,
          heroicDc: 15,
          awakened: roll >= 15,
          tier: roll >= 20 ? 'mythic' : roll >= 18 ? 'legendary' : roll >= 15 ? 'awakened' : 'none',
          affixes: [],
          bonuses: { proficiencyBonus: 0, acBonus: 0, savingThrowBonus: 0 },
          hpOverride: null,
        };
        expect(state.fateDieResult).toBeGreaterThanOrEqual(1);
        expect(state.fateDieResult).toBeLessThanOrEqual(20);
      });
    });
  });

  describe('InProgressCombatant interface', () => {
    it('should be assignable with all required properties', () => {
      const combatant: InProgressCombatant = {
        id: 'combatant-1',
        name: 'Goblin',
        hpCurrent: 7,
        hpMax: 7,
        hpMaxOverride: null,
        tempHp: null,
        ac: 15,
        stats: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
        conditions: [],
        initiativeValue: 14,
        initiativeBonus: 2,
        proficiencyBonus: 2,
        proficiencyBonusOverride: null,
        speed: '30 ft.',
        hpFormula: '2d6',
        details: { buffs: [], items: [], spells: [], affixes: [] },
        slain: false,
        sessionOnly: false,
        heroicAwakening: {
          fateDieResult: 5,
          heroicDc: 15,
          awakened: false,
          tier: 'none',
          affixes: [],
          bonuses: { proficiencyBonus: 0, acBonus: 0, savingThrowBonus: 0 },
          hpOverride: null,
        },
        mechanics: { lair: false, stratagem: false, legendaryDeed: false, resist: false },
        legendaryDeedsUsed: [],
        resistRemaining: 0,
      };
      expect(combatant.name).toBe('Goblin');
      expect(combatant.slain).toBe(false);
    });

    it('should track slain status separately', () => {
      const combatant: InProgressCombatant = {
        id: 'combatant-2',
        name: 'Defeated Orc',
        hpCurrent: 0,
        hpMax: 15,
        hpMaxOverride: null,
        tempHp: null,
        ac: 13,
        stats: { str: 16, dex: 12, con: 16, int: 7, wis: 11, cha: 10 },
        conditions: [{ id: 'c1', text: 'Unconscious' }],
        initiativeValue: 8,
        initiativeBonus: 1,
        proficiencyBonus: 2,
        proficiencyBonusOverride: null,
        speed: '30 ft.',
        hpFormula: '2d8 + 6',
        details: { buffs: [], items: [], spells: [], affixes: [] },
        slain: true,
        sessionOnly: false,
        heroicAwakening: {
          fateDieResult: 3,
          heroicDc: 15,
          awakened: false,
          tier: 'none',
          affixes: [],
          bonuses: { proficiencyBonus: 0, acBonus: 0, savingThrowBonus: 0 },
          hpOverride: null,
        },
        mechanics: { lair: false, stratagem: false, legendaryDeed: false, resist: false },
        legendaryDeedsUsed: [],
        resistRemaining: 0,
      };
      expect(combatant.slain).toBe(true);
      expect(combatant.hpCurrent).toBe(0);
    });

    it('should support session-only combatants', () => {
      const combatant: InProgressCombatant = {
        id: 'session-1',
        name: 'Summoned Elemental',
        hpCurrent: 90,
        hpMax: 90,
        hpMaxOverride: null,
        tempHp: null,
        ac: 14,
        stats: { str: 18, dex: 10, con: 18, int: 6, wis: 10, cha: 6 },
        conditions: [],
        initiativeValue: 10,
        initiativeBonus: 0,
        proficiencyBonus: 3,
        proficiencyBonusOverride: null,
        speed: '30 ft., burrow 30 ft.',
        hpFormula: '12d10 + 24',
        details: { buffs: [], items: [], spells: [], affixes: [] },
        slain: false,
        sessionOnly: true,
        heroicAwakening: {
          fateDieResult: 1,
          heroicDc: 15,
          awakened: false,
          tier: 'none',
          affixes: [],
          bonuses: { proficiencyBonus: 0, acBonus: 0, savingThrowBonus: 0 },
          hpOverride: null,
        },
        mechanics: { lair: false, stratagem: false, legendaryDeed: false, resist: false },
        legendaryDeedsUsed: [],
        resistRemaining: 0,
      };
      expect(combatant.sessionOnly).toBe(true);
    });

    it('should support heroic awakening overrides', () => {
      const combatant: InProgressCombatant = {
        id: 'awakened-1',
        name: 'Awakened Orc',
        hpCurrent: 45,
        hpMax: 15,
        hpMaxOverride: 45,
        tempHp: null,
        ac: 15,
        stats: { str: 16, dex: 12, con: 16, int: 7, wis: 11, cha: 10 },
        conditions: [],
        initiativeValue: 12,
        initiativeBonus: 1,
        proficiencyBonus: 2,
        proficiencyBonusOverride: 3,
        speed: '30 ft.',
        hpFormula: '2d8 + 6',
        details: {
          buffs: [],
          items: [],
          spells: [],
          affixes: [{ text: 'Bloodthirsty' }],
        },
        slain: false,
        sessionOnly: false,
        heroicAwakening: {
          fateDieResult: 17,
          heroicDc: 15,
          awakened: true,
          tier: 'awakened',
          affixes: [{ text: 'Bloodthirsty' }],
          bonuses: { proficiencyBonus: 1, acBonus: 1, savingThrowBonus: 1 },
          hpOverride: 45,
        },
        mechanics: { lair: false, stratagem: false, legendaryDeed: false, resist: false },
        legendaryDeedsUsed: [],
        resistRemaining: 0,
      };
      expect(combatant.hpMaxOverride).toBe(45);
      expect(combatant.proficiencyBonusOverride).toBe(3);
      expect(combatant.heroicAwakening.awakened).toBe(true);
    });

    it('should accept library-imported combatants with source', () => {
      const combatant: InProgressCombatant = {
        id: 'library-1',
        name: 'Ancient Red Dragon',
        hpCurrent: 546,
        hpMax: 546,
        hpMaxOverride: null,
        tempHp: null,
        ac: 22,
        stats: { str: 30, dex: 10, con: 29, int: 18, wis: 15, cha: 23 },
        conditions: [],
        initiativeValue: 15,
        initiativeBonus: 0,
        proficiencyBonus: 7,
        proficiencyBonusOverride: null,
        speed: '40 ft., climb 40 ft., fly 80 ft.',
        hpFormula: '28d20 + 252',
        details: { buffs: [], items: [], spells: [], affixes: [] },
        slain: false,
        sessionOnly: false,
        sourceHref: '/library/monsters/ancient-red-dragon',
        crText: 'CR 24',
        heroicAwakening: {
          fateDieResult: 1,
          heroicDc: 15,
          awakened: false,
          tier: 'none',
          affixes: [],
          bonuses: { proficiencyBonus: 0, acBonus: 0, savingThrowBonus: 0 },
          hpOverride: null,
        },
        mechanics: { lair: false, stratagem: false, legendaryDeed: false, resist: false },
        legendaryDeedsUsed: [],
        resistRemaining: 0,
      };
      expect(combatant.sourceHref).toContain('dragon');
      expect(combatant.crText).toBe('CR 24');
    });
  });

  describe('InProgressCombat interface', () => {
    const createBaseCombatant = (id: string, name: string): InProgressCombatant => ({
      id,
      name,
      hpCurrent: 10,
      hpMax: 10,
      hpMaxOverride: null,
      tempHp: null,
      ac: 10,
      stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
      conditions: [],
      initiativeValue: null,
      initiativeBonus: 0,
      proficiencyBonus: 2,
      proficiencyBonusOverride: null,
      speed: '30 ft.',
      hpFormula: null,
      details: { buffs: [], items: [], spells: [], affixes: [] },
      slain: false,
      sessionOnly: false,
      heroicAwakening: {
        fateDieResult: 1,
        heroicDc: 15,
        awakened: false,
        tier: 'none',
        affixes: [],
        bonuses: { proficiencyBonus: 0, acBonus: 0, savingThrowBonus: 0 },
        hpOverride: null,
      },
      mechanics: { lair: false, stratagem: false, legendaryDeed: false, resist: false },
      legendaryDeedsUsed: [],
      resistRemaining: 0,
    });

    it('should be assignable with all required properties', () => {
      const combat: InProgressCombat = {
        id: 'combat-1',
        encounterId: 'enc-1',
        encounterName: 'Goblin Ambush',
        createdAt: '2024-01-15T10:00:00Z',
        startedAt: '2024-01-15T10:30:00Z',
        combatants: [],
        roundNumber: 1,
        activeTurnIndex: 0,
        turnOrder: [],
      };
      expect(combat.encounterName).toBe('Goblin Ambush');
      expect(combat.roundNumber).toBe(1);
    });

    it('should track combat round and turn', () => {
      const combat: InProgressCombat = {
        id: 'combat-2',
        encounterId: 'enc-2',
        encounterName: 'Dragon Fight',
        createdAt: '2024-01-15T10:00:00Z',
        startedAt: '2024-01-15T10:00:00Z',
        combatants: [
          createBaseCombatant('c1', 'Fighter'),
          createBaseCombatant('c2', 'Dragon'),
        ],
        roundNumber: 3,
        activeTurnIndex: 1,
        turnOrder: ['c1', 'c2'],
      };
      expect(combat.roundNumber).toBe(3);
      expect(combat.activeTurnIndex).toBe(1);
      expect(combat.combatants).toHaveLength(2);
      expect(combat.turnOrder).toHaveLength(2);
    });

    it('should reference base encounter', () => {
      const combat: InProgressCombat = {
        id: 'combat-3',
        encounterId: 'base-encounter-id',
        encounterName: 'Forest Battle',
        createdAt: '2024-01-15T10:00:00Z',
        startedAt: '2024-01-15T10:05:00Z',
        combatants: [],
        roundNumber: 1,
        activeTurnIndex: 0,
        turnOrder: [],
      };
      expect(combat.encounterId).toBe('base-encounter-id');
      expect(combat.encounterName).toBe('Forest Battle');
    });

    it('should have ISO 8601 date strings', () => {
      const combat: InProgressCombat = {
        id: 'combat-4',
        encounterId: 'enc-4',
        encounterName: 'Test',
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        combatants: [],
        roundNumber: 1,
        activeTurnIndex: 0,
        turnOrder: [],
      };
      expect(combat.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(combat.startedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should maintain turn order as array of combatant ids', () => {
      const combat: InProgressCombat = {
        id: 'combat-5',
        encounterId: 'enc-5',
        encounterName: 'Initiative Test',
        createdAt: '2024-01-15T10:00:00Z',
        startedAt: '2024-01-15T10:00:00Z',
        combatants: [
          createBaseCombatant('slow', 'Slow Fighter'),
          createBaseCombatant('fast', 'Fast Rogue'),
          createBaseCombatant('mid', 'Wizard'),
        ],
        roundNumber: 1,
        activeTurnIndex: 0,
        turnOrder: ['fast', 'mid', 'slow'],
      };
      expect(combat.turnOrder[0]).toBe('fast');
      expect(combat.turnOrder).toHaveLength(3);
    });
  });

  describe('type compatibility', () => {
    it('should allow combatants to be spread and modified', () => {
      const base: InProgressCombatant = {
        id: 'base',
        name: 'Template',
        hpCurrent: 10,
        hpMax: 10,
        hpMaxOverride: null,
        tempHp: null,
        ac: 10,
        stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        conditions: [],
        initiativeValue: null,
        initiativeBonus: 0,
        proficiencyBonus: 2,
        proficiencyBonusOverride: null,
        speed: null,
        hpFormula: null,
        details: { buffs: [], items: [], spells: [], affixes: [] },
        slain: false,
        sessionOnly: false,
        heroicAwakening: {
          fateDieResult: 1,
          heroicDc: 15,
          awakened: false,
          tier: 'none',
          affixes: [],
          bonuses: { proficiencyBonus: 0, acBonus: 0, savingThrowBonus: 0 },
          hpOverride: null,
        },
        mechanics: { lair: false, stratagem: false, legendaryDeed: false, resist: false },
        legendaryDeedsUsed: [],
        resistRemaining: 0,
      };

      const damaged: InProgressCombatant = {
        ...base,
        id: 'damaged',
        hpCurrent: 5,
        conditions: [{ id: 'c1', text: 'Bloodied' }],
      };

      expect(damaged.id).toBe('damaged');
      expect(damaged.hpCurrent).toBe(5);
      expect(damaged.conditions).toHaveLength(1);
    });

    it('should allow combat to be serialized to JSON', () => {
      const combat: InProgressCombat = {
        id: 'combat-serialize',
        encounterId: 'enc-1',
        encounterName: 'Test',
        createdAt: '2024-01-01T00:00:00Z',
        startedAt: '2024-01-01T00:00:00Z',
        combatants: [],
        roundNumber: 1,
        activeTurnIndex: 0,
        turnOrder: [],
      };

      const serialized = JSON.stringify(combat);
      const deserialized = JSON.parse(serialized) as InProgressCombat;

      expect(deserialized.id).toBe(combat.id);
      expect(deserialized.roundNumber).toBe(combat.roundNumber);
    });
  });
});
