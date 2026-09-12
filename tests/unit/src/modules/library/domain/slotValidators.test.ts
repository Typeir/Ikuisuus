/**
 * @fileoverview Tests for slot value shape rules.
 *
 * @module tests/unit/src/modules/library/domain/slotValidators.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-04
 */

import { describe, expect, it } from 'vitest';
import { SLOT_RULES, slotFailure } from '@/modules/library/domain/slotValidators';

describe('slotFailure', () => {
  it('passes a slot with no rule, whatever it carries', () => {
    expect(slotFailure('targets', 'everything within the cone')).toBeNull();
    expect(slotFailure('rarity', 'very rare')).toBeNull();
  });

  it('wants a whole number for an ability score', () => {
    expect(slotFailure('str', '18')).toBeNull();
    expect(slotFailure('str', ' 8 ')).toBeNull();
    expect(slotFailure('str', 'banana')).toContain('whole number');
    expect(slotFailure('str', '18 (+4)')).toContain('whole number');
  });

  it('accepts the low fractional lethalitys', () => {
    expect(slotFailure('lethality', '3')).toBeNull();
    expect(slotFailure('lethality', '1/8')).toBeNull();
    expect(slotFailure('lethality', '1/4')).toBeNull();
    expect(slotFailure('lethality', '1/2')).toBeNull();
  });

  it('rejects a lethality with XP buried in it', () => {
    expect(slotFailure('lethality', '3 (700 XP)')).toContain('own slot');
  });

  it('wants a whole number of XP, thousands separators allowed', () => {
    expect(slotFailure('xp', '700')).toBeNull();
    expect(slotFailure('xp', '5,900')).toBeNull();
    expect(slotFailure('xp', '700 XP')).toContain('whole number');
  });

  it('takes hit points grouped or not, dice optional', () => {
    expect(slotFailure('hitPoints', '153 ([% 18d10 +54 %])')).toBeNull();
    expect(slotFailure('hitPoints', '1,020 ([% 60d12 +600 %])')).toBeNull();
    expect(slotFailure('hitPoints', '18')).toBeNull();
    expect(slotFailure('hitPoints', 'lots')).not.toBeNull();
  });

  it('wants a sign on a tier bonus', () => {
    expect(slotFailure('tierBonus', '+4')).toBeNull();
    expect(slotFailure('tierBonus', '-1')).toBeNull();
    expect(slotFailure('tierBonus', '4')).toContain('signed');
  });

  it('lets a spell level be a cantrip, but only under Spell', () => {
    expect(slotFailure('level', 'cantrip', 'Spell')).toBeNull();
    expect(slotFailure('level', '0', 'Spell')).toBeNull();
    expect(slotFailure('level', '13', 'Spell')).toContain('0 to 12');
    /* A feature's level is a character level and has no cantrip. */
    expect(slotFailure('level', 'cantrip')).toContain('whole number');
  });

  it('keeps prose slots out of the rule table entirely', () => {
    for (const name of ['targets', 'duration', 'properties', 'prerequisite']) {
      expect(SLOT_RULES[name as never], name).toBeUndefined();
    }
  });
});
