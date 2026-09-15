/**
 * @fileoverview Tests for the phased Wisdom codemod.
 * @description A file renames only once its old Wisdom is resolved, the
 * ruled verdicts apply on their own, and supplied verdicts move the rest
 *
 * @module tests/unit/scripts/content/rename-wisdom.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-14
 */

import { describe, expect, it } from 'vitest';
import {
  averageMindScores,
  dedupeAbilityLists,
  renameIntelligence,
  resolveOldWisdom,
  rewrite,
  verdictKey,
} from '../../../../scripts/content/rename-wisdom.mjs';

const PATH = 'src/content/en/probe.mdx';

/**
 * Verdict map from a list of entries.
 *
 * @param {Array<object>} entries - Verdicts with path, line, kind, verdict
 * @returns {Map<string, object>} Verdicts by key
 */
const verdicts = (entries: Array<Record<string, unknown>>) =>
  new Map(entries.map((entry) => [verdictKey(entry as never), entry]));

describe('renameIntelligence', () => {
  it('renames the word, the abbreviations and the slots', () => {
    const text = [
      'Intelligence (Arcana), INT + TB, Int save, your intelligence',
      '  int="7"',
      '  saves="Int +7, Cha +15"',
    ].join('\n');
    expect(renameIntelligence(text)).toBe(
      [
        'Wisdom (Arcana), WIS + TB, Wis save, your wisdom',
        '  wis="7"',
        '  saves="Wis +7, Cha +15"',
      ].join('\n'),
    );
  });

  it('folds a doubled Wisdom in an ability list', () => {
    expect(dedupeAbilityLists('ability="Wisdom or Wisdom"')).toBe(
      'ability="Wisdom"',
    );
    expect(dedupeAbilityLists('ability="Wisdom, Strength, Wisdom"')).toBe(
      'ability="Wisdom, Strength"',
    );
  });
});

describe('resolveOldWisdom', () => {
  it('applies the ruled verdicts without being told', () => {
    const text = [
      'a Wisdom (Animal Handling) check and a Wisdom (Medicine) check',
      '  wis="16"',
      '  saves="Str +23, Wis +13, Cha +15"',
    ].join('\n');
    const outcome = resolveOldWisdom(PATH, text, new Map());
    expect(outcome.unresolved).toEqual([]);
    expect(outcome.text).toBe(
      [
        'a Charisma (Animal Handling) check and a Wisdom (Medicine) check',
        '  saves="Str +23, Cha +15"',
      ].join('\n'),
    );
  });

  it('drops a monster save written in full, and holds a vocation one', () => {
    const monster = resolveOldWisdom(
      'src/content/en/monsters/probe.sheet.mdx',
      '  saves="Constitution +9, Wisdom +6"',
      new Map(),
    );
    expect(monster.unresolved).toEqual([]);
    expect(monster.text).toBe('  saves="Constitution +9"');
    const vocation = resolveOldWisdom(
      'src/content/en/character-creation/vocations/probe.vocation.mdx',
      '  saves="Wisdom and Charisma"',
      new Map(),
    );
    expect(vocation.unresolved.map((row) => row.kind)).toEqual([
      'wis-save-prof',
    ]);
  });

  it('keeps a save and a bare word on the mind stat, and holds a casting line', () => {
    const text = [
      'make a Wisdom saving throw',
      'Wisdom is your casting ability for it.',
      'the wisdom of elders',
    ].join('\n');
    const outcome = resolveOldWisdom(PATH, text, new Map());
    expect(outcome.unresolved.map((row) => row.kind)).toEqual(['wis-casting']);
    expect(outcome.text).toBe(text);
  });

  it('averages a monster mind score only where old Wisdom stood far above old Intelligence', () => {
    const sheet = [
      '<Monster', '  int="2"', '  wis="12"', '>',
      '<Monster', '  int="7"', '  wis="10"', '>',
      '<Monster', '  int="20"', '  wis="26"', '>',
    ].join('\n');
    const outcome = averageMindScores(sheet);
    expect(outcome.averaged).toEqual([{ int: 2, wis: 12, mind: 7 }]);
    expect(outcome.text).toContain('int="7"\n  wis="12"');
    expect(outcome.text).toContain('int="7"\n  wis="10"');
    expect(outcome.text).toContain('int="20"\n  wis="26"');
    const full = rewrite('src/content/en/monsters/probe.sheet.mdx', sheet, new Map());
    expect(full.ready).toBe(true);
    expect(full.averaged).toHaveLength(1);
    expect(full.text).toBe(
      ['<Monster', '  wis="7"', '>', '<Monster', '  wis="7"', '>', '<Monster', '  wis="20"', '>'].join('\n'),
    );
  });

  it('moves a site to another ability, splits Perception, or rewrites', () => {
    const text = [
      'make a Wisdom saving throw',
      'a Wisdom (Perception) check, passive Perception 12',
      'a Wisdom (Insight) check',
      'Wisdom is your casting ability for it.',
    ].join('\n');
    const outcome = resolveOldWisdom(
      PATH,
      text,
      verdicts([
        { path: PATH, line: 1, kind: 'wis-save', verdict: 'cha' },
        { path: PATH, line: 2, kind: 'wis-skill-pair', verdict: 'descry' },
        { path: PATH, line: 2, kind: 'perception-passive', verdict: 'descry' },
        { path: PATH, line: 3, kind: 'wis-skill-pair', verdict: 'keep' },
        {
          path: PATH,
          line: 4,
          kind: 'wis-casting',
          verdict: 'rewrite',
          text: 'Choose your casting ability for it.',
        },
      ]),
    );
    expect(outcome.unresolved).toEqual([]);
    expect(outcome.text).toBe(
      [
        'make a Charisma saving throw',
        'a Dexterity (Descry) check, passive Descry 12',
        'a Wisdom (Insight) check',
        'Choose your casting ability for it.',
      ].join('\n'),
    );
  });

  it('deletes a prose line on a delete verdict', () => {
    const text = ['- Wisdom +1', '- Strength +1'].join('\n');
    const outcome = resolveOldWisdom(
      PATH,
      text,
      verdicts([{ path: PATH, line: 1, kind: 'wis-bonus', verdict: 'delete' }]),
    );
    expect(outcome.text).toBe('- Strength +1');
  });
});

