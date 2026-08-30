/**
 * @fileoverview extractKeywordRefs Unit Tests
 * @description Tests keyword reference collection from MDX source.
 *
 * @module tests/unit/src/lib/md/extractKeywordRefs
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { extractConsumedKeys, extractKeywordRefs } from '@/lib/md/extractKeywordRefs';
import { describe, expect, it } from 'vitest';

describe('extractKeywordRefs', () => {
  it('collects a single reference', () => {
    expect(extractKeywordRefs('rolls d20 plus [# kw:accuracy #].')).toEqual([
      'accuracy',
    ]);
  });

  it('deduplicates and sorts', () => {
    const source =
      '[# kw:resist #] then [# kw:accuracy #] then [# kw:resist #]';
    expect(extractKeywordRefs(source)).toEqual(['accuracy', 'resist']);
  });

  it('normalises casing and inner whitespace', () => {
    const source = '[# kw:Damage   Bonus #] and [# kw:DAMAGE BONUS #]';
    expect(extractKeywordRefs(source)).toEqual(['damage bonus']);
  });

  it('reports unregistered terms', () => {
    expect(extractKeywordRefs('[# kw:condition:frightened #]')).toEqual([
      'condition:frightened',
    ]);
  });

  it('ignores shortcodes that are not keywords', () => {
    const source = '[% 2d8 fire %] and [= 6 stride =] and [# notkw:thing #]';
    expect(extractKeywordRefs(source)).toEqual([]);
  });

  it('returns an empty array for source with no references', () => {
    expect(extractKeywordRefs('plain prose only.')).toEqual([]);
  });

  it('collects across multiple lines', () => {
    const source = 'line one [# kw:briefly #]\nline two [# kw:accuracy #]';
    expect(extractKeywordRefs(source)).toEqual(['accuracy', 'briefly']);
  });

  it('skips a reference inside an inline code span', () => {
    expect(
      extractKeywordRefs('Write it as `[# kw:condition;blinded #]` in prose.'),
    ).toEqual([]);
  });

  it('skips references inside a fenced block', () => {
    const source = [
      'Real one: [# kw:condition;prone #]',
      '',
      '```md',
      '[# kw:condition;blinded #]',
      '```',
    ].join('\n');

    expect(extractKeywordRefs(source)).toEqual(['condition;prone']);
  });

  describe('extractConsumedKeys', () => {
    it('should key a bare reference by its shard id', () => {
      expect(extractConsumedKeys('a [# kw:resist #] b')).toEqual(['kw--resist']);
    });

    it('should key a namespaced reference under its namespace', () => {
      expect(extractConsumedKeys('[# kw:condition;Prone #]')).toEqual([
        'kw-condition-prone',
      ]);
    });

    it('should collapse casing and separator noise onto one key', () => {
      expect(
        extractConsumedKeys('[# kw:Two-Weapon Fighting #] [# kw:two-weapon-fighting #]'),
      ).toEqual(['kw--two-weapon-fighting']);
    });

    it('should ignore a reference quoted in code', () => {
      expect(extractConsumedKeys('`[# kw:resist #]`')).toEqual([]);
    });

    it('should return nothing for source with no references', () => {
      expect(extractConsumedKeys('plain prose')).toEqual([]);
    });
  });
});
