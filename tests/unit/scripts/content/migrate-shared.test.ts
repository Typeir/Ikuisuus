/**
 * @fileoverview Tests for the helpers the content-v2 converters share.
 * @description Tag printing, heading parentheticals and the small line
 * utilities, each pinned by the shapes the corpus actually writes.
 *
 * @module tests/unit/scripts/content/migrate-shared.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-05
 */

import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  attribute,
  collapseBlank,
  frontmatterEnd,
  headingSlots,
  openingTag,
  resolveFiles,
  titleOf,
  trimBlank,
} from '../../../../scripts/content/migrate-shared.mjs';

describe('attribute', () => {
  it('double-quotes by default and single-quotes a value holding a double quote', () => {
    expect(attribute('range', '30/60')).toBe('range="30/60"');
    expect(attribute('note', 'a "quoted" word')).toBe(`note='a "quoted" word'`);
  });

  it('prints a true value as a bare flag', () => {
    expect(attribute('repeatable', true)).toBe('repeatable');
  });
});

describe('openingTag', () => {
  it('prints an empty tag, a one-attribute tag and a multi-line tag', () => {
    expect(openingTag('Feat', {})).toEqual(['<Feat>']);
    expect(openingTag('Feat', { repeatable: true })).toEqual(['<Feat repeatable>']);
    expect(openingTag('Spell', { level: '3', ritual: true, range: 'Touch' })).toEqual([
      '<Spell',
      '  level="3"',
      '  ritual',
      '  range="Touch">',
    ]);
  });

  it('skips undefined values', () => {
    expect(openingTag('Trinket', { category: undefined, damage: '—' })).toEqual([
      '<Trinket damage="—">',
    ]);
  });
});

describe('headingSlots', () => {
  it.each([
    ['Bite (Recharge 5–6)', 'Bite', { recharge: '5–6' }],
    ['Reposition (Costs 1 Deed)', 'Reposition', { cost: '1 Deed' }],
    ['Mutually Assured Destruction (Costs 2 Deeds)', 'Mutually Assured Destruction', { cost: '2 Deeds' }],
    ['Legendary Deed: Resist (3/Repose)', 'Legendary Deed: Resist', { charges: '3/Repose' }],
    ['Shove (Minor Action)', 'Shove', { cost: '1 Minor Action' }],
    ['Parry (Reaction)', 'Parry', { cost: '1 Reaction' }],
    ['Faterender Railgun (Recharge 6) (Costs 1 Deed)', 'Faterender Railgun', { recharge: '6', cost: '1 Deed' }],
  ])('lifts "%s"', (title, rest, slots) => {
    expect(headingSlots(title)).toEqual({ title: rest, slots });
  });

  it.each([
    'Digestive Maw (Concentration)',
    'Volley (4 charges, Recharge 4–6)',
    'Hesitation is Defeat (Legendary Deed, Costs 2)',
    'Collapse (50% HP)',
  ])('leaves "%s" on the heading', (title) => {
    expect(headingSlots(title)).toEqual({ title, slots: {} });
  });

  it('keeps the section slots and lets a heading override them', () => {
    expect(headingSlots('Gore', { deed: 'act' }).slots).toEqual({ deed: 'act' });
    expect(headingSlots('Stomp (Costs 2 Deeds)', { cost: '1 Deed' }).slots).toEqual({
      cost: '2 Deeds',
    });
  });
});

describe('line helpers', () => {
  it('trims and collapses blank lines', () => {
    expect(trimBlank(['', ' ', 'a', '', 'b', ''])).toEqual(['a', '', 'b']);
    expect(collapseBlank(['a', '', '', 'b', '', ''])).toEqual(['a', '', 'b', '']);
  });

  it('reads the title and the frontmatter end', () => {
    const lines = ['---', 'source: x', '---', '', '# Rotworm  ', 'text'];
    expect(titleOf(lines)).toBe('Rotworm');
    expect(frontmatterEnd(lines)).toBe(2);
    expect(frontmatterEnd(['# No frontmatter'])).toBe(-1);
  });
});

describe('resolveFiles', () => {
  it('keeps a file path, drops a missing one', () => {
    const self = fileURLToPath(import.meta.url);
    expect(resolveFiles([self, 'no/such/file.mdx'], ['.mdx'])).toEqual([self]);
  });
});
