/**
 * @fileoverview Aspect Extractors
 * @description Derives faceted aspects from content text. Each function owns one
 * group and returns fully-qualified aspects (`resistance:fire`,
 * `sense:darkvision`). Judgement facets — `source:`, `access:`, `myth:`,
 * `theme:` — are authored, with no extractor.
 *
 * @module lib/metadata/aspectExtractors
 * @version 1.0.0
 * @author Typeir
 * @since 3.1.0
 */

import {
  COVER,
  DAMAGE_REDUCTION,
  DELIVERY,
  FEET_PER_STRIDE,
  MOVEMENT_EXTRA,
  PHASE,
  POSITION,
  RANGE,
  RANGE_BANDS,
  RESOURCE,
  RETALIATION,
  ROLL,
  SCALING,
  SCOPED_DEFENCE,
  SENSE,
  TEMPO,
} from './aspectPatterns';
import { GameData } from './gameData';
import type { SharedData } from './sharedData';

/**
 * Collects the members of a vocabulary that appear in a clause.
 *
 * @param {string} clause - Text following a defence keyword
 * @param {string[]} vocabulary - Damage types or conditions to look for
 * @returns {string[]} Matching vocabulary entries
 */
function matchesIn(clause: string, vocabulary: string[]): string[] {
  const found: string[] = [];
  for (const entry of vocabulary) {
    if (new RegExp(`\\b${entry}\\b`, 'i').test(clause)) found.push(entry);
  }
  return found;
}

/**
 * Runs a global pattern over text and returns every captured clause.
 *
 * @param {RegExp} pattern - Global pattern with one capture group
 * @param {string} text - Content to scan
 * @returns {string[]} Captured clauses
 */
function captureAll(pattern: RegExp, text: string): string[] {
  const clauses: string[] = [];
  const scanner = new RegExp(pattern.source, pattern.flags);

  let match;
  while ((match = scanner.exec(text)) !== null) {
    if (match[1]) clauses.push(match[1]);
  }

  return clauses;
}

/**
 * Extract scoped defence aspects naming what is resisted, ignored or amplified.
 * Immunity also matches conditions.
 *
 * @param {string} text - Content to analyze
 * @param {SharedData} sharedData - Shared game data
 * @returns {string[]} Array of resistance, immunity and vulnerability aspects
 */
export function extractScopedDefenceTags(
  text: string,
  sharedData: SharedData,
): string[] {
  const tags: string[] = [];
  const damageTypes = GameData.getDamageTypes(sharedData);
  const conditions = GameData.getConditions(sharedData);

  for (const clause of captureAll(SCOPED_DEFENCE.resistance, text)) {
    for (const type of matchesIn(clause, damageTypes)) {
      tags.push(`resistance:${type}`);
    }
  }

  for (const clause of captureAll(SCOPED_DEFENCE.immunity, text)) {
    for (const value of matchesIn(clause, [...damageTypes, ...conditions])) {
      tags.push(`immunity:${value}`);
    }
  }

  for (const clause of captureAll(SCOPED_DEFENCE.vulnerability, text)) {
    for (const type of matchesIn(clause, damageTypes)) {
      tags.push(`vulnerability:${type}`);
    }
  }

  if (DAMAGE_REDUCTION.reduction.test(text)) tags.push('defense:reduction');

  return tags;
}

/**
 * Extract the retaliation aspect for damage returned to an attacker.
 *
 * @param {string} text - Content to analyze
 * @returns {string[]} The retaliation aspect, or an empty array
 */
export function extractRetaliationTags(text: string): string[] {
  return RETALIATION.retaliation.test(text) ? ['mechanic:retaliation'] : [];
}

/**
 * Extract roll-modifier aspects.
 *
 * @param {string} text - Content to analyze
 * @returns {string[]} Array of mechanic aspects for roll modifiers
 */
export function extractRollTags(text: string): string[] {
  const tags: string[] = [];

  if (ROLL.advantage.test(text)) tags.push('mechanic:advantage');
  if (ROLL.disadvantage.test(text)) tags.push('mechanic:disadvantage');
  if (ROLL.critical.test(text)) tags.push('mechanic:crit');
  if (ROLL.reroll.test(text)) tags.push('mechanic:reroll');

  return tags;
}

/**
 * Extract perception aspects covering special senses and lighting.
 *
 * @param {string} text - Content to analyze
 * @param {SharedData} sharedData - Shared game data
 * @returns {string[]} Array of sense aspects
 */
