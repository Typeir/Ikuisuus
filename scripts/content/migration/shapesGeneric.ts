/**
 * @fileoverview Generic dice expression shapes (recovery, charges, rolls, bare dice)
 * @description Second half of target shapes — non-combat patterns.
 * Each transform returns replacement substring + old matched substring.
 *
 * @module scripts/content/migration/shapesGeneric
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { cleanType, normalizeExpr } from './normalizeExpr';
import type { TargetShape } from './types';

function matched(m: RegExpExecArray): string {
  return m[0];
}

/** Common English stop words that should never be treated as damage types. */
const STOP_WORDS = new Set([
  'for',
  'and',
  'the',
  'each',
  'or',
  'per',
  'at',
  'of',
  'in',
  'to',
  'with',
  'from',
  'this',
  'that',
  'your',
  'its',
  'their',
  'all',
  'a',
  'an',
  'on',
  'by',
  'as',
  'is',
  'it',
  'not',
  'but',
  'also',
  'can',
  'may',
  'if',
  'when',
  'while',
  'after',
  'before',
  'until',
  'equal',
  'plus',
  'minus',
  'any',
  'one',
  'two',
  'three',
  'see',
  'use',
  'make',
  'add',
  'modify',
  'reduces',
  'reduces',
  'instead',
  'level',
  'levels',
  'slot',
  'slots',
  'feet',
  'foot',
  'round',
  'rounds',
  'minute',
  'minutes',
  'hour',
  'hours',
  'target',
  'targets',
  'creature',
  'creatures',
  'point',
  'points',
  'damage',
  'hit',
  'points',
  'save',
  'saving',
  'throw',
  'check',
  'roll',
  'rolls',
  'attack',
  'attacks',
  'action',
  'actions',
  'bonus',
]);

/** Known damage type keywords. If the matched type matches one, it's valid. */
const DAMAGE_TYPES = new Set([
  'bludgeoning',
  'piercing',
  'slashing',
  'fire',
  'cold',
  'lightning',
  'acid',
  'poison',
  'psychic',
  'force',
  'radiant',
  'necrotic',
  'thunder',
  'holy',
  'dark',
  'chemical',
  'true',
  'magical',
]);

/**
 * Checks whether a matched type string is a valid damage type
 * (not a stop word, and either a known type or has 'damage' in the original match).
 *
 * @param {string} type - The matched type string
 * @param {string} fullMatch - The full original match for context
 * @returns {boolean} True if the match should be kept
 */
function isValidType(type: string, fullMatch: string): boolean {
  const lower = type.toLowerCase().trim();
  if (STOP_WORDS.has(lower)) return false;
  if (DAMAGE_TYPES.has(lower)) return true;
  if (/\bdamage\b/i.test(fullMatch)) return true;
  return false;
}

