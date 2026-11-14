/**
 * @fileoverview nameResolver tests.
 *
 * @module tests/unit/src/modules/character-builder/infrastructure/devApi/nameResolver.test
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import {
  DEFAULT_AMBIGUITY_THRESHOLD,
  resolveName,
} from '@/modules/character-builder/infrastructure/devApi/nameResolver';
import { describe, expect, it } from 'vitest';

const items = [
  { slug: 'wizard', title: 'Wizard' },
  { slug: 'witch', title: 'Witch' },
  { slug: 'berserker', title: 'Berserker' },
];
const reader = { slug: (i: { slug: string }) => i.slug, title: (i: { title: string }) => i.title };

describe('resolveName', () => {
  it('matches exact titles with similarity 1', () => {
    const { item, resolution } = resolveName('vocation', 'Wizard', items, reader);
    expect(item?.slug).toBe('wizard');
    expect(resolution.match?.similarity).toBe(1);
    expect(resolution.ambiguous).toBe(false);
  });

  it('picks the best fuzzy match and lists alternates', () => {
    const { item, resolution } = resolveName('vocation', 'wizrd', items, reader);
    expect(item?.slug).toBe('wizard');
    expect(resolution.alternates.length).toBeGreaterThan(0);
    expect(resolution.field).toBe('vocation');
  });

  it('marks close runners-up as ambiguous', () => {
    const { resolution } = resolveName(
      'x',
      'wi',
      [
        { slug: 'wia', title: 'Wia' },
        { slug: 'wib', title: 'Wib' },
      ],
      reader,
      DEFAULT_AMBIGUITY_THRESHOLD,
    );
    expect(resolution.ambiguous).toBe(true);
  });

  it('returns null when nothing scores', () => {
    const { item, resolution } = resolveName('x', 'qqqqqqqqqq', items, reader);
    expect(item).toBeNull();
    expect(resolution.match).toBeNull();
  });
});
