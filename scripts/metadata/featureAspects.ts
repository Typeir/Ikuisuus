/**
 * @fileoverview Feature-Scoped Aspects
 * @description Derives aspects for a single monster feature rather than for the
 * whole stat block.
 *
 * A statblock-level aspect answers "does this creature do fire damage anywhere",
 * which is the wrong grain for the question a reader actually has. Mucklord
 * carries forty-one aspects; knowing that Garbage Communion in particular is the
 * aura that inflicts them is the fact worth having, and it is the fact the
 * feature shard already has the line range to recover.
 *
 * Structured shard fields are preferred over the prose wherever they exist —
 * `trigger`, `target` and `saving_throw` were already parsed, so re-deriving them
 * with a regex would be both slower and less reliable than reading them.
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
 *
 * Applied only when the prose said nothing about timing. A trait classified
 * `passive` whose text opens "As a Minor Action" is a Minor Action, and the two
 * tempos together would assert both.
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
 * Derives a feature's range band.
 *
 * A feature has no `**Range**` line — that field belongs to a spell stat block —
 * so its reach is stated inline: "any point it can see within [= 120 stride =]".
 * Without this a feature that reaches six hundred feet carries no range at all,
 * which is the fact a reader most wants from it.
 *
 * The furthest distance wins. Cannon Tongue reaches 120 strides and takes
 * disadvantage within 2, and the feature's reach is the former.
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
 * Recovers a feature's own text from the source line range on its shard.
 *
 * The range's end is exclusive — it addresses the following feature's heading —
 * so an inclusive slice pulls the next feature's title into this one's text and
 * tags each feature with a little of its neighbour.
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
 * Derives aspects from a stat block's declared fields.
 *
 * A stat block states its defences as fields — `**Damage Immunities** chemical,
 * poison` — and never as the prose "immune to poison" that the text extractors
 * look for. Reading the fields is both more reliable than a regex over the
 * surrounding text and the only way these aspects appear at all: the coarse
 * `defense:immunity` was landing from an unrelated sentence while the scoped
 * `immunity:poison` that a reader actually filters by was missing.
 *
 * Entries outside the vocabulary are skipped rather than emitted. `Banishment`
 * and `Polymorphs` appear as condition immunities but are not conditions, and
 * inventing aspects for them would put values in the facet rail that no rule
 * defines.
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
 * Vocations, specializations and feats carry `startLine` / `endLine` rather than
 * the monster shard's nested `source`, and they use the opposite convention:
 * **1-based and inclusive**, where a monster range is 0-based with an exclusive
 * end. Mixing them up shifts every body by a line and quietly tags each feature
 * with a slice of its neighbour.
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
 * Without this a vocation shows twenty-two features and not one of them says
 * what it does, while the vocation's own row carries the aspects of all of them
 * at once — which is the wrong grain for every question a reader has.
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