export function extractSenseTags(
  text: string,
  sharedData: SharedData,
): string[] {
  const tags: string[] = [];

  for (const sense of GameData.getSenses(sharedData)) {
    if (new RegExp(`\\b${sense}\\b`, 'i').test(text)) tags.push(`sense:${sense}`);
  }

  if (SENSE.brightLight.test(text)) tags.push('sense:bright');
  if (SENSE.dimLight.test(text)) tags.push('sense:dim');
  if (SENSE.magicalDarkness.test(text)) tags.push('sense:magical-darkness');
  else if (SENSE.darkness.test(text)) tags.push('sense:darkness');
  if (SENSE.lightlyObscured.test(text)) tags.push('sense:lightly-obscured');
  if (SENSE.heavilyObscured.test(text)) tags.push('sense:heavily-obscured');
  if (SENSE.concealed.test(text)) tags.push('sense:concealed');

  return tags;
}

/**
 * Extract health-phase aspects.
 *
 * @param {string} text - Content to analyze
 * @returns {string[]} Array of phase aspects
 */
export function extractPhaseTags(text: string): string[] {
  const tags: string[] = [];

  if (PHASE.wounded.test(text)) tags.push('phase:wounded');
  if (PHASE.bloodied.test(text)) tags.push('phase:bloodied');
  if (PHASE.doomed.test(text)) tags.push('phase:doomed');
  if (PHASE.slain.test(text)) tags.push('phase:slain');

  return tags;
}

/**
 * Extract tactical position and cover aspects.
 *
 * @param {string} text - Content to analyze
 * @returns {string[]} Array of position and cover aspects
 */
export function extractTacticalTags(text: string): string[] {
  const tags: string[] = [];

  if (POSITION.charging.test(text)) tags.push('position:charging');
  if (POSITION.flanking.test(text)) tags.push('position:flanking');
  if (POSITION.highGround.test(text)) tags.push('position:high-ground');
  if (POSITION.mounted.test(text)) tags.push('position:mounted');
  if (POSITION.underwater.test(text)) tags.push('position:underwater');

  if (COVER.half.test(text)) tags.push('cover:half');
  if (COVER.threeQuarters.test(text)) tags.push('cover:three-quarters');
  if (COVER.total.test(text)) tags.push('cover:total');
  if (COVER.grants.test(text)) tags.push('cover:grants');
  if (COVER.ignores.test(text)) tags.push('cover:ignores');

  return tags;
}

/**
 * Extract delivery aspects describing how an effect reaches its target.
 *
 * @param {string} text - Content to analyze
 * @returns {string[]} Array of delivery aspects
 */
export function extractDeliveryTags(text: string): string[] {
  const tags: string[] = [];

  if (DELIVERY.self.test(text)) tags.push('delivery:self');
  if (DELIVERY.touch.test(text)) tags.push('delivery:touch');
  if (DELIVERY.attack.test(text)) tags.push('delivery:attack');
  if (DELIVERY.projectile.test(text)) tags.push('delivery:projectile');
  if (DELIVERY.line.test(text)) tags.push('delivery:line');
  if (DELIVERY.cone.test(text)) tags.push('delivery:cone');
  if (DELIVERY.sphere.test(text)) tags.push('delivery:sphere');
  if (DELIVERY.zone.test(text)) tags.push('delivery:zone');
  if (DELIVERY.summon.test(text)) tags.push('delivery:summon');

  return tags;
}

/**
 * Extract range aspects from the stat-block Range field.
 *
 * A numeric distance maps to a band (its max feet threshold); the raw distance
 * stays in the stat block. A `Self` range sized by its area — parentheses carry
 * a measurement such as `Self ([= 6 stride =] cone)` — yields no ranged aspect;
 * the measurement is ignored and the shape is left to `delivery:`.
 *
 * @param {string} text - Content to analyze
 * @returns {string[]} Array of range aspects
 */
export function extractRangeTags(text: string): string[] {
  const tags: string[] = [];
  const value = text.match(RANGE.field)?.[1];

  if (value) {
    if (RANGE.self.test(value)) tags.push('range:self');
    else if (RANGE.touch.test(value)) tags.push('range:touch');
    else if (RANGE.sight.test(value)) tags.push('range:sight');
    else if (RANGE.unlimited.test(value)) tags.push('range:unlimited');
    else if (RANGE.melee.test(value)) tags.push('range:melee');
    else {
      const strides = value.match(RANGE.strides)?.[1];
      const feet = strides
        ? Number(strides) * FEET_PER_STRIDE
        : Number(value.match(RANGE.feet)?.[1] ?? Number.NaN);

      if (Number.isFinite(feet)) {
        const band = RANGE_BANDS.find((entry) => feet <= entry.maxFeet);
        if (band) tags.push(`range:${band.band}`);
      }
    }
  }

  if (RANGE.reach.test(text)) tags.push('range:reach');

  return tags;
}

/**
 * Extract tempo aspects for timing the base tagger does not already cover.
 *
 * @param {string} text - Content to analyze
 * @returns {string[]} Array of tempo aspects
 */
