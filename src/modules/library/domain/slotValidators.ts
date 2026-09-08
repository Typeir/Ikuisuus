/**
 * @fileoverview Shape rules for slot values.
 * @description The schema knows every slot name; this says what a value for
 * one may look like.
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

/** A whole number, with the thousands separators a sheet writes. */
const GROUPED_COUNT = /^(?:\d+|\d{1,3}(?:,\d{3})+)$/;

/** Hit points as a sheet writes them */
const HIT_POINTS = /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\s*\(.+\))?$/;

/** A challenge rating */
const CHALLENGE = /^(?:\d+|1\/(?:8|4|2))$/;

/** A signed bonus, as a sheet prints one. */
const BONUS = /^[+-]\d+$/;

/** A signed bonus, optionally followed by the note a sheet prints beside it */
const BONUS_WITH_NOTE = /^[+-]\d+(?: \([^()]+\))?$/;

/**
 * What a block contests with
 */
const CONTEST = /^(?:[+-]\d+(?: \([^()]+\))?|[A-Za-z][^+]*(?: \+ [^+]+)*)$/;

/**
 * What a block's save is taken against
 */
const SAVE_DC = /^(?:\d{1,2}|\d{1,2} (?:plus|\+) .+)$/;

/** A spell level */
const SPELL_LEVEL = /^(?:cantrip|\d|1[0-2])$/i;

/**
 * Shape rules by slot name.
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
  xp: { pattern: GROUPED_COUNT, expects: 'a whole number of XP, such as 10000' },
  tierBonus: { pattern: BONUS, expects: 'a signed bonus, such as +4' },
  saveDc: {
    pattern: SAVE_DC,
    expects:
      'the number a sheet prints, such as 18, or the sum a page works out, such as 10 plus your accuracy',
  },
  accuracy: {
    pattern: CONTEST,
    expects:
      'a signed bonus, such as +7, or the terms it adds up, such as your level + your tier bonus — the bonus alone, since a save against it is 10 plus this',
  },
  hitPoints: {
    pattern: HIT_POINTS,
    expects: 'a whole number of hit points, with the dice in parentheses if you like',
  },
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
  Monster: {
    saveDc: {
      pattern: COUNT,
      expects: 'a fixed DC, digits only — a DC that is a formula stays in the prose',
    },
  },
  Attack: {
    accuracy: {
      pattern: BONUS_WITH_NOTE,
      expects:
        'a signed bonus, such as +7, with a parenthetical note after it if the attack needs one — a sheet prints the number, not how it was reached',
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
