/**
 * @fileoverview Monster-Specific Token Recognizers
 * @description Pure-function token recognizers for monster stat block parsing.
 * Handles attack lines, hit lines, multiattack, deed costs, phase thresholds,
 * declare/resolve markers, auto-fail, and charge-recharge notations. All regex
 * patterns and lookup tables are imported from the centralized featurePatterns
 * module.
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
 * "_Melee Weapon Attack:_ +7 to hit, reach 5 ft".
 *
 * @param {string} text - Input text
 * @returns {AttackToken | null} Parsed attack token or null
 */
export function recognizeAttackLine(text: string): AttackToken | null {
  const match = text.match(MONSTER.attackLine);
  if (!match) return null;
  const attackType =
    match[2].toLowerCase() === 'spell'
      ? ('spell' as const)
      : match[1].toLowerCase() === 'melee'
        ? ('melee' as const)
        : ('ranged' as const);
  const bonus = parseInt(match[3], 10);
  const result: AttackToken = { type: attackType, bonus, targets: '' };
  const reachMatch = text.match(DISTANCE.reach);
  if (reachMatch) {
    result.reach = parseInt(reachMatch[1], 10);
  }
  const rangeMatch = text.match(DISTANCE.range);
  if (rangeMatch) {
    result.range = { normal: parseInt(rangeMatch[1], 10) };
    if (rangeMatch[2]) {
      result.range.long = parseInt(rangeMatch[2], 10);
    }
  }
  const targetsMatch = text.match(MONSTER.targets);
  if (targetsMatch) {
    result.targets = targetsMatch[0].toLowerCase();
  }
  return result;
}

/**
 * Recognizes a hit/damage line like "_Hit:_ 12 (2d8 + 3) slashing damage".
 *
 * @param {string} text - Input text
 * @returns {HitToken | null} Parsed hit token or null
 */
export function recognizeHitLine(text: string): HitToken | null {
  const match = text.match(MONSTER.hitLine);
  if (!match) return null;
  const result: HitToken = {
    average: parseInt(match[1], 10),
    dice: match[2].trim(),
  };
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
