/**
 * @fileoverview Vocation parser unit tests.
 * @description Covers core traits parsing, proficiency splits and the feature
 * progression table reader extracted from the vocation metadata generator.
 *
 * @module tests/unit/scripts/metadata/vocationParsers.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-07
 */

import {
  parseCoreTraits,
  parseFeatureTable,
  parseFixedTrades,
  parseHitDie,
  parseProficiencies,
  parseSavingThrows,
  parseSkillProficiencies,
} from '@scripts/metadata/vocationParsers';
import { describe, expect, it } from 'vitest';

const CORE_TRAITS = `
| Core Rogue Traits                |
| -------------------------------- |
| **Primary Ability** | Dexterity  |
| **Hit Point Die**   | d8         |
| **Saving Throw Proficiencies** | Dexterity and Intelligence |
| **Weapon Proficiencies** | Simple weapons |

## Features
`;

const FEATURE_TABLE = `
| Level | Tier Bonus | Features                                | Rages |
| ----- | ---------- | --------------------------------------- | ----- |
| 1     | +1         | Rage, Unarmored Defense, Weapon Mastery | 2     |
| 2     | +1         | Danger Sense, Reckless Attack           | 2     |
| 3     | +1         | -                                       | 3     |
`;

describe('parseCoreTraits', () => {
  it('reads the core traits table into a key/value map', () => {
    expect(parseCoreTraits(CORE_TRAITS)).toEqual({
      'Primary Ability': 'Dexterity',
      'Hit Point Die': 'd8',
      'Saving Throw Proficiencies': 'Dexterity and Intelligence',
      'Weapon Proficiencies': 'Simple weapons',
    });
  });

  it('returns an empty map for prose without a traits table', () => {
    expect(parseCoreTraits('No table here.')).toEqual({});
  });
});

describe('parseHitDie', () => {
  it('extracts the face count from hit die text', () => {
    expect(parseHitDie('d12 per Berserker level')).toBe(12);
    expect(parseHitDie('d8')).toBe(8);
  });

  it('returns 0 when no die is declared', () => {
    expect(parseHitDie('')).toBe(0);
    expect(parseHitDie('No die here.')).toBe(0);
  });
});

describe('parseSavingThrows', () => {
  it('splits bold-wrapped ability lists', () => {
    expect(parseSavingThrows('**Strength** and Constitution')).toEqual([
      'Strength',
      'Constitution',
    ]);
    expect(parseSavingThrows('Dexterity, Wisdom')).toEqual([
      'Dexterity',
      'Wisdom',
    ]);
  });
});

describe('parseSkillProficiencies', () => {
  it('reads the pick count and choices from choose phrasing', () => {
    expect(
      parseSkillProficiencies('Choose 2: Animal Handling, Athletics, Insight'),
    ).toEqual({
      count: 2,
      choices: ['Animal Handling', 'Athletics', 'Insight'],
    });
  });

  it('accepts spelled-out counts and or-joined options', () => {
    expect(
      parseSkillProficiencies('Pick any three: Acrobatics or Stealth'),
    ).toEqual({ count: 3, choices: ['Acrobatics', 'Stealth'] });
  });

  it('defaults to two picks when the value has no colon', () => {
    expect(parseSkillProficiencies('Animal Handling, Athletics')).toEqual({
      count: 2,
      choices: [],
    });
  });
});

describe('parseProficiencies', () => {
  it('splits and-joined proficiency lists', () => {
    expect(parseProficiencies('Light armor, Shields')).toEqual([
      'Light armor',
      'Shields',
    ]);
  });

  it('returns an empty list for none', () => {
    expect(parseProficiencies('None')).toEqual([]);
    expect(parseProficiencies('')).toEqual([]);
  });
});

describe('parseFixedTrades', () => {
  it('extracts tool link names and drops non-tool links', () => {
    const value =
      '[_Tinkers Kit_](/en/library/items/tools/tinkering) and [_Electricians Kit_](/en/library/items/tools/electrics) or [_Rope_](/en/library/items/trinkets/rope)';
    expect(parseFixedTrades(value)).toEqual([
      '_Tinkers Kit_',
      '_Electricians Kit_',
    ]);
  });

  it('dedupes repeated tool links', () => {
    const value =
      '[_Tinkers Kit_](/en/library/items/tools/tinkering), [_Tinkers Kit_](/en/library/items/tools/tinkering)';
    expect(parseFixedTrades(value)).toEqual(['_Tinkers Kit_']);
  });
});

describe('parseFeatureTable', () => {
  it('extracts features from a standard layout and skips placeholder rows', () => {
    const { features, hasSpellSlots } = parseFeatureTable(FEATURE_TABLE);

    expect(features).toHaveLength(5);
    expect(features[0]).toEqual({ level: 1, name: 'Rage' });
    expect(features[3]).toEqual({ level: 2, name: 'Danger Sense' });
    expect(features[4]).toEqual({ level: 2, name: 'Reckless Attack' });
    expect(hasSpellSlots).toBe(false);
  });
});
