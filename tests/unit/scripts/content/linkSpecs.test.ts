/**
 * @fileoverview Unit tests for link specification parsing and validation.
 * @module tests/unit/scripts/content/linkSpecs
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { describe, expect, it } from 'vitest';
import { parseLinkSpecs } from '../../../../scripts/content/linkSpecs';

describe('parseLinkSpecs', () => {
  it('accepts valid link spec arrays', () => {
    const parsed = parseLinkSpecs([
      {
        term: 'ranger',
        path: '/en/library/character-creation/vocations/ranger',
      },
      {
        term: ['lay of the land', 'prey'],
        path: '/en/library/character-creation/vocations/ranger/lay-of-the-land',
      },
    ]);

    expect(parsed).toHaveLength(2);
    expect(parsed[1].term).toEqual(['lay of the land', 'prey']);
  });

  it('throws when payload is not an array', () => {
    expect(() => parseLinkSpecs({ term: 'x', path: '/y' })).toThrow(
      'Links JSON must be an array.',
    );
  });

  it('throws when an entry is invalid', () => {
    expect(() =>
      parseLinkSpecs([{ term: 42, path: '/en/library/world/a' }]),
    ).toThrow('Bad link spec at index 0');
  });
});
