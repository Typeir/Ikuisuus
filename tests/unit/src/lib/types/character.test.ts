/**
 * @fileoverview Unit tests for Character Sheet type definitions
 * @description Type-constraint and shape tests verifying CharacterSheet,
 * CharacterShard, CharacterAttack, CharacterSkill, CharacterSpellSlot,
 * CharacterCurrency, and CompactCharacterRef interfaces.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/lib/types/character
 */

import type {
    CharacterAttack,
    CharacterCurrency,
    CharacterShard,
    CharacterSheet,
    CharacterSkill,
    CharacterSpellSlot,
    CompactCharacterRef,
    ProficiencyLevel,
} from '@/lib/types/character';
import { describe, expect, it } from 'vitest';

describe('character types', () => {
  describe('CharacterShard', () => {
    it('accepts a boon shard with all optional fields', () => {
      const shard: CharacterShard = {
        id: 's-1',
        sourceFile: 'character-creation/bloodlines/empyrean.bloodline.mdx',
        heading: 'Extended Reach',
        category: 'boon',
        bpCost: 6,
        cachedText: 'Your reach is 5 ft. greater.',
      };
      expect(shard.category).toBe('boon');
      expect(shard.bpCost).toBe(6);
    });

    it('accepts a vocation-feature shard with level', () => {
      const shard: CharacterShard = {
        id: 's-2',
        sourceFile: 'character-creation/vocations/wizard/main.mdx',
        heading: 'Arcane Recovery',
        category: 'vocation-feature',
        level: 1,
      };
      expect(shard.level).toBe(1);
      expect(shard.bpCost).toBeUndefined();
    });
  });

  describe('CharacterAttack', () => {
    it('accepts a valid attack entry', () => {
      const attack: CharacterAttack = {
        id: 'atk-1',
        name: 'Longsword',
        toHit: '+7',
        damage: '1d8+4 slashing',
        notes: '',
      };
      expect(attack.name).toBe('Longsword');
    });
  });

  describe('CharacterSkill', () => {
    it('accepts proficiency levels', () => {
      const levels: ProficiencyLevel[] = ['none', 'proficient', 'expert'];
      levels.forEach((proficiency) => {
        const skill: CharacterSkill = {
          name: 'Acrobatics',
          ability: 'dex',
          proficiency,
        };
        expect(skill.proficiency).toBe(proficiency);
      });
    });
  });

  describe('CharacterSpellSlot', () => {
    it('accepts a level 3 spell slot entry', () => {
      const slot: CharacterSpellSlot = { level: 3, total: 4, used: 1 };
      expect(slot.total - slot.used).toBe(3);
    });
  });

  describe('CharacterCurrency', () => {
    it('accepts zero-value currency', () => {
      const currency: CharacterCurrency = {
        pp: 0,
        gp: 0,
        ep: 0,
        sp: 0,
        cp: 0,
      };
      expect(Object.values(currency).every((v) => v === 0)).toBe(true);
    });
  });

  describe('CompactCharacterRef', () => {
    it('accepts a minimal compact ref', () => {
      const ref: CompactCharacterRef = {
        v: 1,
        n: 'Elara',
        l: 5,
        b: 'empyrean',
        vc: 'wizard',
        s: 'evoker',
        as: [10, 18, 12, 20, 14, 16],
        hp: 32,
        ac: 14,
        boons: ['Extended Reach', 'Soma'],
      };
      expect(ref.v).toBe(1);
      expect(ref.as).toHaveLength(6);
    });
  });

  describe('CharacterSheet', () => {
    it('accepts a minimal valid character sheet', () => {
      const sheet: CharacterSheet = {
        id: 'char-1',
        createdAt: '2026-05-06T00:00:00.000Z',
        updatedAt: '2026-05-06T00:00:00.000Z',
        name: 'Elara Dawnveil',
        playerName: 'Player',
        level: 1,
        experience: 0,
        bloodlineSlug: null,
        bloodlineTitle: '',
        boonBudget: 0,
        selectedBoons: [],
        vocationSlug: null,
        vocationTitle: '',
        specializationSlug: null,
        specializationTitle: '',
        vocationFeatures: [],
        specializationFeatures: [],
        abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        hpMax: 8,
        hpCurrent: 8,
        tempHp: 0,
        ac: 10,
        initiativeBonus: 0,
        speedOverride: null,
        proficiencyBonus: 2,
        conditions: [],
        attacks: [],
        spellSlots: [],
        savingThrows: {
          str: 'none',
          dex: 'none',
          con: 'none',
          int: 'none',
          wis: 'none',
          cha: 'none',
        },
        skills: [],
        equipment: [],
        currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
        background: '',
        personality: '',
        ideals: '',
        bonds: '',
        flaws: '',
        notes: '',
      };
      expect(sheet.name).toBe('Elara Dawnveil');
      expect(sheet.level).toBe(1);
      expect(sheet.proficiencyBonus).toBe(2);
    });
  });
});
