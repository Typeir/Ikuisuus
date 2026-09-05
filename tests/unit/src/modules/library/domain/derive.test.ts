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
  XP_BY_CHALLENGE,
  abilityCell,
  abilityModifier,
  challengeFor,
  challengeLabel,
  challengeValue,
  ordinal,
  signed,
  spellLevelPhrase,
  tierBonusFor,
  xpFor,
  xpValue,
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

describe('XP_BY_CHALLENGE', () => {
  it('rises with the rating, so every XP value falls in exactly one band', () => {
    for (let i = 1; i < XP_BY_CHALLENGE.length; i++) {
      expect(XP_BY_CHALLENGE[i][0]).toBeGreaterThan(XP_BY_CHALLENGE[i - 1][0]);
      expect(XP_BY_CHALLENGE[i][1]).toBeGreaterThan(XP_BY_CHALLENGE[i - 1][1]);
    }
  });
});

describe('xpFor', () => {
  it('reads the XP a rating awards', () => {
    expect(xpFor(3)).toBe(700);
    expect(xpFor('13')).toBe(10000);
    expect(xpFor('1/4')).toBe(50);
    expect(xpFor(0)).toBe(10);
    expect(xpFor(31)).toBe(325000);
    expect(xpFor(35)).toBe(425000);
  });

  it('gives up on a rating that is not on the table', () => {
    expect(xpFor('—')).toBeNull();
    expect(xpFor(2.5)).toBeNull();
    expect(xpFor(99)).toBeNull();
  });
});

describe('xpValue', () => {
  it('reads XP with or without thousands separators', () => {
    expect(xpValue('700')).toBe(700);
    expect(xpValue('10,000')).toBe(10000);
    expect(xpValue(450)).toBe(450);
  });

  it('gives up on anything else', () => {
    expect(xpValue('700 XP')).toBeNull();
    expect(xpValue('')).toBeNull();
  });
});

describe('challengeFor', () => {
  it('returns the rating whose XP band the value falls in', () => {
    expect(challengeFor(700)).toBe(3);
    expect(challengeFor('10,000')).toBe(13);
    expect(challengeFor(800)).toBe(3);
    expect(challengeFor(1099)).toBe(3);
    expect(challengeFor(1100)).toBe(4);
    expect(challengeFor(50)).toBe(0.25);
  });

  it('floors below the table and caps above it', () => {
    expect(challengeFor(1)).toBe(0);
    expect(challengeFor(999999)).toBe(35);
  });

  it('gives up on unreadable XP', () => {
    expect(challengeFor('lots')).toBeNull();
  });

  it('inverts xpFor at every rating on the table', () => {
    for (const [rating, xp] of XP_BY_CHALLENGE) {
      expect(challengeFor(xp), String(rating)).toBe(rating);
    }
  });
});

describe('challengeLabel', () => {
  it('writes the low ratings as fractions', () => {
    expect(challengeLabel(0.125)).toBe('1/8');
    expect(challengeLabel(0.25)).toBe('1/4');
    expect(challengeLabel(0.5)).toBe('1/2');
    expect(challengeLabel(0)).toBe('0');
    expect(challengeLabel(13)).toBe('13');
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
