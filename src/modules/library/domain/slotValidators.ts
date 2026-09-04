/**
 * @fileoverview Shape rules for slot values.
 * @description The schema knows every slot name; this says what a value for
 * one may look like. A slot with no rule accepts anything, which is most of
 * them — prose slots have no shape to check. The rules exist for values a
 * later step does arithmetic on, where a typo currently fails silently: a
 * challenge rating that will not parse simply drops its derived tier, and an
 * ability score that is not a number prints the typo.
 *
 * Validation is deliberately separate from rendering. A card never rejects a
 * value; the gate reports it, so a page in progress still renders.
 *
 * @module modules/library/domain/slotValidators
 * @version 0.1.0
 * @author Typeir
 * @since 2026-09-04
 */

import { ABILITY_SLOTS, type SlotName } from './slots';

/**
 * A slot value's shape rule.
 *
 * @property {RegExp} pattern - What a valid value matches
 * @property {string} expects - What the rule wants, for the failure message
 */
export interface SlotRule {
  pattern: RegExp;
  expects: string;
}

/** A whole number, with no sign. */
const COUNT = /^\d+$/;

/** A challenge rating: a whole number or one of the low fractions. */
const CHALLENGE = /^(?:\d+|1\/(?:8|4|2))$/;

/** A signed bonus, as a sheet prints one. */
const BONUS = /^[+-]\d+$/;

/** A spell level: zero through twelve, or the word cantrip. */
const SPELL_LEVEL = /^(?:cantrip|\d|1[0-2])$/i;

/**
 * Shape rules by slot name. Every slot absent from this table accepts any
 * value, which is the correct answer for prose.
 */
export const SLOT_RULES: Readonly<Partial<Record<SlotName, SlotRule>>> = {
  ...Object.fromEntries(
    ABILITY_SLOTS.map((name) => [
      name,
      { pattern: COUNT, expects: 'a whole number, such as 18' },
    ]),
  ),
  challenge: {
    pattern: CHALLENGE,
    expects: 'a whole number or 1/8, 1/4, 1/2 — XP belongs in its own slot',
  },
  xp: { pattern: COUNT, expects: 'a whole number of XP, digits only' },
  tierBonus: { pattern: BONUS, expects: 'a signed bonus, such as +4' },
  hitPoints: { pattern: COUNT, expects: 'a whole number of hit points' },
  level: { pattern: /^\d{1,2}$/, expects: 'a whole number' },
};

/**
 * Shape rules that apply only under one host, where a slot means something
 * narrower there than it does elsewhere.
 */
export const HOST_SLOT_RULES: Readonly<
  Record<string, Readonly<Partial<Record<SlotName, SlotRule>>>>
> = {
  Spell: {
    level: {
      pattern: SPELL_LEVEL,
      expects: 'a level from 0 to 12, or the word cantrip',
    },
  },
};

/**
 * A slot value's failure, if it has one.
 *
 * @param {SlotName} name - Slot name
 * @param {string} value - Authored value
 * @param {string} [host] - Host component name
 * @returns {string | null} What the rule expected, or null when the value passes
 *
 * @example
 * slotFailure('str', '18'); // null
 * slotFailure('str', 'banana'); // 'a whole number, such as 18'
 */
export function slotFailure(
  name: SlotName,
  value: string,
  host?: string,
): string | null {
  const rule =
    (host ? HOST_SLOT_RULES[host]?.[name] : undefined) ?? SLOT_RULES[name];
  if (!rule) return null;
  return rule.pattern.test(value.trim()) ? null : rule.expects;
}
