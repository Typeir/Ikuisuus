/**
 * @fileoverview Damage Context Tests
 * @description Guards the rule that licenses a damage type. Damage types are
 * ordinary English words, so a bare occurrence is not evidence of damage and
 * matching one as damage puts pills on pages that never deal any.
 *
 * @module tests/unit/scripts/metadata/damageContexts
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-05
 *
 * @requires vitest Testing framework
 */

import { loadSharedData, type SharedData } from '@scripts/metadata/sharedData';
import {
  damageContexts,
  extractDamageTags,
  stripCitations,
} from '@scripts/metadata/taggingUtils';
import { beforeAll, describe, expect, it } from 'vitest';

describe('damageContexts', () => {
  it('should ignore a damage type used as an ordinary word', () => {
    expect(
      damageContexts('You light a campfire. The fire burns brightly.'),
    ).toBe('');
    expect(damageContexts('This is true for all creatures.')).toBe('');
  });

  it('should read a dice expression, which never says "damage"', () => {
    expect(damageContexts('[% 2d6 dark %]')).toContain('dark');
  });

  it('should stop at a clause boundary', () => {
    expect(damageContexts('The frost melts. It deals fire damage.')).not.toContain(
      'frost',
    );
  });
});

describe('extractDamageTags', () => {
  let sharedData: SharedData;

  beforeAll(async () => {
    sharedData = await loadSharedData();
  });

  it('should not tag a campfire as fire damage', () => {
    expect(extractDamageTags('She warms her hands by the fire.', sharedData)).toEqual(
      [],
    );
  });

  it('should not tag the adjective "true" as true damage', () => {
    expect(
      extractDamageTags('The statement holds true in every case.', sharedData),
    ).toEqual([]);
  });

  it('should tag a type stated next to the word damage', () => {
    expect(extractDamageTags('takes 1d4 true damage', sharedData)).toEqual([
      'damage:true',
    ]);
  });

  /** The old `<type> damage` regex could not span a list or its markdown. */
  it('should tag every type in a list', () => {
    expect(
      extractDamageTags(
        'you have resistance against **bludgeoning, piercing, and slashing** damage',
        sharedData,
      ).sort(),
    ).toEqual(['damage:bludgeoning', 'damage:piercing', 'damage:slashing']);
  });

  it('should tag a type stated only inside a dice expression', () => {
    expect(extractDamageTags('deals [% 6d10 slashing %]', sharedData)).toEqual([
      'damage:slashing',
    ]);
  });
});

describe('stripCitations', () => {
  /** Naming a spell is not casting it. */
  it('should drop the label of a link to another entity', () => {
    expect(
      stripCitations(
        'Recommended: [Feather Fall](/en/library/spells/feather-fall).',
      ),
    ).not.toContain('Feather Fall');
  });

  it('should keep the label of a rules link, which does state the mechanic', () => {
    expect(stripCitations('you gain [flight](/en/library/rules/flight)')).toContain(
      'flight',
    );
  });
});
