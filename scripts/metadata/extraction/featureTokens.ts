/**
 * @fileoverview Shared Feature Token Recognizers
 * @description Pure-function token recognizers for the feature extraction
 * pipeline. Each recognizer takes a text string and returns a parsed token
 * or null. All regex patterns and lookup tables are imported from the
 * centralized featurePatterns module.
 *
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 * @module scripts/metadata/extraction/featureTokens
 */

import type {
    ActionToken,
    DamageToken,
    DCToken,
    DiceToken,
    DurationToken,
    RangeToken,
    RechargeToken,
    ResourceToken,
    SaveToken,
    TemplateToken,
} from '@/lib/types/feature';
import {
    ABILITY_MAP,
    ABILITY_SHORTS,
    ACTIONS,
    DAMAGE_TYPES,
    DICE,
    DISTANCE,
    DURATION,
    RECHARGE_TIMINGS,
    RESOURCE_ENTRIES,
    RESOURCES,
    SAVES,
    SHAPES,
    TEMPLATES,
} from './featurePatterns';

/**
 * Recognizes a dice expression like "2d6", "1d8+3", "3d10 + STR".
 *
 * @param {string} text - Input text
 * @returns {DiceToken | null} Parsed dice token or null
 */
export function recognizeDice(text: string): DiceToken | null {
  const match = text.match(DICE.full);
  if (!match) return null;
  const result: DiceToken = {
    count: parseInt(match[1], 10),
    sides: parseInt(match[2], 10),
  };
  if (match[3] && match[4]) {
    result.modifier = `${match[3]}${match[4].trim()}`;
  }
  return result;
}

/**
 * Recognizes a damage expression like "2d6 fire damage" or "3d8+4 necrotic".
 *
 * @param {string} text - Input text
 * @returns {DamageToken | null} Parsed damage token or null
 */
export function recognizeDamage(text: string): DamageToken | null {
  const dice = recognizeDice(text);
  if (!dice) return null;
  const afterDice = text.slice(
    text.search(DICE.bare) + text.match(DICE.bare)![0].length,
  );
  const words = afterDice
    .toLowerCase()
    .split(/[\s,()]+/)
    .filter(Boolean);
  for (const word of words) {
    if (word === 'damage') continue;
    if (DAMAGE_TYPES.has(word)) {
      return { dice, type: word };
    }
  }
  return { dice };
}

/**
 * Recognizes a DC expression like "DC 16", "DC = 8 + Prof + CHA mod".
 *
 * @param {string} text - Input text
 * @returns {DCToken | null} Parsed DC token or null
 */
export function recognizeDC(text: string): DCToken | null {
  const formulaMatch = text.match(SAVES.dcFormula);
  if (formulaMatch) {
    return { formula: formulaMatch[1].trim() };
  }
  const flatMatch = text.match(SAVES.dcFlat);
  if (flatMatch) {
    return { flat: parseInt(flatMatch[1], 10) };
  }
  return null;
}

/**
 * Recognizes a saving throw like "Wisdom saving throw" or "DEX save".
 *
 * @param {string} text - Input text
 * @returns {SaveToken | null} Parsed save token or null
 */
export function recognizeSave(text: string): SaveToken | null {
  const match = text.match(SAVES.savingThrow);
  if (!match) return null;
  const rawAbility = match[1].toLowerCase();
  const ability = ABILITY_MAP[rawAbility] ?? rawAbility;
  if (!ABILITY_SHORTS.has(ability)) return null;
  const dc = recognizeDC(text);
  return { ability, dc: dc ?? {} };
}

/**
 * Recognizes a range or area expression like "30-foot cone" or "60 ft radius".
 *
 * @param {string} text - Input text
 * @returns {RangeToken | null} Parsed range token or null
 */
export function recognizeRange(text: string): RangeToken | null {
  const match = text.match(DISTANCE.feet);
  if (!match) return null;
  const result: RangeToken = {
    distance: parseInt(match[1], 10),
  };
  const afterDist = text.slice(match.index! + match[0].length).toLowerCase();
  const beforeDist = text.slice(0, match.index!).toLowerCase();
  const combined = `${beforeDist} ${afterDist}`;
  for (const shape of Array.from(SHAPES)) {
    if (combined.includes(shape)) {
      result.shape = shape;
      break;
    }
  }
  const widthMatch = text.match(DISTANCE.wide);
  if (widthMatch) {
    result.width = parseInt(widthMatch[1], 10);
  }
  const heightMatch = text.match(DISTANCE.high);
  if (heightMatch) {
    result.height = parseInt(heightMatch[1], 10);
  }
  return result;
}

