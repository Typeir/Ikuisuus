/**
 * @fileoverview Unit tests for Content Tags System
 * @description Tests for ContentKind enum, type guards, and tag interfaces.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest - Test framework
 * @requires @/modules/library/domain/contentTags - Content tags module
 */

import { describe, it, expect } from 'vitest';
import {
  ContentKind,
  isSpellTag,
  isMonsterTag,
  isBloodlineTag,
  isVocationTag,
  type SpellTag,
  type MonsterTag,
  type BloodlineTag,
  type VocationTag,
  type SpellActionType,
  type CreatureSize,
  type HitDie,
  type SpellcastingType,
  type AbilityScore,
  type BaseContentMeta,
  type BaseTagging,
  type SpellComponents,
} from '@/modules/library/domain/contentTags';

describe('content-tags', () => {
  describe('ContentKind enum', () => {
    describe('exports', () => {
      it('should export ContentKind enum', () => {
        expect(ContentKind).toBeDefined();
        expect(typeof ContentKind).toBe('object');
      });

      it('should have exactly 7 content kinds', () => {
        const kinds = Object.keys(ContentKind);
        expect(kinds).toHaveLength(7);
      });
    });

    describe('content kind values', () => {
      it('should have Spell content kind', () => {
        expect(ContentKind.Spell).toBe('spell');
      });

      it('should have Monster content kind', () => {
        expect(ContentKind.Monster).toBe('monster');
      });

      it('should have Bloodline content kind', () => {
        expect(ContentKind.Bloodline).toBe('bloodline');
      });

      it('should have Vocation content kind', () => {
        expect(ContentKind.Vocation).toBe('vocation');
      });

      it('should have Item content kind', () => {
        expect(ContentKind.Item).toBe('item');
      });

      it('should have Location content kind', () => {
        expect(ContentKind.Location).toBe('location');
      });

      it('should have Rule content kind', () => {
        expect(ContentKind.Rule).toBe('rule');
      });
    });

    describe('value format', () => {
      it('should have lowercase string values', () => {
        Object.values(ContentKind).forEach((value) => {
          expect(value).toBe(value.toLowerCase());
        });
      });

      it('should have unique values', () => {
        const values = Object.values(ContentKind);
        const uniqueValues = new Set(values);
        expect(uniqueValues.size).toBe(values.length);
      });
    });
  });

  describe('type guards', () => {
    const createSpellTag = (): SpellTag => ({
      id: 'spell-1',
      kind: ContentKind.Spell,
      title: 'Fireball',
      level: 3,
      school: 'Evocation',
      actionType: 'action',
      range: '150 feet',
      ritual: false,
      concentration: false,
      duration: 'Instantaneous',
      components: { v: true, s: true, m: true },
    });

    const createMonsterTag = (): MonsterTag => ({
      id: 'monster-1',
      kind: ContentKind.Monster,
      title: 'Ancient Dragon',
      cr: 20,
      size: 'Gargantuan',
      creatureType: 'Dragon',
    });

    const createBloodlineTag = (): BloodlineTag => ({
      id: 'bloodline-1',
      kind: ContentKind.Bloodline,
      title: 'Draconic Bloodline',
      vocation: 'Sorcerer',
    });

    const createVocationTag = (): VocationTag => ({
      id: 'vocation-1',
      kind: ContentKind.Vocation,
      title: 'Warrior',
      hitDie: 'd10',
      primaryAbilities: ['STR'],
      saves: ['STR', 'CON'],
    });

    describe('isSpellTag', () => {
      it('should return true for spell tags', () => {
        const tag = createSpellTag();
        expect(isSpellTag(tag)).toBe(true);
      });

      it('should return false for monster tags', () => {
        const tag = createMonsterTag();
        expect(isSpellTag(tag)).toBe(false);
      });

      it('should return false for bloodline tags', () => {
        const tag = createBloodlineTag();
        expect(isSpellTag(tag)).toBe(false);
      });

      it('should return false for vocation tags', () => {
        const tag = createVocationTag();
        expect(isSpellTag(tag)).toBe(false);
      });

      it('should narrow type correctly', () => {
        const tag = createSpellTag();
        if (isSpellTag(tag)) {
          expect(tag.level).toBe(3);
          expect(tag.school).toBe('Evocation');
        }
      });
    });

    describe('isMonsterTag', () => {
      it('should return true for monster tags', () => {
        const tag = createMonsterTag();
        expect(isMonsterTag(tag)).toBe(true);
      });

      it('should return false for spell tags', () => {
        const tag = createSpellTag();
        expect(isMonsterTag(tag)).toBe(false);
      });

      it('should return false for bloodline tags', () => {
        const tag = createBloodlineTag();
        expect(isMonsterTag(tag)).toBe(false);
      });

      it('should return false for vocation tags', () => {
        const tag = createVocationTag();
        expect(isMonsterTag(tag)).toBe(false);
      });

      it('should narrow type correctly', () => {
        const tag = createMonsterTag();
        if (isMonsterTag(tag)) {
          expect(tag.cr).toBe(20);
          expect(tag.size).toBe('Gargantuan');
        }
      });
    });

    describe('isBloodlineTag', () => {
      it('should return true for bloodline tags', () => {
        const tag = createBloodlineTag();
        expect(isBloodlineTag(tag)).toBe(true);
      });

      it('should return false for spell tags', () => {
        const tag = createSpellTag();
        expect(isBloodlineTag(tag)).toBe(false);
      });

      it('should return false for monster tags', () => {
        const tag = createMonsterTag();
        expect(isBloodlineTag(tag)).toBe(false);
      });

      it('should return false for vocation tags', () => {
        const tag = createVocationTag();
        expect(isBloodlineTag(tag)).toBe(false);
      });

      it('should narrow type correctly', () => {
        const tag = createBloodlineTag();
        if (isBloodlineTag(tag)) {
          expect(tag.vocation).toBe('Sorcerer');
        }
      });
    });

    describe('isVocationTag', () => {
      it('should return true for vocation tags', () => {
        const tag = createVocationTag();
        expect(isVocationTag(tag)).toBe(true);
      });

      it('should return false for spell tags', () => {
        const tag = createSpellTag();
        expect(isVocationTag(tag)).toBe(false);
      });

      it('should return false for monster tags', () => {
        const tag = createMonsterTag();
        expect(isVocationTag(tag)).toBe(false);
      });

      it('should return false for bloodline tags', () => {
        const tag = createBloodlineTag();
        expect(isVocationTag(tag)).toBe(false);
      });

      it('should narrow type correctly', () => {
        const tag = createVocationTag();
        if (isVocationTag(tag)) {
          expect(tag.hitDie).toBe('d10');
          expect(tag.primaryAbilities).toContain('STR');
        }
      });
    });
  });

  describe('type definitions', () => {
    describe('SpellActionType', () => {
      it('should accept valid action types', () => {
        const validTypes: SpellActionType[] = [
          'action',
          'minor_action',
          'reaction',
          'special',
        ];
        expect(validTypes).toHaveLength(4);
      });
    });

    describe('CreatureSize', () => {
      it('should accept valid creature sizes', () => {
        const validSizes: CreatureSize[] = [
          'Tiny',
          'Small',
          'Medium',
          'Large',
          'Huge',
          'Gargantuan',
          'Colossal',
          'Titanic',
        ];
        expect(validSizes).toHaveLength(8);
      });
    });

    describe('HitDie', () => {
      it('should accept valid hit dice', () => {
        const validDice: HitDie[] = ['d4', 'd6', 'd8', 'd10', 'd12'];
        expect(validDice).toHaveLength(5);
      });
    });

    describe('SpellcastingType', () => {
      it('should accept valid spellcasting types', () => {
        const validTypes: SpellcastingType[] = ['none', 'half', 'full', 'third'];
        expect(validTypes).toHaveLength(4);
      });
    });

    describe('AbilityScore', () => {
      it('should accept valid ability scores', () => {
        const validScores: AbilityScore[] = [
          'STR',
          'DEX',
          'CON',
          'INT',
          'WIS',
          'CHA',
        ];
        expect(validScores).toHaveLength(6);
      });
    });

    describe('BaseContentMeta interface', () => {
      it('should be assignable with required properties', () => {
        const meta: BaseContentMeta = {
          id: 'test-1',
          kind: ContentKind.Spell,
          title: 'Test Content',
        };
        expect(meta.id).toBe('test-1');
        expect(meta.kind).toBe(ContentKind.Spell);
        expect(meta.title).toBe('Test Content');
      });

      it('should accept optional properties', () => {
        const meta: BaseContentMeta = {
          id: 'test-2',
          kind: ContentKind.Monster,
          title: 'Test Monster',
          slug: 'test-monster',
          lang: 'en',
          draft: true,
          source: 'PHB',
        };
        expect(meta.slug).toBe('test-monster');
        expect(meta.draft).toBe(true);
      });
    });

    describe('BaseTagging interface', () => {
      it('should accept empty tagging', () => {
        const tagging: BaseTagging = {};
        expect(tagging.tags).toBeUndefined();
      });

      it('should accept all optional properties', () => {
        const tagging: BaseTagging = {
          tags: ['fire', 'damage'],
          keywords: ['combat', 'aoe'],
          regions: ['Damocles', 'Underdark'],
          eras: ['Age of Gods'],
        };
        expect(tagging.tags).toHaveLength(2);
        expect(tagging.keywords).toHaveLength(2);
      });
    });

    describe('SpellComponents interface', () => {
      it('should require v, s, m booleans', () => {
        const components: SpellComponents = {
          v: true,
          s: false,
          m: true,
        };
        expect(components.v).toBe(true);
        expect(components.s).toBe(false);
        expect(components.m).toBe(true);
      });

      it('should accept optional material details', () => {
        const components: SpellComponents = {
          v: true,
          s: true,
          m: true,
          materialText: 'a diamond worth 500 gp',
          costGp: 500,
          consumed: true,
        };
        expect(components.materialText).toContain('diamond');
        expect(components.costGp).toBe(500);
        expect(components.consumed).toBe(true);
      });
    });
  });

  describe('tag interfaces', () => {
    describe('SpellTag', () => {
      it('should be assignable with all required properties', () => {
        const spell: SpellTag = {
          id: 'fireball',
          kind: ContentKind.Spell,
          title: 'Fireball',
          level: 3,
          school: 'Evocation',
          actionType: 'action',
          range: '150 feet',
          ritual: false,
          concentration: false,
          duration: 'Instantaneous',
          components: { v: true, s: true, m: true },
        };
        expect(spell.kind).toBe(ContentKind.Spell);
        expect(spell.level).toBe(3);
      });

      it('should accept optional spell properties', () => {
        const spell: SpellTag = {
          id: 'burning-hands',
          kind: ContentKind.Spell,
          title: 'Burning Hands',
          level: 1,
          school: 'Evocation',
          actionType: 'action',
          range: 'Self (15-foot cone)',
          ritual: false,
          concentration: false,
          duration: 'Instantaneous',
          components: { v: true, s: true, m: false },
          damageType: 'fire',
          saveType: 'Dexterity',
          attackRoll: false,
          grantedBy: ['Sorcerer', 'Wizard'],
          lists: ['Arcane'],
        };
        expect(spell.damageType).toBe('fire');
        expect(spell.grantedBy).toContain('Wizard');
      });
    });

    describe('MonsterTag', () => {
      it('should be assignable with all required properties', () => {
        const monster: MonsterTag = {
          id: 'ancient-red-dragon',
          kind: ContentKind.Monster,
          title: 'Ancient Red Dragon',
          cr: 24,
          size: 'Gargantuan',
          creatureType: 'Dragon',
        };
        expect(monster.kind).toBe(ContentKind.Monster);
        expect(monster.cr).toBe(24);
      });

      it('should accept optional monster properties', () => {
        const monster: MonsterTag = {
          id: 'goblin',
          kind: ContentKind.Monster,
          title: 'Goblin',
          cr: 0.25,
          size: 'Small',
          creatureType: 'Humanoid',
          alignment: 'Neutral Evil',
          environment: ['Forest', 'Hills'],
          levelRange: [1, 3],
        };
        expect(monster.alignment).toBe('Neutral Evil');
        expect(monster.environment).toContain('Forest');
        expect(monster.levelRange).toEqual([1, 3]);
      });
    });

    describe('BloodlineTag', () => {
      it('should be assignable with all required properties', () => {
        const bloodline: BloodlineTag = {
          id: 'draconic',
          kind: ContentKind.Bloodline,
          title: 'Draconic Bloodline',
          vocation: 'Sorcerer',
        };
        expect(bloodline.kind).toBe(ContentKind.Bloodline);
        expect(bloodline.vocation).toBe('Sorcerer');
      });

      it('should accept optional bloodline properties', () => {
        const bloodline: BloodlineTag = {
          id: 'wild-magic',
          kind: ContentKind.Bloodline,
          title: 'Wild Magic',
          vocation: 'Sorcerer',
          primaryAbility: 'CHA',
          theme: 'Chaos',
          originRegion: 'Damocles',
          recommendedRoles: ['Blaster', 'Support'],
        };
        expect(bloodline.primaryAbility).toBe('CHA');
        expect(bloodline.recommendedRoles).toContain('Blaster');
      });
    });

    describe('VocationTag', () => {
      it('should be assignable with all required properties', () => {
        const vocation: VocationTag = {
          id: 'Warrior',
          kind: ContentKind.Vocation,
          title: 'Warrior',
          hitDie: 'd10',
          primaryAbilities: ['STR', 'DEX'],
          saves: ['STR', 'CON'],
        };
        expect(vocation.kind).toBe(ContentKind.Vocation);
        expect(vocation.hitDie).toBe('d10');
      });

      it('should accept optional vocation properties', () => {
        const vocation: VocationTag = {
          id: 'wizard',
          kind: ContentKind.Vocation,
          title: 'Wizard',
          hitDie: 'd6',
          primaryAbilities: ['INT'],
          saves: ['INT', 'WIS'],
          armorProficiencies: [],
          weaponProficiencies: ['Dagger', 'Quarterstaff'],
          spellcastingType: 'full',
          spellListId: 'arcane',
          maxLevel: 20,
        };
        expect(vocation.spellcastingType).toBe('full');
        expect(vocation.maxLevel).toBe(20);
      });
    });
  });
});
