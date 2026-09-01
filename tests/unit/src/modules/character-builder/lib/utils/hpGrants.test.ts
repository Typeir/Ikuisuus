/**
 * @fileoverview HP expression-grant tests
 * @description Verifies the `hp:<term>:<scope>` sub-grammar parser, the term
 * resolver registry, and live term resolution against a sheet.
 *
 * @module tests/unit/src/modules/character-builder/lib/utils/hpGrants.test
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { CharacterSheet } from '@/lib/types/character';
import {
  SCALAR_RESOLVERS,
  parseHpGrant,
  resolveHpTerm,
} from '@/modules/character-builder/lib/utils/hpGrants';
import { describe, expect, it } from 'vitest';

const character = (over: Partial<CharacterSheet>): CharacterSheet =>
  ({
    abilityScores: { str: 10, dex: 10, con: 14, int: 10, wis: 10, cha: 10 },
    experience: 0,
    level: 6,
    vocations: [],
    ...over,
  }) as unknown as CharacterSheet;

describe('parseHpGrant', () => {
  it('parses a literal term with a level scope', () => {
    expect(parseHpGrant(['hp', '1', 'level'])).toEqual({
      kind: 'value',
      category: 'hp',
      term: { t: 'lit', v: 1 },
      scope: { s: 'level' },
    });
  });

  it('defaults the scope to once when omitted', () => {
    expect(parseHpGrant(['hp', '3'])).toEqual({
      kind: 'value',
      category: 'hp',
      term: { t: 'lit', v: 3 },
      scope: { s: 'once' },
    });
  });

  it('parses a reference term with a vocation-scoped level', () => {
    expect(parseHpGrant(['hp', 'conmod', 'level-vocation-scion'])).toEqual({
      kind: 'value',
      category: 'hp',
      term: { t: 'ref', id: 'conmod' },
      scope: { s: 'level-vocation', slug: 'scion' },
    });
  });

  it('rejects an unknown term, empty term, or malformed scope', () => {
    expect(parseHpGrant(['hp', 'bogus'])).toBeNull();
    expect(parseHpGrant(['hp', '', 'level'])).toBeNull();
    expect(parseHpGrant(['hp', '1', 'level-vocation-'])).toBeNull();
    expect(parseHpGrant(['hp', '1', 'nope'])).toBeNull();
  });
});

describe('resolveHpTerm', () => {
  it('returns a literal value directly', () => {
    expect(resolveHpTerm({ t: 'lit', v: 5 }, character({}))).toBe(5);
  });

  it('resolves conMod from the sheet', () => {
    expect(resolveHpTerm({ t: 'ref', id: 'conmod' }, character({}))).toBe(2);
  });

  it('resolves an unknown reference to 0', () => {
    expect(resolveHpTerm({ t: 'ref', id: 'nope' }, character({}))).toBe(0);
  });
});

describe('SCALAR_RESOLVERS', () => {
  it('exposes ability mods, raw scores, and tierBonus', () => {
    const c = character({});
    expect(SCALAR_RESOLVERS.conmod(c)).toBe(2);
    expect(SCALAR_RESOLVERS.conscore(c)).toBe(14);
    expect(SCALAR_RESOLVERS.tierbonus(c)).toBe(2);
  });
});
