/**
 * @fileoverview Tests for the bare-condition linker.
 * @description The wrap itself is trivial; what these guard is where the
 * linker refuses to wrap — headings, frontmatter, code, an existing keyword,
 * a link's text — and that casing survives so a sentence-initial word
 * displays as authored.
 *
 * @module tests/unit/scripts/content/link-bare-conditions.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-04
 */

import { describe, expect, it } from 'vitest';
import {
  CONDITIONS,
  linkConditions,
} from '../../../../scripts/content/link-bare-conditions.mjs';

describe('linkConditions', () => {
  it('wraps a bare condition word in its keyword', () => {
    const { text, count } = linkConditions('Targets are knocked prone.');
    expect(text).toBe('Targets are knocked [# kw:condition:prone #].');
    expect(count).toBe(1);
  });

  it('keeps the authored casing so the display follows it', () => {
    const { text } = linkConditions('Charmed targets are incapacitated.');
    expect(text).toBe(
      '[# kw:condition:Charmed #] targets are [# kw:condition:incapacitated #].',
    );
  });

  it('wraps inside emphasis, leaving the emphasis alone', () => {
    const { text } = linkConditions('or are **restrained** until the spell ends');
    expect(text).toBe('or are **[# kw:condition:restrained #]** until the spell ends');
  });

  it('wraps inside a slot attribute', () => {
    const { text } = linkConditions(
      '<Feature trigger="when you are subjected to a charmed effect">',
    );
    expect(text).toBe(
      '<Feature trigger="when you are subjected to a [# kw:condition:charmed #] effect">',
    );
  });

  it('leaves a word that is already a keyword', () => {
    const line = 'or become [# kw:condition:poisoned #] until cured';
    expect(linkConditions(line)).toMatchObject({ text: line, count: 0 });
  });

  it('leaves a keyword written with a display override', () => {
    const line = 'they are [# kw:condition:prone;knocked flat #]';
    expect(linkConditions(line).count).toBe(0);
  });

  it('leaves headings, which define keywords rather than reference them', () => {
    const line = '## Poisoned';
    expect(linkConditions(line)).toMatchObject({ text: line, count: 0 });
  });

  it('leaves frontmatter', () => {
    const text = ['---', 'keywords:', '  - prone', '---', 'knocked prone'].join('\n');
    const result = linkConditions(text);
    expect(result.count).toBe(1);
    expect(result.text.split('\n')[2]).toBe('  - prone');
    expect(result.text.split('\n')[4]).toBe('knocked [# kw:condition:prone #]');
  });

  it('leaves fenced code', () => {
    const text = ['```', 'prone', '```', 'prone'].join('\n');
    const result = linkConditions(text);
    expect(result.count).toBe(1);
    expect(result.text.split('\n')[1]).toBe('prone');
  });

  it('leaves inline code', () => {
    const line = 'the `prone` slot value';
    expect(linkConditions(line).count).toBe(0);
  });

  it("leaves a link's text and target", () => {
    const line = 'see [Prone](/en/library/rules/conditions#prone) for the rule';
    expect(linkConditions(line)).toMatchObject({ text: line, count: 0 });
  });

  it('touches only the unambiguous words', () => {
    for (const word of ['burning', 'dying', 'sundered', 'bleeding', 'steady']) {
      expect(CONDITIONS, word).not.toContain(word);
      expect(linkConditions(`a ${word} horse`).count, word).toBe(0);
    }
  });

  it('reports each change with its line', () => {
    const { changes } = linkConditions('clean\nfrightened and stunned\nclean');
    expect(changes).toEqual([
      { line: 2, word: 'frightened' },
      { line: 2, word: 'stunned' },
    ]);
  });

  it('preserves CRLF line endings', () => {
    const { text } = linkConditions('a\r\nknocked prone\r\nb');
    expect(text).toBe('a\r\nknocked [# kw:condition:prone #]\r\nb');
  });

  it('preserves a trailing hard break', () => {
    const { text } = linkConditions('Failing targets are blinded.  \nnext');
    expect(text).toBe('Failing targets are [# kw:condition:blinded #].  \nnext');
  });
});
