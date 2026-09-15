/**
 * @fileoverview Tests for the Poise audit.
 * @description One authored line per kind proves it matches, and the armour
 * row and folder helpers read the corpus shapes
 *
 * @module tests/unit/scripts/content/audit-poise.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-14
 */

import { describe, expect, it } from 'vitest';
import {
  ARMOUR_PAGE,
  CODE_KINDS,
  KINDS,
  folderOf,
  isArmourRow,
  matchesIn,
  summarize,
} from '../../../../scripts/content/audit-poise.mjs';

/**
 * Kind ids hit by one line of prose.
 *
 * @param {string} line - A line of MDX
 * @returns {string[]} Ids, in match order
 */
const kindsFor = (line: string): string[] =>
  matchesIn('src/content/en/probe.mdx', line).map((row) => row.kind);

describe('KINDS', () => {
  it('keeps ids unique across prose and code', () => {
    const ids = [...KINDS, ...CODE_KINDS].map((kind) => kind.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('matchesIn on prose', () => {
  it.each([
    ['deals poise damage', ['poise-word']],
    ['has the [# kw:condition:stunned #] condition', ['stunned-keyword']],
    ['the target is stunned', ['stunned-bare']],
    ['[# kw:condition:staggered #]', ['staggered-keyword']],
    ['[# kw:condition:steady #]', ['steady-keyword']],
    ['sufferers are unsteady', ['unsteady']],
    ['effects that would [# kw:displace #] them', ['displace-keyword']],
    ['displacement does not provoke', ['displace-bare']],
    ['is pushed [= 4 stride =] straight away', ['forced-move']],
    ['is **pushed up to [= 3 stride =] away**', ['forced-move']],
    ['you can push the creature [= 1 stride =] straight away', ['forced-move']],
    ['is displaced [= 2 stride =] away from you', ['displaced-register']],
    ['shove that creature [= 2 stride =] in any direction', ['forced-move']],
    ['against being pushed, pulled, or knocked prone', ['displacement-resist']],
    ['thrown with a range of [= 12 stride =]', []],
    ['| Thrown | [= 4 stride =]/[= 12 stride =] |', []],
    ['if you move at least [= 3 stride =] toward it', []],
    ['at the start of each of its turns', ['turn-start-legacy']],
    ['at the start of your next turn', ['turn-start-legacy']],
    ['[# kw:incipient #]', ['incipient-keyword']],
    ['gain temporary hit points', ['temp-hp']],
    ['They lose their Dexterity bonus to AC.', ['dex-to-ac-loss']],
    ['  armorClass="24"', ['ac-slot']],
    ['While unarmored, your AC is 16.', ['ac-formula']],
    ['your AC is **13 + DEX**.', ['ac-formula']],
    ['targets have an Armor Class of 17 if', ['ac-formula']],
    ['Targets gain a **+2 bonus to AC** for the duration.', ['ac-bonus']],
    ['Your AC increases by +1 (stacks with armor).', ['ac-bonus']],
    ['They take a –2 penalty to AC and Dexterity saving throws.', ['ac-penalty']],
    ['They lose 1 point of AC for each instance.', ['ac-penalty']],
    ['an attack roll against the target’s AC', ['ac-word']],
    ['Your starting **armor class (AC)** is determined', ['ac-word', 'ac-word']],
    ['sets your base Armour Class.', ['ac-word']],
    ['## Uncanny Dodge', ['defence-name']],
    ['You can now use **Deflect Attacks** against', ['defence-name']],
    ['Stuns switch off Dodge only; Deflect stands.', ['defence-word', 'defence-word']],
    ['<Monster', ['monster-tag']],
  ])('%s → %j', (line, expected) => {
    expect(kindsFor(line)).toEqual(expected);
  });

  it('counts an armour row only on the armour page', () => {
    const row = '| Plate      | 18 | Str 15 | Disadvantage | [= 33 burden =]. | 1,500 gp |';
    expect(isArmourRow(row)).toBe(true);
    expect(isArmourRow('| ---------- | -- |')).toBe(false);
    expect(matchesIn(ARMOUR_PAGE, row).map((entry) => entry.kind)).toEqual([
      'armour-row',
    ]);
    expect(matchesIn('src/content/en/probe.mdx', row)).toEqual([]);
  });
});

describe('matchesIn on code', () => {
  it('finds the condition names in code', () => {
    const rows = matchesIn('src/lib/glyphs.ts', "stunned: 'stunned', poise");
    expect(rows.map((row) => row.kind)).toEqual([
      'code-poise',
      'code-stunned',
      'code-stunned',
    ]);
  });
});

describe('helpers', () => {
  it('names the content folder', () => {
    expect(folderOf('src/content/en/monsters/albedo.sheet.mdx')).toBe(
      'monsters',
    );
    expect(folderOf('foundry/scripts/maps.ts')).toBe('foundry');
  });

  it('summarizes by kind', () => {
    const rows = matchesIn('src/content/en/probe.mdx', 'stunned and stunned');
    expect(summarize(rows).byKind).toEqual([
      { id: 'stunned-bare', axis: 'state', count: 2, files: 1 },
    ]);
  });
});
