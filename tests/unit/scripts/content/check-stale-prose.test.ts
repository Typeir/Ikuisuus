/**
 * @fileoverview Tests for the stale-prose checker.
 * @description One authored line per pattern proves it matches, and the
 * near-misses prove the register's own phrasing does not: a keyword-wrapped
 * condition is not bare, and "your next turn" is review rather than legacy.
 *
 * @module tests/unit/scripts/content/check-stale-prose.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-04
 */

import { describe, expect, it } from 'vitest';
import {
  PATTERNS,
  scanText,
  summarize,
} from '../../../../scripts/content/check-stale-prose.mjs';

/**
 * Pattern ids hit by one line of text.
 *
 * @param {string} line - A line of MDX
 * @returns {string[]} Ids, in pattern order
 */
const idsFor = (line: string): string[] =>
  scanText('probe.mdx', line).map((hit) => hit.id);

describe('PATTERNS', () => {
  it('gives every pattern an id, a family, a severity and a hint', () => {
    for (const pattern of PATTERNS) {
      expect(pattern.id, pattern.label).toMatch(/^[a-z-]+$/);
      expect(pattern.family, pattern.id).toBeTruthy();
      expect(['legacy', 'review'], pattern.id).toContain(pattern.severity);
      expect(pattern.hint, pattern.id).toBeTruthy();
    }
  });

  it('keeps ids unique', () => {
    const ids = PATTERNS.map((pattern) => pattern.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('the D&D inheritance', () => {
  it.each([
    ['legacy-save', 'Every creature must succeed on a DC 15 Dexterity saving throw or fall.'],
    ['legacy-save', 'All creatures in the line must make a Dexterity saving throw'],
    ['repeat-save', 'It can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success.'],
    ['bare-dc-save', 'a DC 13 Constitution saving throw'],
    ['attack-block', '_Melee Weapon Attack:_ +6 to hit, reach 5 ft., one target.'],
    ['to-hit', 'a Black Quill Strike (+13 to hit) dealing damage'],
    ['hit-line', '_Hit:_ 6 ([% 1d6 +2 %]) bludgeoning damage.'],
    ['one-target', 'reach [= 1 stride =], one target.'],
    ['spellcaster-level', 'Rubedo is a **17th-level spellcaster**.'],
    ['spellcasting-ability', 'Its spellcasting ability is Wisdom (spell save DC 26, +18 to hit with spell attacks).'],
    ['no-components', 'It does not require material components.'],
    ['spells-prepared', 'It has the following spells prepared:'],
    ['slot-notation', '**1st level (4 slots)**:'],
    ['slot-notation', '**2nd level (1/day each)**:'],
    ['upcast', '[_Flame Strike_](/spells/flame-strike) (upcast)'],
    ['magic-resistance', 'Yskeia has advantage on saving throws against spells and other magical effects.'],
    ['magic-weapons', "The construct's weapon attacks are magical."],
    ['siege-monster', 'Yskeia deals quadruple damage to objects and structures.'],
    ['no-action-required', 'you may invoke it (no action required)'],
    ['per-day', 'Reprise of the First (1/Day)'],
    ['end-of-next-turn', 'the target is stunned until the end of its next turn.'],
    ['end-of-next-turn', 'they become Hopeless until the end of their next turn.'],
    ['bonus-action', 'As a Bonus Action, you may eat one.'],
    ['magic-action', 'take the Magic action to become Invisible'],
    ['magic-action', 'take the **Magic** action to become Invisible'],
    ['feet', 'Darkvision 60 ft., passive Perception 10'],
    ['bare-condition', 'or become poisoned until cured'],
    ['proficiency-bonus', 'Spell save DC 10 + PB + your ability modifier'],
  ])('%s matches: %s', (id, line) => {
    expect(idsFor(line)).toContain(id);
  });
});

describe('the register is not stale', () => {
  it.each([
    ['a keyworded condition', 'or become [# kw:condition:poisoned #] until cured'],
    ['the migrated save', 'Targets save Dexterity against DC 16, halving [% 8d6 fire %].'],
    ['the migrated attack', 'Accuracy +6, reach [= 1 stride =], one creature. On a hit, 6 ([% 1d6 +2 %]).'],
    ['briefly', 'the target is [# kw:condition:stunned #] [# kw:briefly #].'],
    ['a resist', 'The target may [# kw:resist #] at the end of each of its turns.'],
    ['a stride', 'Darkvision [= 12 stride =]'],
    ['a recharge', 'charges="1/[# kw:Repose #]"'],
    ['Major Action', 'As a Major Action, you release a line of scorching wind.'],
  ])('%s produces no legacy hit', (_label, line) => {
    const legacy = scanText('probe.mdx', line).filter(
      (hit) => PATTERNS.find((p) => p.id === hit.id)?.severity === 'legacy',
    );
    expect(legacy).toEqual([]);
  });
});

describe('review versus legacy', () => {
  it("marks the wielder's next turn for review, and the sufferer's as legacy", () => {
    const wielder = PATTERNS.find((p) => p.id === 'end-of-your-next-turn');
    const sufferer = PATTERNS.find((p) => p.id === 'end-of-next-turn');
    expect(wielder?.severity).toBe('review');
    expect(sufferer?.severity).toBe('legacy');
    expect(idsFor('you cannot fire it again until the end of your next turn.')).toEqual([
      'end-of-your-next-turn',
    ]);
    expect(idsFor('its AC is reduced until the end of its next turn.')).toEqual([
      'end-of-next-turn',
    ]);
  });

  it('marks next dawn and immune-until for review, since both can be real durations', () => {
    for (const id of ['next-dawn', 'immune-until', 'challenge-rating-prose']) {
      expect(PATTERNS.find((p) => p.id === id)?.severity, id).toBe('review');
    }
  });

  it.each([
    ['a burning horse', 'a golden chariot pulled by two burning horses'],
    ['a dying breath', 'With his dying breath, he whispered a plea'],
    ['a sundered blade', 'This weapon cannot be broken, sundered, or melted'],
    ['a spell name', '[_Burning hands_](/en/library/spells/burning-hands)'],
  ])('%s is review, never legacy', (_label, line) => {
    expect(idsFor(line)).toEqual(['ambiguous-condition']);
  });

  it('keeps the unambiguous condition words legacy', () => {
    expect(idsFor('or become poisoned until cured')).toEqual(['bare-condition']);
    expect(idsFor('the target is paralyzed for 1 minute')).toEqual(['bare-condition']);
  });

  it("does not mistake the register's own `one creature` for a D&D attack line", () => {
    expect(idsFor('Accuracy +6, reach [= 1 stride =], one creature.')).toEqual([]);
    expect(idsFor('reach [= 1 stride =], one target.')).toEqual(['one-target']);
  });
});

describe('scanText', () => {
  it('reports one hit per line per pattern, with the line number', () => {
    const text = [
      'clean line',
      'must make a Dexterity saving throw (+7 to hit)',
      'another clean line',
    ].join('\n');
    const hits = scanText('x.mdx', text);
    expect(hits.map((hit) => [hit.line, hit.id])).toEqual([
      [2, 'legacy-save'],
      [2, 'to-hit'],
    ]);
  });

  it('accepts CRLF line endings', () => {
    const hits = scanText('x.mdx', 'a\r\nmust make a Wisdom saving throw\r\nb');
    expect(hits.map((hit) => hit.line)).toEqual([2]);
  });

  it('keeps an excerpt around the match with whitespace collapsed', () => {
    const [hit] = scanText('x.mdx', 'lead   text   must make a Wisdom saving throw   tail');
    expect(hit.excerpt).toBe('lead text must make a Wisdom saving throw tail');
  });
});

describe('summarize', () => {
  it('rolls hits up by pattern with file counts and an example', () => {
    const hits = [
      ...scanText('a.mdx', 'must make a Wisdom saving throw'),
      ...scanText('b.mdx', 'must make a Wisdom saving throw'),
      ...scanText('b.mdx', 'you get +2 to hit'),
    ];
    const rows = summarize(hits);
    const save = rows.find((row) => row.id === 'legacy-save');
    expect(save?.hits).toBe(2);
    expect(save?.files).toBe(2);
    expect(save?.example?.file).toBe('a.mdx');
    expect(rows.map((row) => row.id)).toEqual(['legacy-save', 'to-hit']);
  });

  it('omits patterns with no hits', () => {
    expect(summarize([])).toEqual([]);
  });
});
