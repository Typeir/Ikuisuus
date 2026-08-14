/**
 * @fileoverview Feature-Scoped Aspects
 * @description Derives aspects for a single monster feature, not the whole stat
 * block. Returns facets from the feature's line range and, where present, the
 * parsed `trigger`, `target` and `saving_throw` shard fields.
 *
 * @module lib/metadata/featureAspects
 * @version 1.0.0
 * @author Typeir
 * @since 3.1.0
 */

import type { MonsterFeature } from '@/lib/types/feature';
import { extractDerivedAspects, extractStrataTags } from './aspectExtractors';
import { FEET_PER_STRIDE, RANGE_BANDS } from './aspectPatterns';
import { GameData } from './gameData';
import type { SharedData } from './sharedData';
import {
  extractAbilitySaveTags,
  extractConditionTags,
  extractDamageTags,
  extractMonsterMechanicTags,
  extractMovementTags,
  stripCitations,
} from './taggingUtils';

/**
 * Maps a feature's declared trigger onto the tempo axis.
 */
const TRIGGER_TEMPO: Record<string, string> = {
  action: 'tempo:major',
  reaction: 'tempo:reactive',
  minor: 'tempo:minor',
  passive: 'tempo:persistent',
};

/**
 * Maps a parsed target shape onto the delivery axis.
 */
const TARGET_DELIVERY: Record<string, string> = {
  radius: 'delivery:sphere',
  sphere: 'delivery:sphere',
  cone: 'delivery:cone',
  line: 'delivery:line',
  cube: 'delivery:area',
  square: 'delivery:area',
  aura: 'delivery:aura',
  touch: 'delivery:touch',
  self: 'delivery:self',
};

/**
 * Distances a feature reaches, written inline rather than in a Range field.
 */
