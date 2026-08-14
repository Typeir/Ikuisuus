/**
 * @fileoverview HP Expression Grants
 * @description The scalar `hp:<term>:<scope>` grant sub-grammar and its live
 * resolvers. A term is an integer literal or a whitelisted resolver reference; a
 * scope is a level-count multiplier. Values resolve against the live sheet.
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
 * The value term of an `hp` scalar grant: an integer literal or a whitelisted
 * resolver reference evaluated against the sheet.
 *
 * @typedef {object} HpTerm
 * @property {'lit'|'ref'} t - Literal integer or resolver reference
 * @property {number} [v] - Literal value when `t === 'lit'`
 * @property {string} [id] - Lowercase resolver key when `t === 'ref'`
 */
export type HpTerm = { t: 'lit'; v: number } | { t: 'ref'; id: string };

/**
 * The scope of an `hp` scalar grant — a level-count multiplier. `once` = ×1;
 * `level` = × total character level (equal to the count of rolled hit dice);
 * `level-vocation` / `level-specialization` = × the level in that named
 * vocation / specialization.
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
 * sheet returning a finite number. The keyset IS the term whitelist; a term
 * reference outside it is rejected at parse time. Keys are lowercase because
 * grant tags are lowercased before parsing.
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
  intmod: (c) => computeAbilityModifier(c.abilityScores.int),
  wismod: (c) => computeAbilityModifier(c.abilityScores.wis),
  chamod: (c) => computeAbilityModifier(c.abilityScores.cha),
  strscore: (c) => c.abilityScores.str,
  dexscore: (c) => c.abilityScores.dex,
  conscore: (c) => c.abilityScores.con,
  intscore: (c) => c.abilityScores.int,
  wisscore: (c) => c.abilityScores.wis,
  chascore: (c) => c.abilityScores.cha,
  tierbonus: (c) => getCharacterTierBonus(c),
};

const SCALAR_RESOLVER_KEYS = new Set(Object.keys(SCALAR_RESOLVERS));

/**
 * Resolves an {@link HpTerm} to its live numeric value against the sheet: a
 * literal returns its value, a reference invokes its {@link SCALAR_RESOLVERS}
 * entry. An unknown reference (which parsing already rejects) resolves to 0.
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
 * Parses the term segment of an `hp` grant: a signed integer literal or a
 * whitelisted resolver key.
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
 * Parses the scope segment of an `hp` grant into an {@link HpScope}, capturing
 * the slug verbatim for the specific scopes.
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
 * Parses `hp:<term>[:<scope>]` positionally. Term is required; scope defaults
 * to `once`. Does not drop empty segments, so `hp::level` is malformed.
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
