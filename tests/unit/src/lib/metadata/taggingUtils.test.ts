/**
 * @fileoverview Tagging Utilities Unit Tests
 * @description Tests for all tag extraction functions.
 *
 * @module tests/unit/lib/metadata/taggingUtils
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import type { SharedData } from '@scripts/metadata/sharedData';
import {
    extractAbilitySaveTags,
    extractAllTags,
    extractConditionTags,
    extractContentTypeTags,
    extractDamageTags,
    extractItemMechanicTags,
    extractLoreTags,
    extractMonsterMechanicTags,
    extractMovementTags,
    extractOrganizationalTags,
} from '@scripts/metadata/taggingUtils';
import { describe, expect, it } from 'vitest';

const MOCK_DATA: SharedData = {
  gameData: {
    damageTypes: ['fire', 'cold', 'necrotic'],
    conditions: ['poisoned', 'stunned', 'frightened'],
    abilities: [
      { short: 'str', long: 'strength' },
      { short: 'dex', long: 'dexterity' },
      { short: 'con', long: 'constitution' },
      { short: 'int', long: 'intelligence' },
      { short: 'wis', long: 'wisdom' },
      { short: 'cha', long: 'charisma' },
    ],
    sizes: [],
    creatureTypes: [],
    senses: [],
    movementTypes: ['flight', 'burrowing', 'swimming', 'climbing'],
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
  worldData: { factions: ['Order of the Flame'], locations: ['Ashvale'] },
  taxonomies: { tagCategories: [], rarityThresholds: [] },
  patterns: { regexPatterns: {} },
};

describe('extractDamageTags', () => {
  it('should extract damage type tags', () => {
    const result = extractDamageTags('deals 2d6 fire damage', MOCK_DATA);
    expect(result).toEqual(['damage:fire']);
  });

  it('should extract multiple damage types', () => {
    const result = extractDamageTags(
      'deals fire damage and cold damage',
      MOCK_DATA,
    );
    expect(result).toContain('damage:fire');
    expect(result).toContain('damage:cold');
  });

  it('should return empty array for no matches', () => {
    expect(extractDamageTags('a simple sword', MOCK_DATA)).toEqual([]);
  });
});

describe('extractConditionTags', () => {
  it('should extract condition tags', () => {
    const result = extractConditionTags(
      'the target is poisoned until',
      MOCK_DATA,
    );
    expect(result).toEqual(['condition:poisoned']);
  });

  it('should return empty array for no conditions', () => {
    expect(extractConditionTags('nothing special', MOCK_DATA)).toEqual([]);
  });
});

describe('extractAbilitySaveTags', () => {
  it('should extract ability save tags from long name', () => {
    const result = extractAbilitySaveTags(
      'DC 15 Wisdom saving throw',
      MOCK_DATA,
    );
    expect(result).toContain('mechanic:wisdom-save');
  });

  it('should extract from short name', () => {
    const result = extractAbilitySaveTags('DEX save', MOCK_DATA);
    expect(result).toContain('mechanic:dexterity-save');
  });

  it('should return empty for no saves', () => {
    expect(extractAbilitySaveTags('just text', MOCK_DATA)).toEqual([]);
  });
});

describe('extractMovementTags', () => {
  it('should extract flight tag', () => {
    const result = extractMovementTags('fly 60 ft', MOCK_DATA);
    expect(result).toContain('movement:flight');
  });

  it('should skip flight without measurement when required', () => {
    const result = extractMovementTags('it can fly', MOCK_DATA, true);
    expect(result).not.toContain('movement:flight');
  });

  it('should include flight with measurement when required', () => {
    const result = extractMovementTags('fly 60 ft', MOCK_DATA, true);
    expect(result).toContain('movement:flight');
  });

  it('should extract burrowing tag', () => {
    const result = extractMovementTags('burrow 30 ft', MOCK_DATA);
    expect(result).toContain('movement:burrowing');
  });
});

describe('extractMonsterMechanicTags', () => {
  it('should detect multiattack', () => {
    expect(extractMonsterMechanicTags('Multiattack.')).toContain(
      'mechanic:multiattack',
    );
  });

  it('should detect spellcasting', () => {
    expect(
      extractMonsterMechanicTags('This creature has spellcasting.'),
    ).toContain('mechanic:spellcasting');
  });

  it('should detect regeneration', () => {
    expect(extractMonsterMechanicTags('Regeneration.')).toContain(
      'mechanic:regeneration',
    );
  });

  it('should detect damage resistance', () => {
    expect(extractMonsterMechanicTags('resistance to fire')).toContain(
      'mechanic:damage-resistance',
    );
  });

  it('should return empty for plain text', () => {
    expect(extractMonsterMechanicTags('A small creature')).toEqual([]);
  });
});

describe('extractItemMechanicTags', () => {
  it('should detect attack bonus', () => {
    expect(extractItemMechanicTags('+1 to attack')).toContain(
      'mechanic:attack-bonus',
    );
  });

  it('should detect an accuracy bonus in canonical wording', () => {
    expect(extractItemMechanicTags('+1 accuracy bonus')).toContain(
      'mechanic:attack-bonus',
    );
  });

  it('should detect both stats in a combined accuracy and damage bonus', () => {
    const tags = extractItemMechanicTags('+4 accuracy and damage bonus');
    expect(tags).toContain('mechanic:attack-bonus');
    expect(tags).toContain('mechanic:damage-bonus');
  });

  it('should detect a damage bonus in canonical wording', () => {
    expect(extractItemMechanicTags('gains a damage bonus equal to the die')).toContain(
      'mechanic:damage-bonus',
    );
  });

  it('should detect charges', () => {
    expect(extractItemMechanicTags('This item has 3 charges')).toContain(
      'mechanic:charges',
    );
  });

  it('should detect attunement', () => {
    expect(extractItemMechanicTags('Requires attunement')).toContain(
      'property:attunement-required',
    );
  });

  it('should detect consumable', () => {
    expect(extractItemMechanicTags('becomes inert')).toContain(
      'property:consumable',
    );
  });
});

describe('extractLoreTags', () => {
  it('should extract faction tags', () => {
    const result = extractLoreTags(
      'Members of the Order of the Flame',
      ['Order of the Flame'],
      [],
    );
    expect(result).toContain('faction:order of the flame');
  });

  it('should extract location tags', () => {
    const result = extractLoreTags('Near Ashvale', [], ['Ashvale']);
    expect(result).toContain('location:ashvale');
  });

  it('should return empty for no matches', () => {
    expect(extractLoreTags('nothing here', ['Guild'], ['City'])).toEqual([]);
  });
});

describe('extractOrganizationalTags', () => {
  it('should extract category from path', () => {
    const result = extractOrganizationalTags(
      '/project/src/content/en/monsters/goblin.sheet.mdx',
      '/project',
    );
    expect(result).toContain('category:monsters');
    expect(result).toContain('locale:en');
    expect(result).toContain('source:official');
  });

  it('should extract items category', () => {
    const result = extractOrganizationalTags(
      '/project/src/content/en/items/heirlooms/sword.mdx',
      '/project',
    );
    expect(result).toContain('category:heirlooms');
  });
});

describe('extractContentTypeTags', () => {
  it('should tag sheet files', () => {
    const result = extractContentTypeTags('monster.sheet.mdx', '');
    expect(result).toContain('content:sheet');
    expect(result).toContain('content:statblock');
  });

  it('should tag monster content', () => {
    const result = extractContentTypeTags(
      'goblin.mdx',
      '**Armor Class** 13\n**Challenge Rating** 1/4',
    );
    expect(result).toContain('content:statblock');
    expect(result).toContain('content:monster');
  });

  it('should tag spell content', () => {
    const result = extractContentTypeTags(
      'fireball.mdx',
      '**Casting Time** 1 action',
    );
    expect(result).toContain('content:spell');
  });
});

describe('extractAllTags', () => {
  it('should combine and deduplicate tags', () => {
    const result = extractAllTags(
      'deals fire damage, fire damage again',
      '/project/src/content/en/monsters/goblin.sheet.mdx',
      MOCK_DATA,
      { contentType: 'monster' },
    );
    const fireCount = result.filter((t) => t === 'damage:fire').length;
    expect(fireCount).toBe(1);
  });

  it('should return sorted tags', () => {
    const result = extractAllTags(
      'deals fire damage',
      '/project/src/content/en/monsters/goblin.sheet.mdx',
      MOCK_DATA,
    );
    const sorted = [...result].sort();
    expect(result).toEqual(sorted);
  });

  it('should include lore tags when options provided', () => {
    const result = extractAllTags(
      'The Order of the Flame guards Ashvale',
      '/project/src/content/en/world/factions.mdx',
      MOCK_DATA,
      {
        factions: ['Order of the Flame'],
        locations: ['Ashvale'],
      },
    );
    expect(result).toContain('faction:order of the flame');
    expect(result).toContain('location:ashvale');
  });
});