const WITHIN_STRIDES = /\bwithin\s+\*{0,2}\[=\s*(\d+)\s*stride/gi;

/**
 * Derives a feature's range band from its parsed target range and any inline
 * `within ... stride` text. The furthest distance wins; the feet are remapped
 * to a band from `RANGE_BANDS`.
 *
 * @param {MonsterFeature} feature - The feature being tagged
 * @param {string} body - The feature's text
 * @returns {string[]} A single range aspect, or an empty array
 */
function rangeAspect(feature: MonsterFeature, body: string): string[] {
  const distances: number[] = [];

  if (typeof feature.target?.range === 'number') {
    distances.push(feature.target.range);
  }

  const scanner = new RegExp(WITHIN_STRIDES.source, WITHIN_STRIDES.flags);
  let match;
  while ((match = scanner.exec(body)) !== null) {
    distances.push(Number(match[1]));
  }

  if (!distances.length) return [];

  const feet = Math.max(...distances) * FEET_PER_STRIDE;
  const band = RANGE_BANDS.find((entry) => feet <= entry.maxFeet);

  return band ? [`range:${band.band}`] : [];
}

/**
 * Recovers a feature's own text from the 0-based source line range on its shard.
 * The range's end is exclusive; pastes the following feature's title when
 * inclusive-sliced. Returns empty when the range is missing or empty.
 *
 * @param {MonsterFeature} feature - Feature carrying a source range
 * @param {string[]} lines - Lines of the stat block file
 * @returns {string} The feature's text, empty when the range is missing
 */
function featureBody(feature: MonsterFeature, lines: string[]): string {
  if (!feature.source) return '';
  const start = Math.max(0, feature.source.start);
  const end = Math.min(lines.length, feature.source.end);
  return end > start ? stripCitations(lines.slice(start, end).join('\n')) : '';
}

/**
 * Derives the aspect list for one monster feature.
 *
 * @param {MonsterFeature} feature - The feature to tag
 * @param {string[]} lines - Lines of the stat block file
 * @param {SharedData} sharedData - Shared game data
 * @returns {string[]} Sorted, deduplicated aspects for this feature alone
 */
export function extractFeatureAspects(
  feature: MonsterFeature,
  lines: string[],
  sharedData: SharedData,
): string[] {
  const body = featureBody(feature, lines);
  if (!body.trim()) return [];

  const aspects = [
    ...extractDamageTags(body, sharedData),
    ...extractConditionTags(body, sharedData),
    ...extractAbilitySaveTags(body, sharedData),
    ...extractMovementTags(body, sharedData),
    ...extractMonsterMechanicTags(body),
    ...extractDerivedAspects(body, sharedData),
    ...rangeAspect(feature, body),
  ];

  const tempo = feature.trigger && TRIGGER_TEMPO[feature.trigger];
  if (tempo && !aspects.some((aspect) => aspect.startsWith('tempo:'))) {
    aspects.push(tempo);
  }

  const delivery =
    feature.target?.type && TARGET_DELIVERY[feature.target.type.toLowerCase()];
  if (delivery) aspects.push(delivery);

  if (feature.saving_throw?.ability) {
    const ability = GameData.getAbilities(sharedData).find(
      (candidate) =>
        candidate.short.toLowerCase() ===
          feature.saving_throw?.ability.toLowerCase() ||
        candidate.long.toLowerCase() ===
          feature.saving_throw?.ability.toLowerCase(),
    );
    if (ability) aspects.push(`save:${ability.short.toLowerCase()}`);
  }

  if (feature.damageType) {
    const type = feature.damageType.toLowerCase();
    if (GameData.getDamageTypes(sharedData).includes(type)) {
      aspects.push(`damage:${type}`);
    }
  }

  if (feature.recharge) aspects.push('resource:recharge');

  aspects.push(...extractStrataTags(aspects, sharedData));

  return Array.from(new Set(aspects)).sort();
}

/**
 * The declared defence, sense and movement fields of a stat block.
 *
 * @property {string[]} [resistances] - Damage Resistances entries
 * @property {string[]} [immunities] - Damage Immunities entries
 * @property {string[]} [vulnerabilities] - Damage Vulnerabilities entries
 * @property {string[]} [conditionImmunities] - Condition Immunities entries
 * @property {Record<string, unknown>} [senses] - Parsed senses
 * @property {Record<string, unknown>} [speed] - Parsed speeds
 */
export interface StatBlockFields {
  resistances?: string[];
  immunities?: string[];
  vulnerabilities?: string[];
  conditionImmunities?: string[];
  senses?: Record<string, unknown>;
  speed?: Record<string, unknown>;
}

/**
 * Maps a parsed speed key onto the movement axis.
 */
const SPEED_MOVEMENT: Record<string, string> = {
  burrow: 'movement:burrowing',
  swim: 'movement:swimming',
  fly: 'movement:flight',
  climb: 'movement:climbing',
  hover: 'movement:hover',
};

/**
 * Derives aspects from a stat block's declared defence, sense and movement
 * fields. Entries outside the damage-type or condition vocabulary are skipped.
 *
 * @param {StatBlockFields} fields - Declared stat block fields
 * @param {SharedData} sharedData - Shared game data
 * @returns {string[]} Sorted, deduplicated aspects
 */
export function extractStatBlockFieldAspects(
  fields: StatBlockFields,
  sharedData: SharedData,
): string[] {
  const aspects: string[] = [];
  const damageTypes = GameData.getDamageTypes(sharedData);
  const conditions = GameData.getConditions(sharedData);

  const scoped = (
    entries: string[] | undefined,
    group: string,
    vocabulary: string[],
    coarse?: string,
  ): void => {
    if (!entries?.length) return;
    let matched = false;
    for (const entry of entries) {
      const value = entry.trim().toLowerCase();
      if (vocabulary.includes(value)) {
        aspects.push(`${group}:${value}`);
        matched = true;
      }
    }
    if (matched && coarse) aspects.push(coarse);
  };

  scoped(fields.resistances, 'resistance', damageTypes, 'defense:resistance');
  scoped(fields.immunities, 'immunity', damageTypes, 'defense:immunity');
  scoped(
    fields.vulnerabilities,
    'vulnerability',
    damageTypes,
    'defense:vulnerability',
  );
  scoped(
    fields.conditionImmunities,
    'immunity',
    conditions,
    'defense:immunity',
  );

  for (const sense of GameData.getSenses(sharedData)) {
    if (fields.senses?.[sense] !== undefined) aspects.push(`sense:${sense}`);
  }

  for (const [key, aspect] of Object.entries(SPEED_MOVEMENT)) {
    if (fields.speed?.[key] !== undefined) aspects.push(aspect);
  }

  return Array.from(new Set(aspects)).sort();
}

/**
 * A feature that states its own line range flatly.
 *
 * @property {string} name - Feature name, as written in the heading
 * @property {number} [startLine] - First line of the feature, 1-based
 * @property {number} [endLine] - Last line of the feature, inclusive
 * @property {string[]} [tags] - Aspects derived from this feature alone
 */
export interface RangedFeature {
  name: string;
  startLine?: number;
  endLine?: number;
  tags?: string[];
}

/**
 * Tags features that declare a 1-based inclusive line range.
 *
 * @param {RangedFeature[]} features - Features to tag, mutated in place
 * @param {string[]} lines - Lines of the source file
 * @param {SharedData} sharedData - Shared game data
 * @returns {void}
 */
export function tagRangedFeatures(
  features: RangedFeature[],
  lines: string[],
  sharedData: SharedData,
): void {
  for (const feature of features) {
    if (!feature.startLine || !feature.endLine) continue;

    const body = stripCitations(
      lines
        .slice(Math.max(0, feature.startLine - 1), feature.endLine)
        .join('\n'),
    );
    if (!body.trim()) continue;

    const aspects = [
      ...extractDamageTags(body, sharedData),
      ...extractConditionTags(body, sharedData),
      ...extractAbilitySaveTags(body, sharedData),
      ...extractMovementTags(body, sharedData),
      ...extractMonsterMechanicTags(body),
      ...extractDerivedAspects(body, sharedData),
    ];

    aspects.push(...extractStrataTags(aspects, sharedData));

    const unique = Array.from(new Set(aspects)).sort();
    if (unique.length) feature.tags = unique;
  }
}

/**
 * Tags every feature on a stat block in place.
 *
 * @param {MonsterFeature[]} features - Features belonging to one stat block
 * @param {string[]} lines - Lines of the stat block file
 * @param {SharedData} sharedData - Shared game data
 * @returns {void}
 */
export function tagFeatures(
  features: MonsterFeature[],
  lines: string[],
  sharedData: SharedData,
): void {
  for (const feature of features) {
    const aspects = extractFeatureAspects(feature, lines, sharedData);
    if (aspects.length) feature.tags = aspects;
  }
}
