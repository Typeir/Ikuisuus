/**
 * @fileoverview Validation Utilities Unit Tests
 * @description Tests for tag validation, CR-to-rarity mapping, and metadata schema checks.
 *
 * @module tests/unit/lib/metadata/validationUtils
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import type { SharedData } from '@/lib/metadata/sharedData';
import {
    getRarityFromCR,
    validateMetadata,
    validateTag,
} from '@/lib/metadata/validationUtils';
import { describe, expect, it } from 'vitest';

const MOCK_DATA: SharedData = {
  gameData: {
    damageTypes: ['fire', 'cold', 'necrotic'],
    conditions: ['poisoned', 'stunned'],
    abilities: [
      { short: 'str', long: 'strength' },
      { short: 'dex', long: 'dexterity' },
      { short: 'con', long: 'constitution' },
      { short: 'int', long: 'intelligence' },
      { short: 'wis', long: 'wisdom' },
      { short: 'cha', long: 'charisma' },
    ],
    sizes: ['small', 'medium', 'large'],
    creatureTypes: ['humanoid', 'undead', 'dragon'],
    senses: [],
    movementTypes: [],
    mechanicTypes: [],
  },
  itemData: {
    rarities: [],
    baseCategoryTypes: [],
    itemTypes: [],
    weaponTypes: [],
    armorTypes: [],
    clothingTypes: [],
    weaponProperties: [],
    masteryProperties: [],
  },
  spellData: { schools: [], qualities: [] },
  worldData: {
    factions: ['Order of the Flame'],
    locations: ['Ashvale'],
    themes: [],
  },
  taxonomies: {
    tagCategories: [
      'damage',
      'condition',
      'creature',
      'size',
      'faction',
      'location',
      'mechanic',
      'category',
    ],
    rarityThresholds: [
      { minCR: 17, tag: 'rarity:legendary' },
      { minCR: 11, tag: 'rarity:very-rare' },
      { minCR: 5, tag: 'rarity:rare' },
      { minCR: 0, tag: 'rarity:common' },
    ],
  },
  patterns: { regexPatterns: {} },
};

describe('validateTag', () => {
  it('should validate known damage tag', () => {
    expect(validateTag('damage:fire', MOCK_DATA)).toBe(true);
  });

  it('should reject unknown damage type', () => {
    expect(validateTag('damage:psychic', MOCK_DATA)).toBe(false);
  });

  it('should validate condition tag', () => {
    expect(validateTag('condition:poisoned', MOCK_DATA)).toBe(true);
  });

  it('should reject unknown condition', () => {
    expect(validateTag('condition:petrified', MOCK_DATA)).toBe(false);
  });

  it('should validate creature type tag', () => {
    expect(validateTag('creature:undead', MOCK_DATA)).toBe(true);
  });

  it('should reject unknown creature type', () => {
    expect(validateTag('creature:aberration', MOCK_DATA)).toBe(false);
  });

  it('should validate size tag', () => {
    expect(validateTag('size:large', MOCK_DATA)).toBe(true);
  });

  it('should validate faction tag', () => {
    expect(validateTag('faction:Order of the Flame', MOCK_DATA)).toBe(true);
  });

  it('should validate location tag', () => {
    expect(validateTag('location:Ashvale', MOCK_DATA)).toBe(true);
  });

  it('should accept mechanic tags without value check', () => {
    expect(validateTag('mechanic:multiattack', MOCK_DATA)).toBe(true);
  });

  it('should reject tags without colon separator', () => {
    expect(validateTag('invalidtag', MOCK_DATA)).toBe(false);
  });

  it('should reject unknown category', () => {
    expect(validateTag('unknown:value', MOCK_DATA)).toBe(false);
  });
});

describe('getRarityFromCR', () => {
  it('should assign common for low CR', () => {
    expect(getRarityFromCR(1, MOCK_DATA)).toBe('rarity:common');
  });

  it('should assign rare for mid CR', () => {
    expect(getRarityFromCR(5, MOCK_DATA)).toBe('rarity:rare');
  });

  it('should assign very rare for high CR', () => {
    expect(getRarityFromCR(11, MOCK_DATA)).toBe('rarity:very-rare');
  });

  it('should assign legendary for top CR', () => {
    expect(getRarityFromCR(17, MOCK_DATA)).toBe('rarity:legendary');
  });

  it('should parse string CR', () => {
    expect(getRarityFromCR('0.25', MOCK_DATA)).toBe('rarity:common');
  });

  it('should handle CR 0', () => {
    expect(getRarityFromCR(0, MOCK_DATA)).toBe('rarity:common');
  });
});

describe('validateMetadata', () => {
  it('should pass valid monster metadata', () => {
    const result = validateMetadata(
      {
        slug: 'goblin',
        title: 'Goblin',
        creatureType: 'humanoid',
        cr: '1/4',
        tags: ['damage:fire'],
      },
      'monster',
      MOCK_DATA,
    );
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should fail on missing slug', () => {
    const result = validateMetadata(
      { title: 'Goblin', creatureType: 'humanoid', cr: '1' },
      'monster',
      MOCK_DATA,
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing or invalid slug');
  });

  it('should fail on missing title', () => {
    const result = validateMetadata(
      { slug: 'goblin', creatureType: 'humanoid', cr: '1' },
      'monster',
      MOCK_DATA,
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing or invalid title');
  });

  it('should fail on missing creature type for monsters', () => {
    const result = validateMetadata(
      { slug: 'goblin', title: 'Goblin', cr: '1' },
      'monster',
      MOCK_DATA,
    );
    expect(result.errors).toContain('Missing creature type');
  });

  it('should fail on missing CR for monsters', () => {
    const result = validateMetadata(
      { slug: 'goblin', title: 'Goblin', creatureType: 'humanoid' },
      'monster',
      MOCK_DATA,
    );
    expect(result.errors).toContain('Missing challenge rating');
  });

  it('should fail on missing rarity for heirlooms', () => {
    const result = validateMetadata(
      { slug: 'sword', title: 'Sword', itemType: 'weapon' },
      'heirloom',
      MOCK_DATA,
    );
    expect(result.errors).toContain('Missing rarity');
  });

  it('should fail on missing item type for heirlooms', () => {
    const result = validateMetadata(
      { slug: 'sword', title: 'Sword', rarity: 'rare' },
      'heirloom',
      MOCK_DATA,
    );
    expect(result.errors).toContain('Missing item type');
  });

  it('should fail on missing level for spells', () => {
    const result = validateMetadata(
      { slug: 'fireball', title: 'Fireball' },
      'spell',
      MOCK_DATA,
    );
    expect(result.errors).toContain('Missing spell level');
  });

  it('should report invalid tags', () => {
    const result = validateMetadata(
      {
        slug: 'test',
        title: 'Test',
        tags: ['damage:psychic'],
        creatureType: 'humanoid',
        cr: '1',
      },
      'monster',
      MOCK_DATA,
    );
    expect(result.errors).toContain('Invalid tag: damage:psychic');
  });

  it('should flag non-array tags', () => {
    const result = validateMetadata(
      {
        slug: 'test',
        title: 'Test',
        tags: 'not-an-array',
        creatureType: 'humanoid',
        cr: '1',
      },
      'monster',
      MOCK_DATA,
    );
    expect(result.errors).toContain('Tags must be an array');
  });
});
