/**
 * @fileoverview Vocation Metadata Generator Unit Tests
 * @description Tests parseFeatureTable against vocation progression tables
 * with varying column layouts
 *
 * @module tests/unit/scripts/metadata/generateVocationMetadata.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-07
 */

import { parseFeatureTable } from '@scripts/metadata/generateVocationMetadata';
import { describe, expect, it } from 'vitest';

/**
 * Standard layout
 */
const STANDARD_TABLE = `
| Level | Tier Bonus | Features                                | Rages | Rage Damage |
| ----- | ---------- | --------------------------------------- | ----- | ----------- |
| 1     | +1         | Rage, Unarmored Defense, Weapon Mastery | 2     | +2          |
| 2     | +1         | Danger Sense, Reckless Attack           | 2     | +2          |
| 3     | +1         | Berserker Specialization                | 3     | +2          |
`;

/**
 * Extended layout
 */
const EXTENDED_TABLE_STRIDER = `
| Level | Tier Bonus | Lay of the Land | Features                                      | Prepared Spells | 1st | 2nd |
| ----- | ---------- | --------------- | --------------------------------------------- | --------------- | --- | --- |
| 1     | +1         | 3               | Spellcasting, Lay of the Land, Weapon Mastery | 2               | 2   | -   |
| 2     | +1         | 3               | Deft Explorer, Fighting Style                 | 3               | 2   | -   |
| 5     | +2         | 5               | Extra Attack, Lay of the Land                 | 6               | 4   | 2   |
`;

/**
 * Alternative header
 */
const VOCATION_FEATURES_TABLE = `
| Level | Tier Bonus | Vocation Features                  | Invocations |
| ----- | ---------- | ---------------------------------- | ----------- |
| 1     | +1         | Villein Specialization, Pact Magic | -           |
| 2     | +1         | Magical Cunning                    | 2           |
`;

/**
 * Monk-style
 */
const MONK_TABLE = `
| Level | PB | Martial Arts | Focus | Movement | Vocation Features                                    |
| ----- | -- | ------------ | ----- | -------- | ---------------------------------------------------- |
| 1     | +2 | [% 1d6 %]   | -     | -        | Martial Arts, Unarmored Defense                      |
| 2     | +2 | [% 1d6 %]   | 2     | +10 ft.  | Monk's Focus, Unarmored Movement, Uncanny Metabolism |
`;

describe('parseFeatureTable', () => {
  it('extracts features from standard layout (col 2)', () => {
    const { features, hasSpellSlots } = parseFeatureTable(STANDARD_TABLE);

    expect(features).toHaveLength(6);
    expect(features[0]).toEqual({ level: 1, name: 'Rage' });
    expect(features[1]).toEqual({ level: 1, name: 'Unarmored Defense' });
    expect(features[2]).toEqual({ level: 1, name: 'Weapon Mastery' });
    expect(features[3]).toEqual({ level: 2, name: 'Danger Sense' });
    expect(features[4]).toEqual({ level: 2, name: 'Reckless Attack' });
    expect(features[5]).toEqual({ level: 3, name: 'Berserker Specialization' });
    expect(hasSpellSlots).toBe(false);
  });

  it('extracts features from extended layout with extra pre-Features column', () => {
    const { features, hasSpellSlots } = parseFeatureTable(
      EXTENDED_TABLE_STRIDER,
    );

    expect(features).toHaveLength(7);
    expect(features[0]).toEqual({ level: 1, name: 'Spellcasting' });
    expect(features[1]).toEqual({ level: 1, name: 'Lay of the Land' });
    expect(features[2]).toEqual({ level: 1, name: 'Weapon Mastery' });
    expect(features[3]).toEqual({ level: 2, name: 'Deft Explorer' });
    expect(features[4]).toEqual({ level: 2, name: 'Fighting Style' });
    expect(features[5]).toEqual({ level: 5, name: 'Extra Attack' });
    expect(features[6]).toEqual({ level: 5, name: 'Lay of the Land' });
    expect(hasSpellSlots).toBe(true);

    const numericOnlyNames = features.filter((f) => /^\d+$/.test(f.name));
    expect(numericOnlyNames).toHaveLength(0);
  });

  it('extracts features from "Vocation Features" header variant', () => {
    const { features } = parseFeatureTable(VOCATION_FEATURES_TABLE);

    expect(features).toHaveLength(3);
    expect(features[0]).toEqual({
      level: 1,
      name: 'Villein Specialization',
    });
    expect(features[1]).toEqual({ level: 1, name: 'Pact Magic' });
    expect(features[2]).toEqual({ level: 2, name: 'Magical Cunning' });
  });

  it('extracts features from multi-column Monk layout', () => {
    const { features } = parseFeatureTable(MONK_TABLE);

    expect(features).toHaveLength(5);
    expect(features[0]).toEqual({ level: 1, name: 'Martial Arts' });
    expect(features[1]).toEqual({ level: 1, name: 'Unarmored Defense' });
    expect(features[2]).toEqual({ level: 2, name: "Monk's Focus" });
    expect(features[3]).toEqual({ level: 2, name: 'Unarmored Movement' });
    expect(features[4]).toEqual({ level: 2, name: 'Uncanny Metabolism' });

    const diceNames = features.filter((f) => /\[%/.test(f.name));
    expect(diceNames).toHaveLength(0);
  });

  it('falls back to column 2 when no Features header found', () => {
    const legacyTable = `
| Level | Tier Bonus | Stuff                                   | Extra |
| ----- | ---------- | --------------------------------------- | ----- |
| 1     | +1         | Rage, Unarmored Defense                 | 2     |
| 2     | +1         | Danger Sense                            | 2     |
`;
    const { features } = parseFeatureTable(legacyTable);

    expect(features).toHaveLength(3);
    expect(features[0]).toEqual({ level: 1, name: 'Rage' });
    expect(features[1]).toEqual({ level: 1, name: 'Unarmored Defense' });
    expect(features[2]).toEqual({ level: 2, name: 'Danger Sense' });
  });

  it('skips placeholder values (dash, em-dash)', () => {
    const tableWithDashes = `
| Level | Tier Bonus | Features    |
| ----- | ---------- | ----------- |
| 1     | +1         | Feature A   |
| 2     | +1         | -           |
| 3     | +1         | –           |
| 4     | +1         | \\-         |
| 5     | +1         | Feature E   |
`;
    const { features } = parseFeatureTable(tableWithDashes);

    expect(features).toHaveLength(2);
    expect(features[0]).toEqual({ level: 1, name: 'Feature A' });
    expect(features[1]).toEqual({ level: 5, name: 'Feature E' });
  });
});
