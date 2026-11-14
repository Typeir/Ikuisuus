/**
 * @fileoverview Tests for the keyword-shape codemod.
 * @description Glued inflections fold into the display override, other glued words get a space, and duplicated neighbours are dropped.
 *
 * @module tests/unit/scripts/content/codemod-keyword-shapes.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-11-11
 */

import { describe, expect, it } from 'vitest';
import {
  findDuplicates,
  run,
  splitExpression,
  transformLine,
} from '../../../../scripts/content/codemod-keyword-shapes.mjs';

describe('splitExpression', () => {
  it('takes the display from the last segment of the target', () => {
    expect(splitExpression('condition:Prone')).toEqual({ target: 'condition:Prone', display: 'Prone', override: false });
  });

  it('keeps an existing override', () => {
    expect(splitExpression('condition:bleeding;bleeds')).toEqual({
      target: 'condition:bleeding',
      display: 'bleeds',
      override: true,
    });
  });
});

describe('transformLine', () => {
  it.each([
    ['cannot be [# kw:displace #]d.', 'cannot be [# kw:displace;displaced #].'],
    ['it [# kw:brace #]s and keeps out', 'it [# kw:brace;braces #] and keeps out'],
    ['[# kw:Displace #]d', '[# kw:Displace;Displaced #]'],
    ['[# kw:condition:bleeding;bleed #]s', '[# kw:condition:bleeding;bleeds #]'],
  ])('folds %s', (line, expected) => {
    const result = transformLine(line);
    expect(result.line).toBe(expected);
    expect(result.hits[0].rule).toBe('inflect');
  });

  it('unlinks a link to the keyword own term and spaces the glued word', () => {
    const line =
      'inflict [short-term or long-term](/en/library/rules/illnesses/madness) [# kw:madness #]on you';
    const result = transformLine(line);
    expect(result.line).toBe('inflict short-term or long-term [# kw:madness #] on you');
    expect(result.hits.map((hit) => hit.rule)).toEqual(['unlink', 'space']);
  });

  it('keeps a link to another term', () => {
    const line = 'see [rules](/en/library/rules/conditions) [# kw:madness #] here';
    expect(transformLine(line)).toEqual({ line, hits: [] });
  });

  it.each([
    ['You can use [# kw:use #] as a free action.', 'You can [# kw:use #] as a free action.'],
    ['falls [# kw:condition:prone #] prone.', 'falls [# kw:condition:prone #].'],
  ])('drops the echoed word in %s', (line, expected) => {
    const result = transformLine(line);
    expect(result.line).toBe(expected);
    expect(result.hits[0].rule).toBe('echo');
  });

  it('spaces a glued word that is not an inflection', () => {
    const result = transformLine('[# kw:madness #]on you');
    expect(result.line).toBe('[# kw:madness #] on you');
    expect(result.hits[0].rule).toBe('space');
  });

  it.each(['[# kw:displace #] and', '[# kw:displace #].', '**[# kw:condition:Prone #]**'])('leaves %s', (line) => {
    expect(transformLine(line)).toEqual({ line, hits: [] });
  });
});

describe('findDuplicates', () => {
  it('lists a keyword beside its own word', () => {
    expect(findDuplicates('You can use [# kw:use #] as a free action.').map((dup) => dup.kind)).toEqual(['echo']);
  });

  it('lists a link beside a keyword to the same term', () => {
    const line = 'inflict [short-term](/en/library/rules/illnesses/madness) [# kw:madness #] on you';
    expect(findDuplicates(line).map((dup) => dup.kind)).toEqual(['link']);
  });

  it('ignores distinct neighbours', () => {
    expect(findDuplicates('knocked [# kw:condition:prone #] by the blow')).toEqual([]);
  });
});

describe('run', () => {
  it('keeps line endings and records sites', () => {
    const text = 'a\r\ncannot be [# kw:displace #]d.\r\n';
    const result = run(['probe.mdx'], () => text);
    expect(result.edits[0].after).toBe('a\r\ncannot be [# kw:displace;displaced #].\r\n');
    expect(result.sites).toHaveLength(1);
    expect(result.sites[0].line).toBe(2);
  });
});
