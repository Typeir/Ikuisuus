/**
 * @fileoverview Tests for the values a card derives rather than reads.
 *
 * @module tests/unit/src/modules/library/domain/derive.test
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-04
 */

import { describe, expect, it } from 'vitest';
import {
  abilityCell,
  abilityModifier,
  challengeValue,
  ordinal,
  signed,
  spellLevelPhrase,
  tierBonusFor,
} from '@/modules/library/domain/derive';

describe('abilityModifier', () => {
  it('halves the distance from ten, rounding down', () => {
    expect(abilityModifier(18)).toBe(4);
    expect(abilityModifier(10)).toBe(0);
    expect(abilityModifier(11)).toBe(0);
    expect(abilityModifier(9)).toBe(-1);
    expect(abilityModifier(1)).toBe(-5);
    expect(abilityModifier(30)).toBe(10);
  });

  it('reads a score written as text', () => {
    expect(abilityModifier('18')).toBe(4);
    expect(abilityModifier(' 8 ')).toBe(-1);
  });

  it('gives up on a score that is not a number', () => {
    expect(abilityModifier('—')).toBeNull();
    expect(abilityModifier('')).toBeNull();
  });
});

describe('signed', () => {
  it('writes a modifier the way a sheet prints it', () => {
    expect(signed(4)).toBe('+4');
    expect(signed(0)).toBe('+0');
    expect(signed(-1)).toBe('-1');
  });
});

describe('abilityCell', () => {
  it('prints the score and the modifier it implies', () => {
    expect(abilityCell(18)).toBe('18 (+4)');
    expect(abilityCell('9')).toBe('9 (-1)');
  });

  it('prints a non-numeric score alone', () => {
    expect(abilityCell('—')).toBe('—');
  });
});

describe('challengeValue', () => {
  it('reads whole and fractional ratings', () => {
    expect(challengeValue('3')).toBe(3);
    expect(challengeValue('1/4')).toBe(0.25);
    expect(challengeValue('1/8')).toBe(0.125);
  });

  it('reads a rating that carries its XP', () => {
    expect(challengeValue('3 (700 XP)')).toBe(3);
  });

  it('gives up on an unreadable rating', () => {
    expect(challengeValue('—')).toBeNull();
  });
});

describe('tierBonusFor', () => {
  it('takes one step per three rating, rounded up', () => {
    expect(tierBonusFor(1)).toBe(1);
    expect(tierBonusFor(3)).toBe(1);
    expect(tierBonusFor(4)).toBe(2);
    expect(tierBonusFor(6)).toBe(2);
    expect(tierBonusFor(9)).toBe(3);
    expect(tierBonusFor(16)).toBe(6);
    expect(tierBonusFor(23)).toBe(8);
    expect(tierBonusFor(31)).toBe(11);
  });

  it('floors at one, so a fractional rating still has a bonus', () => {
    expect(tierBonusFor('1/8')).toBe(1);
    expect(tierBonusFor('1/2')).toBe(1);
    expect(tierBonusFor(0)).toBe(1);
  });

  it('reads a rating written with its XP', () => {
    expect(tierBonusFor('3 (700 XP)')).toBe(1);
  });

  it('gives up on an unreadable rating', () => {
    expect(tierBonusFor('—')).toBeNull();
  });
});

describe('ordinal', () => {
  it('suffixes by the last digit', () => {
    expect(ordinal(1)).toBe('1st');
    expect(ordinal(2)).toBe('2nd');
    expect(ordinal(3)).toBe('3rd');
    expect(ordinal(4)).toBe('4th');
    expect(ordinal(21)).toBe('21st');
  });

  it('keeps the teens on th', () => {
    expect(ordinal(11)).toBe('11th');
    expect(ordinal(12)).toBe('12th');
    expect(ordinal(13)).toBe('13th');
  });
});

describe('spellLevelPhrase', () => {
  it('takes an ordinal above zero', () => {
    expect(spellLevelPhrase(1)).toBe('1st-level');
    expect(spellLevelPhrase(3)).toBe('3rd-level');
    expect(spellLevelPhrase('9')).toBe('9th-level');
  });

  it('calls level zero a cantrip', () => {
    expect(spellLevelPhrase(0)).toBe('Cantrip');
    expect(spellLevelPhrase('cantrip')).toBe('Cantrip');
    expect(spellLevelPhrase('Cantrip')).toBe('Cantrip');
  });

  it('gives up on an unreadable level', () => {
    expect(spellLevelPhrase('—')).toBeNull();
  });
});