export const GENERIC_SHAPES: TargetShape[] = [
  {
    name: 'STATIC_FIRST',
    regex: /(\d+)\s*\+\s*(\d+d\d+)\s+([a-z]+(?:\s+[a-z]+)*?)(?:\s+damage)?/i,
    transform: (m) => ({
      replacement: normalizeExpr(m[2].trim(), m[1].trim(), cleanType(m[3])),
      oldText: matched(m),
    }),
  },
  {
    name: 'REGAIN_HP_MOD',
    regex: /regains?\s+(\d+d\d+\s*\+\s*\d+)\s+h(?:it|it)\s+p(?:oints|oints)/i,
    transform: (m) => {
      const parts = m[1]
        .replace(/\s+/g, ' ')
        .trim()
        .split(/\s*\+\s*/)
        .map((p) => p.trim());
      return {
        replacement: `regains ${normalizeExpr(parts[0], parts[1] || null, null)} Hit Points`,
        oldText: matched(m),
      };
    },
  },
  {
    name: 'REGAIN_HP_PLAIN',
    regex: /regains?\s+(\d+d\d+)\s+h(?:it|it)\s+p(?:oints|oints)/i,
    transform: (m) => ({
      replacement: `regains ${normalizeExpr(m[1].trim(), null, null)} Hit Points`,
      oldText: matched(m),
    }),
  },
  {
    name: 'CHARGES_RECOVER',
    regex:
      /(?:regain(?:ing|s)?|recover(?:ing|s)?)\s+(\d+)\s*\+\s*(\d+d\d+)\s+charges?/i,
    transform: (m) => {
      const vb = m[0].match(/^(regain(?:ing|s)?|recover(?:ing|s)?)/i)![0];
      return {
        replacement: `${vb} ${m[1].trim()} + ${normalizeExpr(m[2].trim(), null, null)} charges`,
        oldText: matched(m),
      };
    },
  },
  {
    name: 'CHARGES_SIMPLE',
    regex:
      /(?:regain(?:ing|s)?|recover(?:ing|s)?)\s+(\d+d\d+(?:\+?\d+)?)\s+charges?/i,
    transform: (m) => {
      const ds = m[1].replace(/\s+/g, ' ').trim();
      const parts = ds.split(/\s*\+\s*/).map((p) => p.trim());
      const vb = m[0].match(/^(regain(?:ing|s)?|recover(?:ing|s)?)/i)![0];
      return {
        replacement: `${vb} ${normalizeExpr(parts[0], parts[1] || null, null)} charges`,
        oldText: matched(m),
      };
    },
  },
  {
    name: 'CHARGES_HOLDS',
    regex: /holds?\s+(?:up to\s+)?(\d+d\d+(?:\+?\d+)?)\s+charges?/i,
    transform: (m) => {
      const ds = m[1].replace(/\s+/g, ' ').trim();
      const parts = ds.split(/\s*\+\s*/).map((p) => p.trim());
      return {
        replacement: `holds ${normalizeExpr(parts[0], parts[1] || null, null)} charges`,
        oldText: matched(m),
      };
    },
  },
  {
    name: 'ROLL_DICE_MOD',
    regex: /[Rr]oll\s+(?:an?\s+)?(d?\d+d\d+\s*\+\s*\d+)/,
    transform: (m) => {
      const parts = m[1]
        .replace(/\s+/g, ' ')
        .trim()
        .split(/\s*\+\s*/)
        .map((p) => p.trim());
      return {
        replacement: `Roll ${normalizeExpr(parts[0], parts[1] || null, null)}`,
        oldText: matched(m),
      };
    },
  },
  {
    name: 'ROLL_DICE',
    regex: /[Rr]oll\s+(?:an?\s+)?(d?\d+d\d+)/,
    transform: (m) => ({
      replacement: `Roll ${normalizeExpr(m[1].trim(), null, null)}`,
      oldText: matched(m),
    }),
  },
  {
    name: 'PAREN_AVG_MOD',
    regex:
      /(\d+)\s*\((\d+d\d+\s*\+\s*\d+)\)\**\s+([a-z]+(?:\s+[a-z]+)*?)(?:\s+damage)?/i,
    transform: (m) => {
      const parts = m[2]
        .replace(/\s+/g, ' ')
        .trim()
        .split(/\s*\+\s*/)
        .map((p) => p.trim());
      return {
        replacement: `${m[1]} (${normalizeExpr(parts[0], parts[1] || null, cleanType(m[3]))})`,
        oldText: matched(m),
      };
    },
  },
  {
    name: 'PAREN_AVG_PLAIN',
    regex: /(\d+)\s*\((\d+d\d+)\)\**\s+([a-z]+(?:\s+[a-z]+)*?)(?:\s+damage)?/i,
    transform: (m) => ({
      replacement: `${m[1]} (${normalizeExpr(m[2].trim(), null, cleanType(m[3]))})`,
      oldText: matched(m),
    }),
  },
  {
    name: 'DICE_PLUS_DICE',
    regex:
      /(\d+d\d+)\s*\+\s*(\d+d\d+)\s+([a-z]+(?:\s+[a-z]+)*?)(?:\s+damage)?/i,
    transform: (m) => ({
      replacement: normalizeExpr(
        `${m[1].trim()} + ${m[2].trim()}`,
        null,
        cleanType(m[3]),
      ),
      oldText: matched(m),
    }),
  },
  {
    name: 'BARE_DICE_MOD_TYPE',
    regex: /\b(\d+d\d+\s*\+\s*\d+)\s+([a-z]+(?:\s+[a-z]+)*?)(?:\s+damage)?\b/i,
    transform: (m) => {
      const type = cleanType(m[2]);
      if (!isValidType(type, m[0])) return null;
      const parts = m[1]
        .replace(/\s+/g, ' ')
        .trim()
        .split(/\s*\+\s*/)
        .map((p) => p.trim());
      return {
        replacement: normalizeExpr(parts[0], parts[1] || null, type),
        oldText: matched(m),
      };
    },
  },
  {
    name: 'BARE_DICE_TYPE',
    regex: /\b(\d+d\d+)\s+([a-z]+(?:\s+[a-z]+)*?)(?:\s+damage)?\b/i,
    transform: (m) => {
      const type = cleanType(m[2]);
      if (!isValidType(type, m[0])) return null;
      return {
        replacement: normalizeExpr(m[1].trim(), null, type),
        oldText: matched(m),
      };
    },
  },
  {
    name: 'BARE_DICE_MOD',
    regex: /\b(\d+d\d+\s*\+\s*\d+)\b/,
    transform: (m) => {
      const parts = m[1]
        .replace(/\s+/g, ' ')
        .trim()
        .split(/\s*\+\s*/)
        .map((p) => p.trim());
      return {
        replacement: normalizeExpr(parts[0], parts[1] || null, null),
        oldText: matched(m),
      };
    },
  },
  {
    name: 'BARE_DICE',
    regex: /\b(\d+d\d+)\b/,
    transform: (m) => ({
      replacement: normalizeExpr(m[1].trim(), null, null),
      oldText: matched(m),
    }),
  },
];
