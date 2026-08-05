/**
 * @fileoverview Parsing Utilities Unit Tests
 * @description Tests for MDX content parsing functions.
 *
 * @module tests/unit/lib/metadata/parsingUtils
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import {
    parseCharges,
    parseDamageTypesDealt,
    parseKeyBullets,
    parseNumericValue,
    parseProperties,
    parseRange,
    parseSavingThrowTypes,
    parseTitle,
    parseWeight,
    splitList,
    splitListWithGrouping,
} from '@scripts/metadata/parsingUtils';
import type { SharedData } from '@scripts/metadata/sharedData';
import { describe, expect, it } from 'vitest';

const MOCK_DATA: SharedData = {
  gameData: {
    damageTypes: ['fire', 'cold', 'necrotic', 'radiant'],
    conditions: [],
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
  worldData: { factions: [], locations: [], themes: [] },
  taxonomies: { tagCategories: [], rarityThresholds: [] },
  patterns: { regexPatterns: {} },
};

describe('parseTitle', () => {
  it('should extract title from H1 heading', () => {
    expect(parseTitle(['# Goblin', '', 'Some text'])).toBe('Goblin');
  });

  /**
   * A title is atomic plaintext. It reaches the browser tab, `og:title` and a
   * search key, none of which render markdown — the asterisks were shown to the
   * reader verbatim.
   */
  it('should strip markdown from title', () => {
    expect(parseTitle(['# **Bold Title**'])).toBe('Bold Title');
    expect(parseTitle(['# Ballista _(Loading)_'])).toBe('Ballista (Loading)');
  });

  /** A link in a title keeps its label and loses its target. */
  it('should reduce a markdown link to its label', () => {
    expect(parseTitle(['# See [Cerithol](/en/library/monsters/cerithol)'])).toBe(
      'See Cerithol',
    );
  });

  /** Authoring macros are not plaintext either. */
  it('should strip a unit macro from a title', () => {
    expect(parseTitle(['# Rope ([= 10 stride =])'])).toBe('Rope (10 stride)');
  });

  it('should return empty string when no H1 found', () => {
    expect(parseTitle(['## Not H1', 'text'])).toBe('');
  });

  it('should find first H1 in multiple lines', () => {
    expect(parseTitle(['text', '# Title Here', '# Second'])).toBe('Title Here');
  });
});

describe('parseProperties', () => {
  it('should parse properties from Properties section', () => {
    const text = `## Properties\n- **Weight**: 3 lbs\n- **Range**: 60 ft\n`;
    const result = parseProperties(text);
    expect(result).toBeDefined();
    expect(result!.Weight).toBe('3 lbs');
    expect(result!.Range).toBe('60 ft');
  });

  it('should return undefined when no Properties section exists', () => {
    expect(
      parseProperties('Just some text without properties'),
    ).toBeUndefined();
  });

  it('should handle Weapon Properties section header', () => {
    const text = `## Weapon Properties\n- **Damage**: 1d8\n`;
    const result = parseProperties(text);
    expect(result).toBeDefined();
    expect(result!.Damage).toBe('1d8');
  });
});

describe('parseWeight', () => {
  /**
   * Weight is answered in burden, whatever unit the source used. The imperial
   * pattern this once relied on never matched `[= 2 burden =]`, so every
   * heirloom in the corpus came back with no weight at all while the lone item
   * written in pounds came back in pounds.
   */
  it('should read the native expression the corpus actually uses', () => {
    expect(parseWeight({ Weight: '[= 2 burden =]' })).toBe('2 burden');
  });

  it('should convert an imperial weight into burden', () => {
    expect(parseWeight({ Weight: '3 lbs' })).toBe('3/2 burden');
  });

  it('should convert a singular pound into burden', () => {
    expect(parseWeight({ Weight: '1 lb' })).toBe('1/2 burden');
  });

  it('should return undefined for missing Weight', () => {
    expect(parseWeight({ Range: '60 ft' })).toBeUndefined();
  });

  it('should return undefined for undefined properties', () => {
    expect(parseWeight(undefined)).toBeUndefined();
  });
});

describe('parseRange', () => {
  /** Stored ranges carry the measurement, never the syntax that expressed it. */
  it('should unwrap an authoring expression', () => {
    expect(parseRange({ Range: '[= 12 stride =]' })).toBe('12 stride');
  });

  it('should convert an imperial range into strides', () => {
    expect(parseRange({ Range: '60 ft' })).toBe('12 stride');
  });

  it('should fall back to Reach when Range is missing', () => {
    expect(parseRange({ Reach: '10 ft' })).toBe('2 stride');
  });

  it('should return undefined when neither exists', () => {
    expect(parseRange({ Weight: '3 lbs' })).toBeUndefined();
  });

  it('should return undefined for undefined properties', () => {
    expect(parseRange(undefined)).toBeUndefined();
  });
});

