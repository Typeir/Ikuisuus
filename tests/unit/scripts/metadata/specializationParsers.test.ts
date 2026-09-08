/**
 * @fileoverview Specialization parser unit tests.
 * @description Covers level-heading feature ranges, always-prepared spell
 * tables and specialization spellcasting detection.
 *
 * @module tests/unit/scripts/metadata/specializationParsers.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-07
 */

import {
  parseAlwaysPreparedSpells,
  parseFeatures,
  parseSpecializationSpellcasting,
} from '@scripts/metadata/specializationParsers';
import { describe, expect, it } from 'vitest';

const FEATURES_SOURCE = `# Arcane Trickster

## 3rd Level – Cunning Spellcasting

You cast.

### Sleight

## 3rd Level – Steady Aim

Aim.
`;

const PREPARED_SOURCE = `
## 3rd Level – Domain Spells

| Level | Spells |
| ----- | ------ |
| 3     | [Fireball](/en/library/spells/fireball), [Haste](/en/library/spells/haste) |
`;

describe('parseFeatures', () => {
  it('reads level headings with their 1-indexed line ranges', () => {
    const features = parseFeatures(FEATURES_SOURCE);

    expect(features).toHaveLength(2);
    expect(features[0]).toEqual({
      level: 3,
      name: 'Cunning Spellcasting',
      heading: '3rd Level – Cunning Spellcasting',
      startLine: 3,
      endLine: 7,
    });
    expect(features[1]).toEqual({
      level: 3,
      name: 'Steady Aim',
      heading: '3rd Level – Steady Aim',
      startLine: 9,
      endLine: 11,
    });
  });

  it('returns an empty list without level headings', () => {
    expect(parseFeatures('# Bare\n\nNo headings.\n')).toEqual([]);
  });
});

describe('parseAlwaysPreparedSpells', () => {
  it('reads the level-spells table when the prepared keyword is present', () => {
    expect(parseAlwaysPreparedSpells(PREPARED_SOURCE)).toEqual([
      { level: 3, spells: ['Fireball', 'Haste'] },
    ]);
  });

  it('returns undefined without the always-prepared keyword', () => {
    expect(
      parseAlwaysPreparedSpells('# Fighter\n\nNo table.\n'),
    ).toBeUndefined();
  });
});

describe('parseSpecializationSpellcasting', () => {
  const THIRD_CASTER = `
## Spellcasting

Spell save DC uses your Charisma modifier.

| Level | 1st | 2nd | 3rd |
| ----- | --- | --- | --- |
| 5     | 4   | 2   | -   |
`;

  it('detects ability and third-caster progression from the slot table', () => {
    expect(parseSpecializationSpellcasting(THIRD_CASTER)).toEqual({
      ability: 'Charisma',
      progression: 'Third',
    });
  });

  it('detects full progression from 9th-level slots', () => {
    const full = `
## Arcane Trickster

casting ability is Intelligence

| Level | 8th | 9th |
| ----- | --- | --- |
| 17    | 1   | 1   |
`;
    expect(parseSpecializationSpellcasting(full)).toEqual({
      ability: 'Intelligence',
      progression: 'Full',
    });
  });

  it('returns undefined without a spellcasting heading or slot table', () => {
    expect(
      parseSpecializationSpellcasting('# Fighter\n\nNo magic.\n'),
    ).toBeUndefined();
    expect(
      parseSpecializationSpellcasting('## Spellcasting\n\nNo table yet.\n'),
    ).toBeUndefined();
  });
});
