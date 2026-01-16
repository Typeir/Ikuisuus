/**
 * @fileoverview Unit tests for Encounter Planner Type Definitions
 * @description Tests for TypeScript interfaces used in encounter data persistence.
 * Validates interface structure and type compatibility patterns.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest - Test framework
 * @requires @/lib/types/encounterPlanner - Encounter planner types
 */

import { describe, it, expect } from 'vitest';
import type {
  ConditionEntry,
  SpellRef,
  CreatureStats,
  AffixEntry,
  CreatureDetails,
  CreatureEntry,
  Encounter,
  SpellMetadata,
} from '@/lib/types/encounterPlanner';

describe('encounterPlanner types', () => {
  describe('ConditionEntry interface', () => {
    it('should be assignable with required properties', () => {
      const condition: ConditionEntry = {
        id: 'cond-1',
        text: 'Poisoned',
      };
      expect(condition.id).toBe('cond-1');
      expect(condition.text).toBe('Poisoned');
    });

    it('should accept various condition types', () => {
      const conditions: ConditionEntry[] = [
        { id: '1', text: 'Stunned' },
        { id: '2', text: 'Blinded' },
        { id: '3', text: 'Frightened until end of next turn' },
      ];
      expect(conditions).toHaveLength(3);
    });
  });

  describe('SpellRef interface', () => {
    it('should be assignable with slug', () => {
      const spellRef: SpellRef = {
        slug: 'fireball',
      };
      expect(spellRef.slug).toBe('fireball');
    });

    it('should represent minimal spell reference', () => {
      const refs: SpellRef[] = [
        { slug: 'fireball' },
        { slug: 'magic-missile' },
        { slug: 'forbidden-sun' },
      ];
      expect(refs.every((r) => typeof r.slug === 'string')).toBe(true);
    });
  });

  describe('CreatureStats interface', () => {
    it('should be assignable with all six abilities', () => {
      const stats: CreatureStats = {
        str: 10,
        dex: 14,
        con: 12,
        int: 18,
        wis: 16,
        cha: 8,
      };
      expect(stats.str).toBe(10);
      expect(stats.int).toBe(18);
    });

    it('should accept standard point-buy values', () => {
      const stats: CreatureStats = {
        str: 15,
        dex: 15,
        con: 15,
        int: 8,
        wis: 8,
        cha: 8,
      };
      expect(Object.values(stats).every((v) => v >= 1 && v <= 30)).toBe(true);
    });

    it('should accept monster-level stats', () => {
      const dragonStats: CreatureStats = {
        str: 30,
        dex: 10,
        con: 29,
        int: 18,
        wis: 15,
        cha: 23,
      };
      expect(dragonStats.str).toBe(30);
    });
  });

  describe('AffixEntry interface', () => {
    it('should be assignable with text only', () => {
      const affix: AffixEntry = {
        text: 'Bloodthirsty',
      };
      expect(affix.text).toBe('Bloodthirsty');
      expect(affix.source).toBeUndefined();
    });

    it('should accept source with slug', () => {
      const affix: AffixEntry = {
        text: 'Flametongued',
        source: {
          slug: 'flametongued-affix',
        },
      };
      expect(affix.source?.slug).toBe('flametongued-affix');
    });

    it('should accept source with href', () => {
      const affix: AffixEntry = {
        text: 'Stormbound',
        source: {
          href: '/rules/heroic-awakening/stormbound',
        },
      };
      expect(affix.source?.href).toContain('stormbound');
    });

    it('should accept source with both slug and href', () => {
      const affix: AffixEntry = {
        text: 'Psionic',
        source: {
          slug: 'psionic-affix',
          href: '/rules/heroic-awakening/psionic',
        },
      };
      expect(affix.source?.slug).toBeDefined();
      expect(affix.source?.href).toBeDefined();
    });
  });

  describe('CreatureDetails interface', () => {
    it('should be assignable with empty arrays', () => {
      const details: CreatureDetails = {
        buffs: [],
        items: [],
        spells: [],
        affixes: [],
      };
      expect(details.buffs).toHaveLength(0);
    });

    it('should accept populated arrays', () => {
      const details: CreatureDetails = {
        buffs: ['Bless', 'Shield of Faith', 'Haste'],
        items: ['Longsword +1', 'Shield'],
        spells: [{ slug: 'fireball' }, { slug: 'counterspell' }],
        affixes: [{ text: 'Bloodthirsty' }],
      };
      expect(details.buffs).toHaveLength(3);
      expect(details.spells).toHaveLength(2);
    });
  });

  describe('CreatureEntry interface', () => {
    it('should be assignable with all required properties', () => {
      const creature: CreatureEntry = {
        id: 'creature-1',
        name: 'Goblin',
        hpCurrent: 7,
        hpMax: 7,
        tempHp: null,
        ac: 15,
        stats: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
        conditions: [],
        initiativeValue: null,
        initiativeBonus: 2,
        proficiencyBonus: null,
        speed: null,
        hpFormula: null,
        details: { buffs: [], items: [], spells: [], affixes: [] },
      };
      expect(creature.name).toBe('Goblin');
      expect(creature.hpCurrent).toBe(7);
    });

    it('should accept library-imported creature with optional fields', () => {
      const creature: CreatureEntry = {
        id: 'creature-2',
        name: 'Ancient Red Dragon',
        hpCurrent: 546,
        hpMax: 546,
        tempHp: 50,
        ac: 22,
        stats: { str: 30, dex: 10, con: 29, int: 18, wis: 15, cha: 23 },
        conditions: [{ id: 'c1', text: 'Frightening Presence active' }],
        initiativeValue: 15,
        initiativeBonus: 0,
        proficiencyBonus: 7,
        speed: '40 ft., climb 40 ft., fly 80 ft.',
        hpFormula: '28d20 + 252',
        details: {
          buffs: [],
          items: [],
          spells: [{ slug: 'fireball' }],
          affixes: [],
        },
        sourceHref: '/library/monsters/ancient-red-dragon',
        crText: 'CR 24',
      };
      expect(creature.sourceHref).toContain('dragon');
      expect(creature.crText).toBe('CR 24');
    });

    it('should track temp HP separately from current HP', () => {
      const creature: CreatureEntry = {
        id: 'creature-3',
        name: 'Fighter',
        hpCurrent: 45,
        hpMax: 55,
        tempHp: 10,
        ac: 18,
        stats: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 8 },
        conditions: [],
        initiativeValue: 18,
        initiativeBonus: 2,
        proficiencyBonus: 3,
        speed: '30 ft.',
        hpFormula: null,
        details: { buffs: ['Aid'], items: [], spells: [], affixes: [] },
      };
      expect(creature.tempHp).toBe(10);
      expect(creature.hpCurrent).toBeLessThan(creature.hpMax);
    });
  });

  describe('Encounter interface', () => {
    it('should be assignable with all required properties', () => {
      const encounter: Encounter = {
        id: 'enc-1',
        name: 'Goblin Ambush',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        creatures: [],
      };
      expect(encounter.name).toBe('Goblin Ambush');
      expect(encounter.creatures).toHaveLength(0);
    });

    it('should accept encounters with creatures', () => {
      const goblin: CreatureEntry = {
        id: 'g1',
        name: 'Goblin',
        hpCurrent: 7,
        hpMax: 7,
        tempHp: null,
        ac: 15,
        stats: { str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8 },
        conditions: [],
        initiativeValue: 14,
        initiativeBonus: 2,
        proficiencyBonus: null,
        speed: '30 ft.',
        hpFormula: '2d6',
        details: { buffs: [], items: [], spells: [], affixes: [] },
      };

      const encounter: Encounter = {
        id: 'enc-2',
        name: 'Forest Encounter',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T12:00:00Z',
        creatures: [goblin, { ...goblin, id: 'g2', name: 'Goblin 2' }],
      };
      expect(encounter.creatures).toHaveLength(2);
    });

    it('should have ISO 8601 date strings', () => {
      const encounter: Encounter = {
        id: 'enc-3',
        name: 'Test',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        creatures: [],
      };
      expect(encounter.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(encounter.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('SpellMetadata interface', () => {
    it('should be assignable with all required properties', () => {
      const spell: SpellMetadata = {
        slug: 'fireball',
        title: 'Fireball',
        level: 3,
        school: 'Evocation',
        castingTime: ['action'],
        castingTimeRaw: '1 action',
        concentration: false,
      };
      expect(spell.title).toBe('Fireball');
      expect(spell.level).toBe(3);
    });

    it('should accept spells with multiple casting times', () => {
      const spell: SpellMetadata = {
        slug: 'healing-word',
        title: 'Healing Word',
        level: 1,
        school: 'Evocation',
        castingTime: ['bonus_action'],
        castingTimeRaw: '1 bonus action',
        concentration: false,
      };
      expect(spell.castingTime).toContain('bonus_action');
    });

    it('should accept concentration spells', () => {
      const spell: SpellMetadata = {
        slug: 'hold-person',
        title: 'Hold Person',
        level: 2,
        school: 'Enchantment',
        castingTime: ['action'],
        castingTimeRaw: '1 action',
        concentration: true,
      };
      expect(spell.concentration).toBe(true);
    });

    it('should accept cantrips with level 0', () => {
      const spell: SpellMetadata = {
        slug: 'fire-bolt',
        title: 'Fire Bolt',
        level: 0,
        school: 'Evocation',
        castingTime: ['action'],
        castingTimeRaw: '1 action',
        concentration: false,
      };
      expect(spell.level).toBe(0);
    });
  });

  describe('type compatibility', () => {
    it('should allow creature entries to be spread and modified', () => {
      const base: CreatureEntry = {
        id: 'base',
        name: 'Template',
        hpCurrent: 10,
        hpMax: 10,
        tempHp: null,
        ac: 10,
        stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        conditions: [],
        initiativeValue: null,
        initiativeBonus: 0,
        proficiencyBonus: null,
        speed: null,
        hpFormula: null,
        details: { buffs: [], items: [], spells: [], affixes: [] },
      };

      const modified: CreatureEntry = {
        ...base,
        id: 'modified',
        name: 'Modified Creature',
        hpCurrent: 15,
        hpMax: 15,
      };

      expect(modified.id).toBe('modified');
      expect(modified.hpMax).toBe(15);
      expect(modified.stats).toBe(base.stats);
    });

    it('should allow encounters to be serialized to JSON', () => {
      const encounter: Encounter = {
        id: 'enc-test',
        name: 'Serialization Test',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        creatures: [],
      };

      const serialized = JSON.stringify(encounter);
      const deserialized = JSON.parse(serialized) as Encounter;

      expect(deserialized.id).toBe(encounter.id);
      expect(deserialized.name).toBe(encounter.name);
    });
  });
});