describe('parseNumericValue', () => {
  it('should parse simple number', () => {
    expect(parseNumericValue('42')).toBe(42);
  });

  it('should parse comma-separated number', () => {
    expect(parseNumericValue('1,650')).toBe(1650);
  });

  it('should return undefined for non-numeric', () => {
    expect(parseNumericValue('abc')).toBeUndefined();
  });

  it('should return undefined for undefined input', () => {
    expect(parseNumericValue(undefined)).toBeUndefined();
  });
});

describe('parseCharges', () => {
  it('should parse initial charges', () => {
    const result = parseCharges('This item holds 10 charges');
    expect(result).toBeDefined();
    expect(result!.initial).toBe('10');
  });

  it('should detect depleting items', () => {
    const result = parseCharges(
      'This item holds 3 charges and becomes inert when all are spent',
    );
    expect(result).toBeDefined();
    expect(result!.depletes).toBe(true);
  });

  it('should return undefined when no charges info found', () => {
    expect(parseCharges('Just a normal sword')).toBeUndefined();
  });

  it('should parse recharge info', () => {
    const result = parseCharges(
      'This item holds 7 charges and regains 1d6 charges at dawn',
    );
    expect(result).toBeDefined();
    expect(result!.initial).toBe('7');
    expect(result!.recharge).toBe('1d6 at dawn');
  });
});

describe('parseDamageTypesDealt', () => {
  it('should detect fire damage', () => {
    const result = parseDamageTypesDealt(
      'deals 2d6 fire damage to the target',
      MOCK_DATA,
    );
    expect(result).toContain('fire');
  });

  it('should detect multiple damage types', () => {
    const text = 'deals 1d8 fire damage and additional 1d6 cold damage';
    const result = parseDamageTypesDealt(text, MOCK_DATA);
    expect(result).toContain('fire');
    expect(result).toContain('cold');
  });

  it('should return undefined when no damage dealt', () => {
    expect(
      parseDamageTypesDealt('A simple description without damage', MOCK_DATA),
    ).toBeUndefined();
  });
});

describe('parseSavingThrowTypes', () => {
  it('should detect Wisdom saving throw', () => {
    const result = parseSavingThrowTypes(
      'DC 14 Wisdom saving throw',
      MOCK_DATA,
    );
    expect(result).toContain('Wisdom');
  });

  it('should detect multiple save types', () => {
    const text = 'Dexterity saving throw or a Strength saving throw';
    const result = parseSavingThrowTypes(text, MOCK_DATA);
    expect(result).toContain('Dexterity');
    expect(result).toContain('Strength');
  });

  it('should return undefined when no saves found', () => {
    expect(parseSavingThrowTypes('No saves here', MOCK_DATA)).toBeUndefined();
  });
});

describe('parseKeyBullets', () => {
  it('should parse key-value bullet points', () => {
    const text = '- **Damage**: 1d8\n- **Type**: Slashing\n';
    const result = parseKeyBullets(text);
    expect(result.Damage).toBe('1d8');
    expect(result.Type).toBe('Slashing');
  });

  it('should return empty object for non-matching input', () => {
    expect(parseKeyBullets('just text')).toEqual({});
  });
});

describe('splitList', () => {
  it('should split comma-separated list', () => {
    expect(splitList('fire, cold, necrotic')).toEqual([
      'fire',
      'cold',
      'necrotic',
    ]);
  });

  it('should return empty array for "none"', () => {
    expect(splitList('none')).toEqual([]);
  });

  it('should return empty array for em-dash', () => {
    expect(splitList('—')).toEqual([]);
  });

  it('should return empty array for empty string', () => {
    expect(splitList('')).toEqual([]);
  });

  it('should strip markdown from items', () => {
    expect(splitList('**fire**, **cold**')).toEqual(['fire', 'cold']);
  });
});

describe('splitListWithGrouping', () => {
  it('should handle simple list without groups', () => {
    expect(splitListWithGrouping('a, b, c', /\(.*?\)/)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('should return empty for "none"', () => {
    expect(splitListWithGrouping('none', /\(.*?\)/)).toEqual([]);
  });
});
