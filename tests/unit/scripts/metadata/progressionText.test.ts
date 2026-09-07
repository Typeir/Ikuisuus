/**
 * @fileoverview Tests for reading a progression block out of page text.
 *
 * @module tests/unit/scripts/metadata/progressionText.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-06
 */

import { pageFeatureHeadings, progressionFromText } from '@scripts/metadata/progressionText';
import { describe, expect, it } from 'vitest';

const PAGE = `# Rogue

<Vocation hitDie="d8">

## Rogue Progression

<Progression casting="third" feats="4, 8" specialization="Specialization: 9">
  <Column label="Features">
    <Row at="6" unique>**Expertise**</Row>
  </Column>
  <Column label="Sneak Attack">
    <Row at="1">[% 1d6 %]</Row>
    <Row at="3">[% 2d6 %]</Row>
  </Column>
  <Column label="Abandon" values="12, 14, 18" />
</Progression>

<Feature level="1">

## Expertise

Choose two.

</Feature>

<Feature level="3">

## Steady Aim

</Feature>

## 19th Level – Epic Boon

</Vocation>
`;

describe('pageFeatureHeadings', () => {
  it('reads both the block form and the level-heading form, in page order', () => {
    expect(pageFeatureHeadings(PAGE.split('\n'))).toEqual([
      { level: 1, name: 'Expertise' },
      { level: 3, name: 'Steady Aim' },
      { level: 19, name: 'Epic Boon' },
    ]);
  });
});

describe('progressionFromText', () => {
  it('returns the features by level, the headers and the slot flag the table parser returned', () => {
    const reading = progressionFromText(PAGE)!;
    expect(reading.hasSpellSlots).toBe(true);
    expect(reading.headers).toEqual(['Level', 'Tier Bonus', 'Features', 'Sneak Attack', 'Abandon', '1st', '2nd', '3rd', '4th']);
    expect(reading.features).toEqual([
      { level: 1, name: 'Expertise' },
      { level: 3, name: 'Steady Aim' },
      { level: 4, name: 'Feat' },
      { level: 6, name: 'Expertise' },
      { level: 8, name: 'Feat' },
      { level: 9, name: 'Specialization Feature' },
      { level: 19, name: 'Epic Boon' },
    ]);
  });

  it('reads a self-closing block and returns null without one', () => {
    const reading = progressionFromText('# X\n\n<Progression casting="full" levels="2" />\n')!;
    expect(reading.headers).toEqual(['Level', 'Tier Bonus', 'Features', '1st']);
    expect(reading.features).toEqual([]);
    expect(progressionFromText('# X\n\n| Level | Features |\n')).toBeNull();
  });
});
