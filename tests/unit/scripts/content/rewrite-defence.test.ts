/**
 * @fileoverview Tests for the Defence codemod.
 * @description Each verdict writes its word, formulas split into Deflect and
 * Dodge, hand rewrites replace blocks bottom-up, and a moved site is skipped
 *
 * @module tests/unit/scripts/content/rewrite-defence.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-15
 */

import { describe, expect, it } from 'vitest';
import {
  applySite,
  flatFormula,
  locate,
  mergeSites,
  readTicks,
  remaining,
  rewrite,
  splitFormula,
  swapWords,
} from '../../../../scripts/content/rewrite-defence.mjs';

const PATH = 'monsters/probe.sheet.mdx';

describe('readTicks', () => {
  it('reads the marked side and its note per site', () => {
    const ticks = readTicks(
      [
        '## items/a.mdx:96',
        '- [V] dodge (parrying)',
        '- [ ] deflect',
        '## items/b.mdx:12',
        '- [ ] dodge',
        '- [V] other: Removed altogether',
      ].join('\n'),
    );
    expect(ticks.get('items/a.mdx:96')).toEqual({ verdict: 'dodge', note: '(parrying)' });
    expect(ticks.get('items/b.mdx:12')).toEqual({ verdict: 'other', note: 'Removed altogether' });
  });
});

describe('mergeSites', () => {
  it('lets a tick settle an unclear row and a hand verdict win over both', () => {
    const rows = [
      { path: PATH, line: 1, kind: 'ac-bonus', context: 'a', verdict: 'unclear' },
      { path: PATH, line: 2, kind: 'ac-bonus', context: 'b', verdict: 'unclear' },
      { path: PATH, line: 3, kind: 'ac-word', context: 'c', verdict: 'total' },
    ];
    const ticks = new Map([[`${PATH}:1`, { verdict: 'dodge', note: '' }]]);
    const sites = mergeSites(rows, ticks, [{ path: PATH, line: 3, verdict: 'deflect' }]);
    expect(sites.map((site) => [site.line, site.verdict, site.source])).toEqual([
      [1, 'dodge', 'tick'],
      [2, 'unticked', 'classifier'],
      [3, 'deflect', 'hand'],
    ]);
    expect(sites[2].context).toBe('c');
  });
});

describe('locate', () => {
  it('follows a shifted line and refuses an ambiguous or missing one', () => {
    const lines = ['x', 'Each panel has AC 15', 'y'];
    expect(locate(lines, { line: 1, context: 'Each panel has AC 15' })).toBe(1);
    expect(locate(['a', 'AC 15', 'AC 15'], { line: 1, context: 'AC 15' })).toBe(-1);
    expect(locate(lines, { line: 2, context: 'gone' })).toBe(-1);
  });
});

describe('swapWords', () => {
  it('writes the word over every spelling and folds the abbreviation', () => {
    expect(swapWords('the target’s Armour Class (AC), its AC and armor class (AC)', 'Defence')).toBe(
      'the target’s Defence, its Defence and defence',
    );
    expect(swapWords('targets have an Armor Class of 17', 'Deflect')).toBe(
      'targets have a Deflect of 17',
    );
    expect(swapWords('armorClass="16"', 'Defence')).toBe('armorClass="16"');
  });
});

describe('splitFormula', () => {
  it('reads Deflect off the base and leaves Dodge to Dexterity', () => {
    expect(splitFormula('your AC is 13 + DEX.')).toBe('your Deflect is 3.');
    expect(splitFormula('your AC is **13 + DEX**.')).toBe('your Deflect is **3**.');
    expect(splitFormula('Their base AC becomes 13 plus their Dexterity modifier.')).toBe(
      'Their base Deflect becomes 3.',
    );
  });

  it('names Dodge when another ability carries it', () => {
    expect(splitFormula('Your AC becomes **13 + WIS** if')).toBe(
      'Your Deflect becomes **3** and Dodge becomes **WIS** if',
    );
    expect(splitFormula('your **AC = 10 + Dex mod + Wis mod**.')).toBe(
      'your **Dodge = Dex mod + Wis mod**.',
    );
    expect(splitFormula('your **base Armor Class equals 10 + DEX + CHA**.')).toBe(
      'your **base Dodge equals DEX + CHA**.',
    );
  });
});