export function extractTempoTags(text: string): string[] {
  const tags: string[] = [];

  if (TEMPO.instant.test(text)) tags.push('tempo:instant');
  if (TEMPO.persistent.test(text)) tags.push('tempo:persistent');
  if (TEMPO.major.test(text)) tags.push('tempo:major');
  if (TEMPO.minor.test(text)) tags.push('tempo:minor');
  if (TEMPO.reactive.test(text)) tags.push('tempo:reactive');
  if (TEMPO.free.test(text)) tags.push('tempo:free');

  return tags;
}

/**
 * Extract resource aspects for the costs and pools an effect spends or grants.
 *
 * @param {string} text - Content to analyze
 * @returns {string[]} Array of resource aspects
 */
export function extractResourceTags(text: string): string[] {
  const tags: string[] = [];

  if (RESOURCE.tempHp.test(text)) tags.push('resource:temp-hp');
  if (RESOURCE.slot.test(text)) tags.push('resource:slot');
  if (RESOURCE.hitDie.test(text)) tags.push('resource:hit-die');
  if (RESOURCE.perTurn.test(text)) tags.push('resource:per-turn');

  return tags;
}

/**
 * Extract scaling aspects describing what makes an effect stronger.
 *
 * @param {string} text - Content to analyze
 * @returns {string[]} Array of scaling aspects
 */
export function extractScalingTags(text: string): string[] {
  const tags: string[] = [];

  if (SCALING.slot.test(text)) tags.push('scaling:slot');
  if (SCALING.level.test(text)) tags.push('scaling:level');
  if (SCALING.tier.test(text)) tags.push('scaling:tier');
  if (SCALING.ability.test(text)) tags.push('scaling:ability');
  if (SCALING.stacks.test(text)) tags.push('scaling:stacks');

  return tags;
}

/**
 * Extract the movement modes the base movement tagger does not cover.
 *
 * @param {string} text - Content to analyze
 * @returns {string[]} Array of movement aspects
 */
export function extractExtraMovementTags(text: string): string[] {
  const tags: string[] = [];

  if (MOVEMENT_EXTRA.hover.test(text)) tags.push('movement:hover');
  if (MOVEMENT_EXTRA.ethereal.test(text)) tags.push('movement:ethereal');
  if (MOVEMENT_EXTRA.dimensional.test(text)) tags.push('movement:dimensional');
  if (MOVEMENT_EXTRA.difficultTerrain.test(text))
    tags.push('movement:difficult-terrain');
  if (MOVEMENT_EXTRA.jump.test(text)) tags.push('movement:jump');
  if (MOVEMENT_EXTRA.squeeze.test(text)) tags.push('movement:squeeze');
  if (MOVEMENT_EXTRA.crawl.test(text)) tags.push('movement:crawl');
  if (MOVEMENT_EXTRA.fall.test(text)) tags.push('movement:fall');

  return tags;
}

/**
 * Groups that a damage stratum can be asserted on: the damage dealt and each of
 * the three scoped defences against it.
 */
const STRATUM_GROUPS = [
  'damage',
  'resistance',
  'immunity',
  'vulnerability',
] as const;

/**
 * Adds the stratum an aspect's damage type belongs to.
 *
 * Derived, not authored: a stratum is a property of the type. `true` damage is
 * excluded — it stands outside all strata and cannot be resisted.
 *
 * @param {string[]} aspects - Aspects already derived for the content
 * @param {SharedData} sharedData - Shared game data
 * @returns {string[]} The stratum aspects implied by those already present
 */
export function extractStrataTags(
  aspects: string[],
  sharedData: SharedData,
): string[] {
  const strata = sharedData.gameData.damageStrata;
  if (!strata) return [];

  const derived = new Set<string>();

  for (const aspect of aspects) {
    const boundary = aspect.lastIndexOf(':');
    if (boundary <= 0) continue;

    const group = aspect.slice(0, boundary);
    const value = aspect.slice(boundary + 1);
    if (!STRATUM_GROUPS.includes(group as (typeof STRATUM_GROUPS)[number])) {
      continue;
    }

    for (const [stratum, types] of Object.entries(strata)) {
      if (types.includes(value)) derived.add(`${group}:${stratum}`);
    }
  }

  return [...derived];
}

/**
 * Extract every derivable aspect from content — unified entry point.
 *
 * @param {string} text - Content to analyze
 * @param {SharedData} sharedData - Shared game data
 * @returns {string[]} Deduplicated array of aspects across all derivable groups
 */
export function extractDerivedAspects(
  text: string,
  sharedData: SharedData,
): string[] {
  return Array.from(
    new Set([
      ...extractScopedDefenceTags(text, sharedData),
      ...extractRetaliationTags(text),
      ...extractRollTags(text),
      ...extractSenseTags(text, sharedData),
      ...extractPhaseTags(text),
      ...extractTacticalTags(text),
      ...extractDeliveryTags(text),
      ...extractRangeTags(text),
      ...extractTempoTags(text),
      ...extractResourceTags(text),
      ...extractScalingTags(text),
      ...extractExtraMovementTags(text),
    ]),
  );
}
