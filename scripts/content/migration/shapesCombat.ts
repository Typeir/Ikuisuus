/**
 * @fileoverview Combat dice expression shapes
 * @description Shapes for combat-specific patterns. Ordered by specificity.
 * Each transform returns replacement substring + old matched substring.
 *
 * @module scripts/content/migration/shapesCombat
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { cleanType, normalizeExpr } from './normalizeExpr';
import type { TargetShape } from './types';

function stripBold(s: string): string {
  return s.replace(/^\*+|\*+$/g, '');
}
function boldPrefix(s: string): string {
  const m = s.match(/^(\*+)/);
  return m ? m[1] : '';
}
/** Gets the matched substring from an exec result. */
function matched(m: RegExpExecArray): string {
  return m[0];
}

export const COMBAT_SHAPES: TargetShape[] = [
  {
    name: 'HP_TABLE',
    regex: /\|\s*\**([\d,]+)\**\s*\((\d+d\d+\s*\+\s*\d+)\)\s*\|/,
    transform: (m) => {
      const dice = m[2].replace(/\s+/g, ' ').trim();
      const parts = dice.split(/\s*\+\s*/);
      const n = normalizeExpr(parts[0], parts[1] || null, null);
      return {
        replacement: m[0].replace(`${m[1]} (${dice})`, `${m[1]} (${n})`),
        oldText: m[0],
      };
    },
  },
  {
    name: 'HP_TABLE_NOSPACE',
    regex: /\|\s*\**([\d,]+)\**\s*\((\d+d\d+\+\d+)\)\s*\|/,
    transform: (m) => {
      const parts = m[2].split('+');
      const n = normalizeExpr(parts[0], parts[1] || null, null);
      return {
        replacement: m[0].replace(`${m[1]} (${m[2]})`, `${m[1]} (${n})`),
        oldText: m[0],
      };
    },
  },
  {
    name: 'HIT_PAREN',
    regex:
      /_Hit:_\s+(\d+)\s*\((\d+d\d+\s*\+\s*\d+)\)\**\s+([a-z]+)(?:\s+damage)?([\s,.]*(?:plus|and).*)?/i,
    transform: (m) => {
      const dice = m[2].replace(/\s+/g, ' ').trim();
      const parts = dice.split(/\s*\+\s*/);
      return {
        replacement: `_Hit:_ ${m[1]} (${normalizeExpr(parts[0], parts[1] || null, cleanType(m[3]))})${m[4] || ''}`,
        oldText: matched(m),
      };
    },
  },
  {
    name: 'HIT_BARE',
    regex:
      /_?Hit:?_?\s+\**(\d+d\d+\s*\+\s*\d+)\**\s+([a-z]+)(?:\s+damage)?([\s,.]*(?:plus|and).*)?/i,
    transform: (m) => {
      const raw = m[1];
      const b = boldPrefix(raw);
      const ds = stripBold(raw).trim();
      const parts = ds.split(/\s*\+\s*/).map((p) => p.trim());
      const pf = m[0].startsWith('_') ? '_Hit:_ ' : 'Hit: ';
      return {
        replacement: `${pf}${b}${normalizeExpr(parts[0], parts[1] || null, cleanType(m[2]))}${b}${m[3] || ''}`,
        oldText: matched(m),
      };
    },
  },
  {
    name: 'HIT_BARE_NOTYPE',
    regex: /_?Hit:?_?\s+(\d+d\d+\s*\+\s*\d+)([.\s].*)?/i,
    transform: (m) => {
      const ds = m[1].replace(/\s+/g, ' ').trim();
      const parts = ds.split(/\s*\+\s*/).map((p) => p.trim());
      const pf = m[0].startsWith('_') ? '_Hit:_ ' : 'Hit: ';
      return {
        replacement: `${pf}${normalizeExpr(parts[0], parts[1] || null, null)}${m[2] || ''}`,
        oldText: matched(m),
      };
    },
  },
  {
    name: 'MISS_DMG_MOD',
    regex: /_Miss:_\s+(\d+)\s*\((\d+d\d+)\)\s+([a-z]+)(?:\s+damage)?/i,
    transform: (m) => ({
      replacement: `_Miss:_ ${m[1]} (${normalizeExpr(m[2].trim(), null, cleanType(m[3]))})`,
      oldText: matched(m),
    }),
  },
  {
    name: 'MISS_DMG',
    regex: /_Miss:_\s+(\d+d\d+(?:\s*\+\s*\d+)?)\s+([a-z]+)(?:\s+damage)?/i,
    transform: (m) => {
      const ds = m[1].replace(/\s+/g, ' ').trim();
      const parts = ds.split(/\s*\+\s*/).map((p) => p.trim());
      return {
        replacement: `_Miss:_ ${normalizeExpr(parts[0], parts[1] || null, cleanType(m[2]))}`,
        oldText: matched(m),
      };
    },
  },
  {
    name: 'TAKES_DMG_MOD',
    regex:
      /(?:takes?|taking)\s+(\d+d\d+\s*\+\s*\d+)\s+([a-z]+(?:\s+[a-z]+)*?)(?:\s+damage)?/i,
    transform: (m) => {
      const ds = m[1].replace(/\s+/g, ' ').trim();
      const parts = ds.split(/\s*\+\s*/).map((p) => p.trim());
      return {
        replacement: `${m[0].match(/^(takes?|taking)/i)![0]} ${normalizeExpr(parts[0], parts[1] || null, cleanType(m[2]))}`,
        oldText: matched(m),
      };
    },
  },
  {
    name: 'TAKES_DMG',
    regex:
      /(?:takes?|taking)\s+(\d+d\d+)\s+([a-z]+(?:\s+[a-z]+)*?)(?:\s+damage)?/i,
    transform: (m) => ({
      replacement: `${m[0].match(/^(takes?|taking)/i)![0]} ${normalizeExpr(m[1].trim(), null, cleanType(m[2]))}`,
      oldText: matched(m),
    }),
  },
  {
    name: 'DEALS_DMG_MOD',
    regex:
      /(?:deals?|dealing|inflicts?)\s+(?:an\s+)?(?:extra\s+)?(\d+d\d+\s*\+\s*\d+)\s+([a-z]+(?:\s+[a-z]+)*?)(?:\s+damage)?/i,
    transform: (m) => {
      const ds = m[1].replace(/\s+/g, ' ').trim();
      const parts = ds.split(/\s*\+\s*/).map((p) => p.trim());
      const pfx = m[0].match(
        /^(deals?|dealing|inflicts?)\s+(?:an\s+)?(?:extra\s+)?/i,
      )![0];
      return {
        replacement: `${pfx}${normalizeExpr(parts[0], parts[1] || null, cleanType(m[2]))}`,
        oldText: matched(m),
      };
    },
  },
  {
    name: 'DEALS_DMG',
    regex:
      /(?:deals?|dealing|inflicts?)\s+(?:an\s+)?(?:extra\s+)?(\d+d\d+)\s+([a-z]+(?:\s+[a-z]+)*?)(?:\s+damage)?/i,
    transform: (m) => {
      const pfx = m[0].match(
        /^(deals?|dealing|inflicts?)\s+(?:an\s+)?(?:extra\s+)?/i,
      )![0];
      return {
        replacement: `${pfx}${normalizeExpr(m[1].trim(), null, cleanType(m[2]))}`,
        oldText: matched(m),
      };
    },
  },
];
