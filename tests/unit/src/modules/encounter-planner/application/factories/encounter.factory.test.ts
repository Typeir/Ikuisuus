/**
 * @fileoverview Unit tests for Encounter Factory Utilities
 * @description Tests factory functions for creating creature and encounter objects.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest - Test framework
 * @requires @/modules/encounter-planner/application/factories/encounter.factory - Factory functions
 */

import {
    createCreatureFromMonster,
    createEmptyCreature,
    createEmptyEncounter,
    createMultipleCreaturesFromMonster,
} from '@/modules/encounter-planner/application/factories/encounter.factory';
import { describe, expect, it } from 'vitest';

describe('encounterFactory', () => {
  describe('createEmptyCreature', () => {
    it('should create a creature with default stats of 10', () => {
      const creature = createEmptyCreature();
      expect(creature.stats).toEqual({
        str: 10,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10,
      });
    });

    it('should create a creature with default name', () => {
      const creature = createEmptyCreature();
      expect(creature.name).toBe('New Creature');
    });

    it('should generate a unique ID', () => {
      const a = createEmptyCreature();
      const b = createEmptyCreature();
      expect(a.id).not.toBe(b.id);
    });

    it('should initialize HP and AC to 10', () => {
      const creature = createEmptyCreature();
      expect(creature.hpCurrent).toBe(10);
      expect(creature.hpMax).toBe(10);
      expect(creature.ac).toBe(10);
    });

    it('should initialize empty details', () => {
      const creature = createEmptyCreature();
      expect(creature.details).toEqual({
        buffs: [],
        items: [],
        spells: [],
        affixes: [],
      });
    });
  });

  describe('createEmptyEncounter', () => {
    it('should create an encounter with default name', () => {
      const encounter = createEmptyEncounter();
      expect(encounter.name).toBe('New Encounter');
    });

    it('should set timestamps', () => {
      const before = new Date().toISOString();
      const encounter = createEmptyEncounter();
      const after = new Date().toISOString();
      expect(encounter.createdAt >= before).toBe(true);
      expect(encounter.updatedAt <= after).toBe(true);
    });

    it('should initialize with empty creatures array', () => {
      const encounter = createEmptyEncounter();
      expect(encounter.creatures).toEqual([]);
    });
  });

  describe('createCreatureFromMonster', () => {
    const fullMonsterData = {
      title: 'Ancient Red Dragon',
      hp: { average: 546, formula: '28d20+252' },
      ac: { value: 22 },
      scores: {
        str: 30,
        dex: 10,
        con: 29,
        int: 18,
        wis: 15,
        cha: 23,
      },
      cr: '24',
      proficiencyBonus: 7,
      speed: { raw: '40 ft., climb 40 ft., fly 80 ft.' },
      link: '/library/monsters/ancient-red-dragon',
      tags: ['dragon', 'fire'],
    };

    it('should create a creature with monster HP', () => {
      const creature = createCreatureFromMonster(fullMonsterData, 'en');
      expect(creature.hpCurrent).toBe(546);
      expect(creature.hpMax).toBe(546);
    });

    it('should create a creature with monster AC', () => {
      const creature = createCreatureFromMonster(fullMonsterData, 'en');
      expect(creature.ac).toBe(22);
    });

    it('should populate all ability scores', () => {
      const creature = createCreatureFromMonster(fullMonsterData, 'en');
      expect(creature.stats.str).toBe(30);
      expect(creature.stats.dex).toBe(10);
      expect(creature.stats.con).toBe(29);
      expect(creature.stats.int).toBe(18);
      expect(creature.stats.wis).toBe(15);
      expect(creature.stats.cha).toBe(23);
    });

    it('should set CR text', () => {
      const creature = createCreatureFromMonster(fullMonsterData, 'en');
      expect(creature.crText).toBe('CR 24');
    });

    it('should set proficiency bonus', () => {
      const creature = createCreatureFromMonster(fullMonsterData, 'en');
      expect(creature.proficiencyBonus).toBe(7);
    });

    it('should set speed', () => {
      const creature = createCreatureFromMonster(fullMonsterData, 'en');
      expect(creature.speed).toBe('40 ft., climb 40 ft., fly 80 ft.');
    });

    it('should set HP formula', () => {
      const creature = createCreatureFromMonster(fullMonsterData, 'en');
      expect(creature.hpFormula).toBe('28d20+252');
    });

    it('should set tags array', () => {
      const creature = createCreatureFromMonster(fullMonsterData, 'en');
      expect(creature.tags).toEqual(['dragon', 'fire']);
    });

    it('should construct sourceHref with locale', () => {
      const creature = createCreatureFromMonster(fullMonsterData, 'en');
      expect(creature.sourceHref).toBe(
        '/en/library/monsters/ancient-red-dragon',
      );
    });

    it('should use different locale for sourceHref', () => {
      const creature = createCreatureFromMonster(fullMonsterData, 'es');
      expect(creature.sourceHref).toBe(
        '/es/library/monsters/ancient-red-dragon',
      );
    });

    it('should default to 10 HP when missing', () => {
      const creature = createCreatureFromMonster({}, 'en');
      expect(creature.hpCurrent).toBe(10);
      expect(creature.hpMax).toBe(10);
    });

    it('should default to 10 AC when missing', () => {
      const creature = createCreatureFromMonster({}, 'en');
      expect(creature.ac).toBe(10);
    });

    it('should default ability scores to 10 when missing', () => {
      const creature = createCreatureFromMonster({}, 'en');
      expect(creature.stats).toEqual({
        str: 10,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10,
      });
    });

    it('should default name to Imported Creature when title missing', () => {
      const creature = createCreatureFromMonster({}, 'en');
      expect(creature.name).toBe('Imported Creature');
    });

    it('should set sourceHref undefined when link missing', () => {
      const creature = createCreatureFromMonster({}, 'en');
      expect(creature.sourceHref).toBeUndefined();
    });

    it('should set crText undefined when cr missing', () => {
      const creature = createCreatureFromMonster({}, 'en');
      expect(creature.crText).toBeUndefined();
    });

    it('should set proficiencyBonus to null when missing', () => {
      const creature = createCreatureFromMonster({}, 'en');
      expect(creature.proficiencyBonus).toBeNull();
    });

    it('should default tags to empty array for non-array', () => {
      const creature = createCreatureFromMonster(
        { tags: 'not-an-array' },
        'en',
      );
      expect(creature.tags).toEqual([]);
    });
  });

  describe('createMultipleCreaturesFromMonster', () => {
    const monsterData = {
      title: 'Goblin',
      hp: { average: 7 },
      ac: { value: 15 },
    };

    it('should create the requested number of creatures', () => {
      const creatures = createMultipleCreaturesFromMonster(
        monsterData,
        'en',
        3,
      );
      expect(creatures).toHaveLength(3);
    });

    it('should create creatures with unique IDs', () => {
      const creatures = createMultipleCreaturesFromMonster(
        monsterData,
        'en',
        5,
      );
      const ids = new Set(creatures.map((c) => c.id));
      expect(ids.size).toBe(5);
    });

    it('should default to 1 creature', () => {
      const creatures = createMultipleCreaturesFromMonster(monsterData, 'en');
      expect(creatures).toHaveLength(1);
    });

    it('should clamp to minimum of 1', () => {
      const creatures = createMultipleCreaturesFromMonster(
        monsterData,
        'en',
        0,
      );
      expect(creatures).toHaveLength(1);
    });

    it('should clamp to maximum of 20', () => {
      const creatures = createMultipleCreaturesFromMonster(
        monsterData,
        'en',
        100,
      );
      expect(creatures).toHaveLength(20);
    });

    it('should floor fractional quantities', () => {
      const creatures = createMultipleCreaturesFromMonster(
        monsterData,
        'en',
        3.7,
      );
      expect(creatures).toHaveLength(3);
    });

    it('should pass monster data to each creature', () => {
      const creatures = createMultipleCreaturesFromMonster(
        monsterData,
        'en',
        2,
      );
      creatures.forEach((c) => {
        expect(c.name).toBe('Goblin');
        expect(c.hpMax).toBe(7);
        expect(c.ac).toBe(15);
      });
    });
  });
});