describe('rewrite', () => {
  it('leaves a file whole while any old Wisdom site waits', () => {
    const text = 'Intelligence (Arcana). Wisdom is your casting ability for it.';
    const outcome = rewrite(PATH, text, new Map());
    expect(outcome.ready).toBe(false);
    expect(outcome.text).toBe(text);
    expect(outcome.unresolved.map((row) => row.kind)).toEqual(['wis-casting']);
  });

  it('renames a file whose old Wisdom is all saves, checks and modifiers', () => {
    const text = 'Intelligence (Arcana), a Wisdom saving throw, and 10 + WIS + TB';
    const outcome = rewrite(PATH, text, new Map());
    expect(outcome.ready).toBe(true);
    expect(outcome.text).toBe('Wisdom (Arcana), a Wisdom saving throw, and 10 + WIS + TB');
  });

  it('renames a file with no old Wisdom straight away', () => {
    const outcome = rewrite(PATH, 'Intelligence (Arcana), INT', new Map());
    expect(outcome.ready).toBe(true);
    expect(outcome.text).toBe('Wisdom (Arcana), WIS');
  });

  it('resolves a monster sheet then renames its mind score', () => {
    const sheet = [
      '<Monster',
      '  int="7"',
      '  wis="16"',
      '  saves="Str +23, Wis +13"',
      '  skills="Perception +12"',
      '>',
    ].join('\n');
    const outcome = rewrite(
      'src/content/en/monsters/probe.sheet.mdx',
      sheet,
      verdicts([
        {
          path: 'src/content/en/monsters/probe.sheet.mdx',
          line: 5,
          kind: 'perception',
          verdict: 'descry',
        },
      ]),
    );
    expect(outcome.ready).toBe(true);
    expect(outcome.averaged).toEqual([{ int: 7, wis: 16, mind: 12 }]);
    expect(outcome.text).toBe(
      [
        '<Monster',
        '  wis="12"',
        '  saves="Str +23"',
        '  skills="Descry +12"',
        '>',
      ].join('\n'),
    );
  });

  it('is a no-op the second time', () => {
    const once = rewrite(PATH, 'Intelligence (Arcana), INT', new Map()).text;
    expect(rewrite(PATH, once, new Map()).text).toBe(once);
  });
});
