/**
 * @fileoverview HP Expression Grants
 * @description The scalar `hp:<term>:<scope>` grant sub-grammar and its live
 * resolvers.
 *
 * @module modules/character-builder/lib/utils/hpGrants
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { CharacterSheet } from '@/lib/types/character';
import {
    getCharacterTierBonus,
    getTotalCharacterLevel,
} from './characterDerivation';
import { computeAbilityModifier } from './characterStorage';

/**
 * The value term of an `hp` scalar grant
 *
 * @typedef {object} HpTerm
 * @property {'lit'|'ref'} t - Literal integer or resolver reference
 * @property {number} [v] - Literal value when `t === 'lit'`
 * @property {string} [id] - Lowercase resolver key when `t === 'ref'`
 */
export type HpTerm = { t: 'lit'; v: number } | { t: 'ref'; id: string };

/**
 * The scope of an `hp` scalar grant — a level-count multiplier.
 *
 * @typedef {object} HpScope
 * @property {'once'|'level'|'level-vocation'|'level-specialization'} s - Scope kind
 * @property {string} [slug] - Vocation/specialization slug for the specific scopes
 */
export type HpScope =
  | { s: 'once' }
  | { s: 'level' }
  | { s: 'level-vocation'; slug: string }
  | { s: 'level-specialization'; slug: string };

/**
 * The discriminated-union arm a parsed `hp` tag produces.
 *
 * @typedef {object} HpValueGrant
 * @property {'value'} kind - Discriminator marking a scalar value grant
 * @property {'hp'} category - The scalar category (kept a literal, out of `GrantCategory`)
 * @property {HpTerm} term - The per-unit value term
 * @property {HpScope} scope - The level-count multiplier
 */
export interface HpValueGrant {
  kind: 'value';
  category: 'hp';
  term: HpTerm;
  scope: HpScope;
}

/**
 * Live resolvers for `hp` grant term references, each a pure function of the
 * sheet returning a finite number.
 *
 * @constant SCALAR_RESOLVERS
 * @type {Record<string, (character: CharacterSheet) => number>}
 */
export const SCALAR_RESOLVERS: Record<
  string,
  (character: CharacterSheet) => number
> = {
  strmod: (c) => computeAbilityModifier(c.abilityScores.str),
  dexmod: (c) => computeAbilityModifier(c.abilityScores.dex),
  conmod: (c) => computeAbilityModifier(c.abilityScores.con),
  wismod: (c) => computeAbilityModifier(c.abilityScores.wis),
  chamod: (c) => computeAbilityModifier(c.abilityScores.cha),
  strscore: (c) => c.abilityScores.str,
  dexscore: (c) => c.abilityScores.dex,
  conscore: (c) => c.abilityScores.con,
  wisscore: (c) => c.abilityScores.wis,
  chascore: (c) => c.abilityScores.cha,
  tierbonus: (c) => getCharacterTierBonus(c),
};

const SCALAR_RESOLVER_KEYS = new Set(Object.keys(SCALAR_RESOLVERS));

/**
 * Resolves an {@link HpTerm} to its live numeric value against the sheet
 *
 * @function resolveHpTerm
 * @param {HpTerm} term - The parsed term
 * @param {CharacterSheet} character - Character to resolve against
 * @returns {number} The resolved value
 */
export function resolveHpTerm(term: HpTerm, character: CharacterSheet): number {
  if (term.t === 'lit') return term.v;
  const resolver = SCALAR_RESOLVERS[term.id];
  return resolver ? resolver(character) : 0;
}

/**
 * Parses the term segment of an `hp` grant
 *
 * @function parseHpTerm
 * @param {string} raw - Lowercased term segment
 * @returns {HpTerm | null} Parsed term, or `null` when unrecognised
 */
function parseHpTerm(raw: string): HpTerm | null {
  if (/^-?\d+$/.test(raw)) return { t: 'lit', v: parseInt(raw, 10) };
  return SCALAR_RESOLVER_KEYS.has(raw) ? { t: 'ref', id: raw } : null;
}

/**
 * Parses the scope segment of an `hp` grant into an {@link HpScope}
 *
 * @function parseHpScope
 * @param {string} raw - Lowercased scope segment
 * @returns {HpScope | null} Parsed scope, or `null` when malformed
 */
function parseHpScope(raw: string): HpScope | null {
  if (raw === 'once') return { s: 'once' };
  if (raw === 'level') return { s: 'level' };
  const specPrefix = 'level-specialization-';
  const vocPrefix = 'level-vocation-';
  if (raw.startsWith(specPrefix)) {
    const slug = raw.slice(specPrefix.length);
    return slug ? { s: 'level-specialization', slug } : null;
  }
  if (raw.startsWith(vocPrefix)) {
    const slug = raw.slice(vocPrefix.length);
    return slug ? { s: 'level-vocation', slug } : null;
  }
  return null;
}

/**
 * Parses `hp:<term>[:<scope>]` positionally.
 *
 * @function parseHpGrant
 * @param {string[]} segs - Colon-split, lowercased segments (`segs[0] === 'hp'`)
 * @returns {HpValueGrant | null} The parsed value grant, or `null` when malformed
 */
export function parseHpGrant(segs: string[]): HpValueGrant | null {
  const term = parseHpTerm(segs[1] ?? '');
  if (!term) return null;
  const scope = parseHpScope(segs[2] ?? 'once');
  return scope ? { kind: 'value', category: 'hp', term, scope } : null;
}
