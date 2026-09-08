/**
 * @fileoverview Monster-Specific Token Recognizers
 * @description Pure-function token recognizers for monster stat block parsing.
 *
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 * @module scripts/metadata/extraction/monsterTokens
 */

import { plain } from '../textUtils';
import type {
    AttackToken,
    AutoFailToken,
    ChargeRechargeToken,
    DeclareResolveToken,
    DeedCostToken,
    HitToken,
    MultiattackToken,
    PhaseToken,
} from '@/lib/types/feature';
import {
    DAMAGE_TYPES,
    DISTANCE,
    MONSTER,
    SAVES,
    WORD_NUMBERS,
} from './featurePatterns';

/**
 * Recognizes a monster attack line like
 * "_Melee Weapon Attack:_ +7 to hit
 *
 * @param {string} text - Input text
 * @returns {AttackToken | null} Parsed attack token or null
 */
export function recognizeAttackLine(text: string): AttackToken | null {
  const legacy = text.match(MONSTER.attackLine);
  const slot = legacy ? null : text.match(MONSTER.accuracySlot);
  if (!legacy && !slot) return null;

  const reachSlot = text.match(MONSTER.reachSlot);
  const rangeSlot = text.match(MONSTER.rangeSlot);

  /* An accuracy alone is a caster's, not an attack's: a spellcasting block
     states what it hits with and never how far it reaches, so without a reach,
     a range, or the words that name a spell attack there is no attack here. */
  if (slot && !reachSlot && !rangeSlot && !MONSTER.spellAttack.test(text)) {
    return null;
  }

  /* A block that reaches is melee and one that ranges is ranged; a block that
     says it casts is a spell attack whichever way it reaches. */
  const type = MONSTER.spellAttack.test(text)
    ? ('spell' as const)
    : legacy
      ? legacy[2].toLowerCase() === 'spell'
        ? ('spell' as const)
        : legacy[1].toLowerCase() === 'melee'
          ? ('melee' as const)
          : ('ranged' as const)
      : rangeSlot && !reachSlot
        ? ('ranged' as const)
        : ('melee' as const);

  const bonus = parseInt(legacy ? legacy[3] : slot![1], 10);
  const result: AttackToken = { type, bonus, targets: '' };

  const reach = reachSlot ?? text.match(DISTANCE.reach);
  if (reach) result.reach = parseInt(reach[1], 10);

  const range = rangeSlot ?? text.match(DISTANCE.range);
  if (range) {
    result.range = { normal: parseInt(range[1], 10) };
    if (range[2]) result.range.long = parseInt(range[2], 10);
  }

  const targetsMatch = text.match(MONSTER.targets);
  if (targetsMatch) {
    result.targets = targetsMatch[0].toLowerCase();
  }
  return result;
}

/**
 * Recognizes a hit and its damage.
 *
 * @description The corpus writes `On a hit, 21 ([% 3d6 +10 slashing %])` and
 * `**Hit**: [% 4d12 +8 force %]`; the average before the dice is optional
 *
 * @param {string} text - Input text
 * @returns {HitToken | null} Parsed hit token or null
 */
export function recognizeHitLine(text: string): HitToken | null {
  const match = text.match(MONSTER.hitLine);
  if (!match || !match[2]) return null;
  const result: HitToken = { dice: match[2].trim() };
  if (match[1]) result.average = parseInt(match[1], 10);
  if (match[3]) {
    const typeLower = match[3].toLowerCase();
    if (DAMAGE_TYPES.has(typeLower)) {
      result.type = typeLower;
    }
  }
  return result;
}

/**
 * Recognizes a multiattack description like
 * "makes two claw attacks and one bite attack".
 *
 * @param {string} text - Input text
 * @returns {MultiattackToken | null} Parsed multiattack token or null
 */
export function recognizeMultiattack(text: string): MultiattackToken | null {
  if (!MONSTER.multiattack.test(text)) return null;
  const segments = text.split(/\band\b|\bor\b/i);
  const attacks: { name: string; count: number }[] = [];
  for (const segment of segments) {
    const match = segment.match(MONSTER.attackSegment);
    if (!match) continue;
    const countWord = match[1].toLowerCase();
    const count = WORD_NUMBERS[countWord] ?? parseInt(countWord, 10);
    if (isNaN(count)) continue;
    attacks.push({ name: plain(match[2]).toLowerCase(), count });
  }
  if (attacks.length === 0) return null;
  const hasOr = /\bor\b/i.test(text);
  const hasAnd = /\band\b/i.test(text);
  let mode: 'all' | 'exclusive' | 'flexible' = 'all';
  if (hasOr && !hasAnd) mode = 'exclusive';
  else if (hasOr && hasAnd) mode = 'flexible';
  const conditionMatch = text.match(MONSTER.condition);
  return {
    attacks,
    mode,
    condition: conditionMatch ? conditionMatch[1].trim() : undefined,
  };
}

/**
 * Recognizes a legendary deed cost like "(Costs 2 Deeds)".
 *
 * @param {string} text - Input text
 * @returns {DeedCostToken | null} Parsed deed cost token or null
 */
export function recognizeDeedCost(text: string): DeedCostToken | null {
  const match = text.match(MONSTER.deedCost);
  if (!match) return null;
  return { cost: parseInt(match[1], 10) };
}

/**
 * Recognizes a phase threshold like "Wounded (75%)" or "Slain".
 *
 * @param {string} text - Input text
 * @returns {PhaseToken | null} Parsed phase token or null
 */
export function recognizePhaseThreshold(text: string): PhaseToken | null {
  const nameMatch = text.match(MONSTER.phaseThreshold);
  if (nameMatch) {
    return {
      name: plain(nameMatch[1]).toLowerCase(),
      threshold: parseInt(nameMatch[2], 10),
    };
  }
  if (MONSTER.phaseSlain.test(text)) {
    return { name: 'slain', threshold: 'slain' };
  }
  return null;
}

/**
 * Recognizes a declare/resolve marker in stratagem text.
 *
 * @param {string} text - Input text
 * @returns {DeclareResolveToken | null} Parsed declare/resolve token or null
 */
export function recognizeDeclareResolve(
  text: string,
): DeclareResolveToken | null {
  const match = text.match(MONSTER.declareResolve);
  if (!match) return null;
  return { phase: match[1].toLowerCase() as 'declare' | 'resolve' };
}

/**
 * Recognizes an auto-fail/auto-succeed saving throw mechanic.
 *
 * @param {string} text - Input text
 * @returns {AutoFailToken | null} Parsed auto-fail token or null
 */
export function recognizeAutoFail(text: string): AutoFailToken | null {
  const match = text.match(SAVES.autoFail);
  if (!match) return null;
  return { fails: match[1].toLowerCase().startsWith('fail') };
}

/**
 * Recognizes a charge-recharge notation like "(3 charges, Recharge 5-6)".
 *
 * @param {string} text - Input text
 * @returns {ChargeRechargeToken | null} Parsed charge-recharge token or null
 */
export function recognizeChargeRecharge(
  text: string,
): ChargeRechargeToken | null {
  const match = text.match(MONSTER.chargeRecharge);
  if (!match) return null;
  const min = parseInt(match[2], 10);
  return {
    charges: parseInt(match[1], 10),
    min,
    max: match[3] ? parseInt(match[3], 10) : min,
  };
}
