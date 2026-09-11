/**
 * @fileoverview Unit tests for reading a block's cost mark.
 *
 * @module tests/unit/src/modules/library/domain/costMark.test
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-08
 */

import React from 'react';
import { describe, expect, it } from 'vitest';
import { markCount, markOf } from '@/modules/library/domain/costMark';

describe('markOf', () => {
  it('reads each cost the corpus writes', () => {
    expect(markOf(undefined, '1 Major Action')).toBe('major');
    expect(markOf(undefined, '1 Minor Action')).toBe('minor');
    expect(markOf(undefined, 'Reaction')).toBe('reaction');
    expect(markOf(undefined, '1 Deed')).toBe('deed');
  });

  it('reads a cost however it was cased or pluralised', () => {
    expect(markOf(undefined, '2 DEEDS')).toBe('deed');
    expect(markOf(undefined, 'reactions')).toBe('reaction');
    expect(markOf(undefined, '2 Major Actions')).toBe('major');
    expect(markOf(undefined, '2 Minor Actions')).toBe('minor');
  });

  /* A shortcode inside a cost arrives as nodes, and the currency still has to
     be read off the words. */
  it('reads the currency through the nodes a shortcode leaves', () => {
    expect(
      markOf(undefined, [
        '1 Reaction, taken when receiving ',
        React.createElement('span', { key: 'a' }, 'elemental'),
        ' damage',
      ]),
    ).toBe('reaction');
  });

  /* A reflex is asked of a creature and costs it nothing, so it must not fall
     through to an action's mark. */
  it('reads a reflex as its own thing', () => {
    expect(markOf(undefined, 'Reflex')).toBe('reflex');
    expect(markOf(undefined, 'Reflexes')).toBe('reflex');
  });

  it('prefers the mark the author set', () => {
    expect(markOf('deed', '1 Major Action')).toBe('deed');
  });

  it('marks anything it cannot read as other', () => {
    expect(markOf(undefined, 'Passive')).toBe('other');
    expect(markOf(undefined, undefined)).toBe('other');
    expect(markOf(undefined, React.createElement('span'))).toBe('other');
  });
});

describe('markCount', () => {
  it('counts the units a cost spends', () => {
    expect(markCount('2 Deeds')).toBe(2);
    expect(markCount('1 Major Action')).toBe(1);
  });

  it('reads a cost with no number as one of what it names', () => {
    expect(markCount('Reaction')).toBe(1);
    expect(markCount(undefined)).toBe(1);
    expect(markCount(React.createElement('span'))).toBe(1);
  });

  it('counts through the nodes a shortcode leaves', () => {
    expect(
      markCount(['2 Deeds', React.createElement('span', { key: 'a' }, 'x')]),
    ).toBe(2);
  });

  it('never goes below one', () => {
    expect(markCount('0 Deeds')).toBe(1);
  });
});
