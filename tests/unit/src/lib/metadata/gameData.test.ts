/**
 * @fileoverview Game Data Accessor Unit Tests
 * @description Tests for GameData and ItemData static accessor classes.
 *
 * @module tests/unit/lib/metadata/gameData
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { GameData, ItemData } from '@/lib/metadata/gameData';
import type { SharedData } from '@/lib/metadata/sharedData';
import { describe, expect, it } from 'vitest';

const MOCK_SHARED_DATA: SharedData = {
  gameData: {
    damageTypes: ['fire', 'cold', 'necrotic'],
    conditions: ['blinded', 'charmed', 'stunned'],
    abilities: [
      { short: 'str', long: 'strength' },
      { short: 'dex', long: 'dexterity' },
      { short: 'con', long: 'constitution' },
      { short: 'int', long: 'intelligence' },
      { short: 'wis', long: 'wisdom' },
      { short: 'cha', long: 'charisma' },
    ],
    sizes: ['tiny', 'small', 'medium', 'large'],
    creatureTypes: ['undead', 'humanoid', 'beast'],
    senses: ['darkvision', 'blindsight'],
    movementTypes: ['flight', 'swimming'],
    mechanicTypes: ['spellcasting', 'charges'],
  },
  itemData: {
    rarities: ['common', 'uncommon', 'rare', 'legendary'],
    baseCategoryTypes: ['weapon', 'armor'],
    itemTypes: ['weapon', 'armor', 'shield', 'wand', 'staff'],
    weaponTypes: ['sword', 'axe', 'bow'],
    armorTypes: ['plate', 'chainmail'],
    clothingTypes: ['cloak', 'robe'],
    weaponProperties: ['finesse', 'light', 'heavy'],
    masteryProperties: ['cleave', 'graze'],
  },
  spellData: { schools: ['Evocation'], qualities: ['Legendary'] },
  worldData: {
    factions: ['hiisi'],
    locations: ['damocles'],
    themes: ['cosmic horror'],
  },
  taxonomies: {
    tagCategories: ['damage', 'condition'],
    rarityThresholds: [{ minCR: 17, tag: 'rarity:legendary' }],
  },
  patterns: { regexPatterns: {} },
};

describe('GameData', () => {
  it('should return damage types', () => {
    expect(GameData.getDamageTypes(MOCK_SHARED_DATA)).toEqual([
      'fire',
      'cold',
      'necrotic',
    ]);
  });

  it('should return conditions', () => {
    expect(GameData.getConditions(MOCK_SHARED_DATA)).toEqual([
      'blinded',
      'charmed',
      'stunned',
    ]);
  });

  it('should return abilities', () => {
    const abilities = GameData.getAbilities(MOCK_SHARED_DATA);
    expect(abilities).toHaveLength(6);
    expect(abilities[0].short).toBe('str');
  });

  it('should return sizes', () => {
    expect(GameData.getSizes(MOCK_SHARED_DATA)).toContain('medium');
  });

  it('should return creature types', () => {
    expect(GameData.getCreatureTypes(MOCK_SHARED_DATA)).toContain('undead');
  });

  it('should return senses', () => {
    expect(GameData.getSenses(MOCK_SHARED_DATA)).toContain('darkvision');
  });

  it('should return movement types', () => {
    expect(GameData.getMovementTypes(MOCK_SHARED_DATA)).toContain('flight');
  });

  it('should return mechanic types', () => {
    expect(GameData.getMechanicTypes(MOCK_SHARED_DATA)).toContain(
      'spellcasting',
    );
  });
});

describe('ItemData', () => {
  it('should return rarities', () => {
    expect(ItemData.getRarities(MOCK_SHARED_DATA)).toContain('rare');
  });

  it('should return item types', () => {
    expect(ItemData.getItemTypes(MOCK_SHARED_DATA)).toContain('wand');
  });

  it('should return weapon properties', () => {
    expect(ItemData.getWeaponProperties(MOCK_SHARED_DATA)).toContain('finesse');
  });

  it('should return mastery properties', () => {
    expect(ItemData.getMasteryProperties(MOCK_SHARED_DATA)).toContain('cleave');
  });

  it('should return weapon types', () => {
    expect(ItemData.getWeaponTypes(MOCK_SHARED_DATA)).toContain('sword');
  });

  it('should return armor types', () => {
    expect(ItemData.getArmorTypes(MOCK_SHARED_DATA)).toContain('plate');
  });

  it('should return clothing types', () => {
    expect(ItemData.getClothingTypes(MOCK_SHARED_DATA)).toContain('cloak');
  });

  it('should return base category types', () => {
    expect(ItemData.getBaseCategoryTypes(MOCK_SHARED_DATA)).toContain('weapon');
  });

  describe('detectItemType', () => {
    it('should detect weapon from italic line', () => {
      const lines = ['# Flamekeeper', '_Weapon (longsword), rare_', '---'];
      expect(ItemData.detectItemType(lines, MOCK_SHARED_DATA)).toBe('weapon');
    });

    it('should detect armor from italic line', () => {
      const lines = ['# Shield of Faith', '_Armor (shield), uncommon_', '---'];
      expect(ItemData.detectItemType(lines, MOCK_SHARED_DATA)).toBe('armor');
    });

    it('should detect from Type property', () => {
      const lines = [
        '# Magic Wand',
        '',
        '- **Type**: Wand',
        '- **Rarity**: uncommon',
      ];
      expect(ItemData.detectItemType(lines, MOCK_SHARED_DATA)).toBe('wand');
    });

    it('should return undefined when no type detected', () => {
      const lines = ['# Unknown Item', '', 'Some description text.'];
      expect(ItemData.detectItemType(lines, MOCK_SHARED_DATA)).toBeUndefined();
    });
  });
});