describe('flatFormula', () => {
  it('makes an unarmoured baseline Deflect with no Dodge', () => {
    expect(flatFormula('While unarmored, your AC is 16.')).toBe(
      'While unarmored, your Deflect is 6 and Dodge is 0.',
    );
    expect(flatFormula("While you aren't wearing armor, your AC is **16**. A shield still applies.")).toBe(
      "While you aren't wearing armor, your Deflect is **6** and Dodge is 0. A shield still applies.",
    );
  });

  it('keeps a floor as Deflect alone', () => {
    expect(flatFormula('targets have an Armor Class of 17 if their AC is lower')).toBe(
      'targets have an Deflect of 7 if their AC is lower',
    );
  });
});

describe('applySite', () => {
  it('writes the verdict word and collapses a lost Dexterity part to Dodge', () => {
    expect(applySite('+3 bonus to AC and Dexterity saving throws', { verdict: 'dodge' })).toBe(
      '+3 bonus to Dodge and Dexterity saving throws',
    );
    expect(
      applySite('A creature loses its Dexterity modifier to Armour Class when', { verdict: 'dodge' }),
    ).toBe('A creature loses its Dodge when');
    expect(applySite('the dome has **AC 20**', { verdict: 'object' })).toBe('the dome has **Defence 20**');
    expect(applySite('a Wisdom saving throw', { verdict: 'other' })).toBe('a Wisdom saving throw');
  });

  it('splits then renames the rest of a formula line', () => {
    expect(
      applySite('Your AC becomes **13 + WIS** if this is higher than the Beast’s normal AC.', {
        verdict: 'split',
      }),
    ).toBe(
      'Your Deflect becomes **3** and Dodge becomes **WIS** if this is higher than the Beast’s normal Defence.',
    );
    expect(
      applySite('targets have an Armor Class of 17 if their AC is lower than that.', {
        verdict: 'deflect',
      }),
    ).toBe('targets have a Deflect of 7 if their Deflect is lower than that.');
  });
});

describe('rewrite', () => {
  const text = [
    '#### Tombsteel Armor',
    '- Increases base AC by +1',
    '  ** Fraternity** (Integrated)',
    '  The armor contains an enchantment:',
    '  - The bonded creature **gains a +1 bonus to AC** (already included)',
    '  - The bond **ends immediately** if either dies',
    'Each plating has AC 30.',
  ].join('\n');

  it('applies word verdicts, replaces a block bottom-up and drops sites inside it', () => {
    const outcome = rewrite(text, [
      { path: PATH, line: 2, context: '- Increases base AC by +1', verdict: 'deflect' },
      { path: PATH, line: 5, context: '- The bonded creature', verdict: 'deflect' },
      {
        path: PATH,
        line: 3,
        through: 6,
        match: '** Fraternity** (Integrated)',
        verdict: 'rewrite',
        text: '  **Fraternity** (Integrated)\n  A permanent [_Fraternity_](/en/library/spells/fraternity).',
      },
      { path: PATH, line: 7, context: 'Each plating has AC 30.', verdict: 'object' },
      { path: PATH, line: 9, context: 'nowhere', verdict: 'total' },
    ]);
    expect(outcome.text).toBe(
      [
        '#### Tombsteel Armor',
        '- Increases base Deflect by +1',
        '  **Fraternity** (Integrated)',
        '  A permanent [_Fraternity_](/en/library/spells/fraternity).',
        'Each plating has Defence 30.',
      ].join('\n'),
    );
    expect(outcome.applied.map((site) => site.line)).toEqual([7, 3, 2]);
    expect(outcome.skipped.map((site) => [site.line, site.reason])).toEqual([[9, 'moved']]);
  });

  it('deletes on a delete verdict, holds unticked and other sites, and is a no-op the second time', () => {
    const outcome = rewrite(text, [
      { path: PATH, line: 7, context: 'Each plating', verdict: 'delete' },
      { path: PATH, line: 2, context: '- Increases base AC', verdict: 'unticked' },
      { path: PATH, line: 5, context: '- The bonded creature', verdict: 'other', note: 'removed' },
    ]);
    expect(outcome.text.split('\n')).toHaveLength(6);
    expect(outcome.skipped.map((site) => site.reason)).toEqual(['other', 'unticked']);
    const once = rewrite(text, [
      { path: PATH, line: 2, context: '- Increases base AC by +1', verdict: 'deflect' },
    ]).text;
    const twice = rewrite(once, [
      { path: PATH, line: 2, context: '- Increases base AC by +1', verdict: 'deflect' },
    ]);
    expect(twice.text).toBe(once);
    expect(twice.skipped[0].reason).toBe('moved');
  });
});

describe('remaining', () => {
  it('lists the lines still naming AC', () => {
    expect(remaining('fine\nits AC is 12\narmorClass="12"\nArmour Class')).toEqual([
      { line: 2, text: 'its AC is 12' },
      { line: 4, text: 'Armour Class' },
    ]);
  });
});
