/**
 * @fileoverview Tests for tagging pattern dictionaries
 * @module tests/unit/src/lib/metadata/taggingPatterns.test
 */

import {
  ITEM_MECHANICS,
  MONSTER_MECHANICS,
  MOVEMENT,
} from '@scripts/metadata/taggingPatterns';
import { describe, expect, it } from 'vitest';

describe('MOVEMENT patterns', () => {
  it('matches flight keywords', () => {
    expect(MOVEMENT.flight.test('can fly 60 ft.')).toBe(true);
    expect(MOVEMENT.flight.test('flying speed')).toBe(true);
    expect(MOVEMENT.flight.test('walks slowly')).toBe(false);
  });

  it('matches distance feet for flight validation', () => {
    expect(MOVEMENT.distanceFeet.test('60 ft')).toBe(true);
    expect(MOVEMENT.distanceFeet.test('no measurement')).toBe(false);
  });
});

describe('MONSTER_MECHANICS patterns', () => {
  it('detects legendary deeds', () => {
    expect(MONSTER_MECHANICS.legendaryDeed.test('Legendary Deed: Act')).toBe(
      true,
    );
    expect(MONSTER_MECHANICS.deedLair.test('Legendary Deed: Lair')).toBe(true);
  });

  it('detects spellcasting', () => {
    expect(MONSTER_MECHANICS.spellcasting.test('cantrips known')).toBe(true);
    expect(MONSTER_MECHANICS.spellcasting.test('has spell slots')).toBe(true);
  });

  it('detects regeneration variants', () => {
    expect(MONSTER_MECHANICS.regeneration.test('regeneration')).toBe(true);
    expect(MONSTER_MECHANICS.healing.test('regains 10 hit points')).toBe(true);
  });
});

describe('ITEM_MECHANICS patterns', () => {
  it('detects bonus patterns', () => {
    expect(ITEM_MECHANICS.attackBonus.test('+2 to hit')).toBe(true);
    expect(ITEM_MECHANICS.acBonus.test('+1 bonus to AC')).toBe(true);
  });

  it('detects resource patterns', () => {
    expect(ITEM_MECHANICS.charges.test('3 charges')).toBe(true);
    expect(ITEM_MECHANICS.limitedUses.test('1/long rest')).toBe(true);
    expect(ITEM_MECHANICS.recharge.test('recharge 5')).toBe(true);
  });

  it('detects consumable patterns', () => {
    expect(ITEM_MECHANICS.consumable.test('consumable')).toBe(true);
    expect(ITEM_MECHANICS.consumableDestroyed.test('burns away')).toBe(true);
  });
});