/**
 * Recognizes a resource reference like "2 charges", "1 spell slot", "3 BP".
 *
 * @param {string} text - Input text
 * @returns {ResourceToken | null} Parsed resource token or null
 */
export function recognizeResource(text: string): ResourceToken | null {
  for (const { regex, type } of RESOURCE_ENTRIES) {
    const match = text.match(regex);
    if (match) {
      return { type, amount: parseInt(match[1], 10) };
    }
  }
  return null;
}

/**
 * Recognizes a recharge condition like "short rest", "Recharges at dawn".
 *
 * @param {string} text - Input text
 * @returns {RechargeToken | null} Parsed recharge token or null
 */
export function recognizeRecharge(text: string): RechargeToken | null {
  const lower = text.toLowerCase();
  for (const { pattern, timing } of RECHARGE_TIMINGS) {
    if (lower.includes(pattern)) {
      const amountMatch = lower.match(RESOURCES.rechargeAmount);
      return {
        timing,
        amount: amountMatch ? parseInt(amountMatch[1], 10) : undefined,
      };
    }
  }
  const onceMatch = lower.match(RESOURCES.oncePer);
  if (onceMatch) {
    return { timing: `once_per_${onceMatch[1]}`, amount: 1 };
  }
  const rechargeMatch = lower.match(RESOURCES.rechargeAfter);
  if (rechargeMatch) {
    return { timing: rechargeMatch[1].trim() };
  }
  return null;
}

/**
 * Recognizes an action type like "action", "bonus action", "reaction".
 *
 * @param {string} text - Input text
 * @returns {ActionToken | null} Parsed action token or null
 */
export function recognizeAction(text: string): ActionToken | null {
  const lower = text.toLowerCase();
  if (ACTIONS.bonusAction.test(lower)) return { type: 'bonus_action' };
  if (ACTIONS.reaction.test(lower)) return { type: 'reaction' };
  if (ACTIONS.freeAction.test(lower)) return { type: 'free' };
  if (ACTIONS.passive.test(lower)) return { type: 'passive' };
  if (
    ACTIONS.action.test(lower) &&
    !ACTIONS.bonus.test(lower) &&
    !ACTIONS.free.test(lower)
  ) {
    return { type: 'action' };
  }
  return null;
}

/**
 * Recognizes a duration expression like "1 minute", "until dismissed".
 *
 * @param {string} text - Input text
 * @returns {DurationToken | null} Parsed duration token or null
 */
export function recognizeDuration(text: string): DurationToken | null {
  const lower = text.toLowerCase();
  const concentration = DURATION.concentration.test(lower);
  if (DURATION.instantaneous.test(lower)) {
    return { value: 'instant', concentration: false };
  }
  if (concentration) {
    const upToMatch = lower.match(DURATION.upTo);
    if (upToMatch) {
      const value = `up to ${upToMatch[1]} ${upToMatch[2]}${parseInt(upToMatch[1], 10) > 1 ? 's' : ''}`;
      return { value, concentration: true };
    }
  }
  const timeMatch = lower.match(DURATION.timeUnit);
  if (timeMatch) {
    const value = `${timeMatch[1]} ${timeMatch[2]}${parseInt(timeMatch[1], 10) > 1 ? 's' : ''}`;
    return { value, concentration };
  }
  if (DURATION.untilDismissed.test(lower)) {
    return { value: 'until dismissed', concentration };
  }
  if (DURATION.untilEndOfTurn.test(lower)) {
    return { value: 'until end of turn', concentration };
  }
  if (concentration) {
    return { value: 'concentration', concentration: true };
  }
  return null;
}

/**
 * Recognizes a template expression like "your Wisdom modifier" or
 * "your tier bonus".
 *
 * @param {string} text - Input text
 * @returns {TemplateToken | null} Parsed template token or null
 */
export function recognizeTemplate(text: string): TemplateToken | null {
  const modMatch = text.match(TEMPLATES.abilityModifier);
  if (modMatch) {
    const short = ABILITY_MAP[modMatch[1].toLowerCase()];
    return { expr: `ability:${short?.toUpperCase() ?? modMatch[1]}` };
  }
  if (TEMPLATES.tierBonus.test(text)) {
    return { expr: 'tier' };
  }
  const levelMatch = text.match(TEMPLATES.classLevel);
  if (levelMatch) {
    return { expr: `level:${levelMatch[1]}` };
  }
  const formulaMatch = text.match(TEMPLATES.compositeFormula);
  if (formulaMatch) {
    return { expr: `${formulaMatch[1]}+Tier+${formulaMatch[2].toUpperCase()}` };
  }
  return null;
}
