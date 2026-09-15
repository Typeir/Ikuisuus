/**
 * @fileoverview Tests for the Wisdom removal audit.
 * @description One authored line per kind proves the most specific form
 * claims it, and the collision and score helpers read the rows back
 *
 * @module tests/unit/scripts/content/audit-wisdom.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-14
 */

import { describe, expect, it } from 'vitest';
import {
  CODE_KINDS,
  KINDS,
  collisions,
  matchesIn,
  monsterScores,
  summarize,
} from '../../../../scripts/content/audit-wisdom.mjs';

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

  it('gives every kind an axis', () => {
    for (const kind of [...KINDS, ...CODE_KINDS]) {
      expect(kind.axis, kind.id).toBeTruthy();
    }
  });
});

describe('matchesIn on prose', () => {
  it.each([
    ['Wisdom (Perception) check', ['wis-skill-pair']],
    ['make a Wisdom saving throw', ['wis-save']],
    ['Wis save against DC 15', ['wis-save']],
    ['Targets save Wisdom or are charmed', ['wis-save']],
    ['may [# kw:resist #] Wisdom.', ['wis-save']],
    ['a Wisdom check, then Wis DC 20', ['wis-check', 'wis-check']],
    ['primaryAbility="Dexterity and Wisdom"', ['wis-primary']],
    ['saves="Wisdom and Charisma"', ['wis-save-prof']],
    ['ability="Dexterity or Wisdom"', ['wis-feat-ability']],
    ['### Wisdom', ['wis-heading']],
    ['| INT | WIS | CHA |', ['wis-table-cell', 'int-table-cell']],
    ['| **Wis** |', ['wis-table-cell']],
    ['Targets save Intelligence, halving', ['int-save']],
    ['[# kw:roll;RR #] Int DC 20', ['int-check']],
    ['Wisdom is your casting ability for it.', ['wis-casting']],
    ['add your Wisdom modifier instead of Strength', ['wis-instead']],
    ['  wis="16"', ['wis-slot-score']],
    ['saves="Str +23, Wis +13"', ['wis-slot-save']],
    ['- Wisdom +1', ['wis-bonus']],
    ['your Wisdom modifier', ['wis-modifier']],
    ['a Wisdom score of 13', ['wis-score']],
    ['WIS + TB', ['wis-abbrev']],
    ['the wisdom of the elders', ['wis-word']],
    ['Intelligence (Arcana) check', ['int-skill-pair']],
    ['Intelligence saving throw', ['int-save']],
    ['Intelligence is your spellcasting ability', ['int-casting']],
    ['  int="7"', ['int-slot-score']],
    ['saves="Int +7, Cha +15"', ['int-slot-save']],
    ['Intelligence +2', ['int-bonus']],
    ['INT + TB', ['int-abbrev']],
    ['passive Perception 21', ['perception-passive']],
    ['proficiency in Perception', ['perception']],
    ['Insight, Medicine, Survival and Animal Handling', [
      'insight',
      'medicine',
      'survival',
      'animal-handling',
    ]],
  ])('%s → %j', (line, expected) => {
    expect(kindsFor(line)).toEqual(expected);
  });

  it('records the skill inside a pair', () => {
    const [row] = matchesIn('src/content/en/probe.mdx', 'Wisdom (Survival)');
    expect(row.skill).toBe('Survival');
    expect(row.axis).toBe('old-wisdom');
  });

  it('lets a pair claim its span before the bare skill word', () => {
    expect(kindsFor('Wisdom (Perception) and Perception')).toEqual([
      'wis-skill-pair',
      'perception',
    ]);
  });
});

describe('matchesIn on code', () => {
  it('reads keys and words apart', () => {
    const rows = matchesIn(
      'src/lib/schema.d.ts',
      'wis?: number; int?: number; // Wisdom score',
    );
    expect(rows.map((row) => row.kind)).toEqual([
      'code-wisdom',
      'code-wis-key',
      'code-int-key',
    ]);
    expect(rows[0].area).toBe('src');
  });
});

describe('collisions and scores', () => {
  const sheet = [
    '<Monster',
    '  int="7"',
    '  wis="16"',
    '  saves="Wis +13"',
    '>',
  ].join('\n');

  it('names a file carrying both axes', () => {
    const rows = matchesIn('src/content/en/monsters/probe.sheet.mdx', sheet);
    expect(collisions(rows)).toEqual([
      {
        path: 'src/content/en/monsters/probe.sheet.mdx',
        oldWisdom: 2,
        intelligence: 1,
      },
    ]);
  });

  it('reads the two mind scores side by side', () => {
    const rows = matchesIn('src/content/en/monsters/probe.sheet.mdx', sheet);
    expect(monsterScores(rows)).toEqual([
      {
        path: 'src/content/en/monsters/probe.sheet.mdx',
        int: 7,
        wis: 16,
        gap: 9,
      },
    ]);
  });

  it('summarizes by kind and area', () => {
    const rows = matchesIn('src/content/en/monsters/probe.sheet.mdx', sheet);
    const summary = summarize(rows);
    expect(summary.total).toBe(3);
    expect(summary.byArea).toEqual([
      { area: 'content', axis: 'intelligence', count: 3, files: 1 },
    ]);
  });
});
