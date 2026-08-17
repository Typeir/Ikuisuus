/**
 * @fileoverview Aspect Domain
 * @description Parsing, ordering and glyph selection for aspects. An aspect is
 * a `group:value` token split on the last colon.
 *
 * @module modules/library/domain/aspects
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-04
 */

import type { LucideIcon } from 'lucide-react';
import {
  CONDITION_MARK,
  DAMAGE_ICON,
  FALLBACK_ICON,
  GROUP_ICON,
  SCOPED_DEFENCE,
  SEVERITY_BADGE,
  STRATUM_TYPES,
  VALUE_ICON,
} from './aspectGlyphs';

/**
 * A parsed aspect.
 *
 * @property {string} raw - The full token, e.g. `damage:fire`
 * @property {string} group - Everything before the last colon
 * @property {string} value - Everything after the last colon
 */
export interface ParsedAspect {
  raw: string;
  group: string;
  value: string;
}

/**
 * Splits an aspect on its last colon.
 *
 * @param {string} aspect - A full aspect token
 * @returns {ParsedAspect | null} The parsed aspect, or null when unusable
 */
export function parseAspect(aspect: string): ParsedAspect | null {
  const boundary = aspect.lastIndexOf(':');
  if (boundary <= 0 || boundary === aspect.length - 1) return null;
  return {
    raw: aspect,
    group: aspect.slice(0, boundary),
    value: aspect.slice(boundary + 1),
  };
}

/**
 * Whether an aspect is internal, and therefore indexed but never drawn.
 *
 * @param {string} aspect - A full aspect token
 * @returns {boolean} True for `meta:`-prefixed aspects
 */
export function isInternalAspect(aspect: string): boolean {
  return aspect.startsWith('meta:');
}

/**
 * Display order for aspect groups.
 */
export const ASPECT_GROUP_ORDER: readonly string[] = [
  'form',
  'myth',
  'creature',
  'size',
  'rarity',
  'level',
  'vocation',
  'source',
  'access',
  'damage',
  'defense',
  'resistance',
  'immunity',
  'vulnerability',
  'condition',
  'phase',
  'delivery',
  'range',
  'tempo',
  'resource',
  'scaling',
  'save',
  'mechanic',
  'sense',
  'movement',
  'position',
  'cover',
  'proficiency',
  'property',
  'component',
  'slot',
  'item',
  'weapon',
  'armor',
  'theme',
];

/**
 * The marks that draw one aspect.
 *
 * @property {LucideIcon} Icon - The primary glyph
 * @property {LucideIcon} [Badge] - Element glyph overlaid on the primary
 * @property {string} [badgeVar] - CSS variable holding the badge's own colour
 * @property {StratumMember[]} [strata] - The three member types of a damage stratum
 */
export interface AspectMark {
  Icon: LucideIcon;
  Badge?: LucideIcon;
  badgeVar?: string;
  strata?: StratumMember[];
}

/**
 * One damage type inside a stratum mark.
 *
 * @property {string} value - The damage type, e.g. `fire`
 * @property {LucideIcon} Icon - That type's own glyph
 * @property {string} colourVar - That type's own colour variable
 */
export interface StratumMember {
  value: string;
  Icon: LucideIcon;
  colourVar: string;
}

/**
 * Resolves a stratum into its member marks.
 *
 * @param {string} stratum - Stratum name, e.g. `elemental`
 * @returns {StratumMember[] | undefined} Its members, or undefined when not a stratum
 */
function stratumMembers(stratum: string): StratumMember[] | undefined {
  const types = STRATUM_TYPES[stratum];
  if (!types) return undefined;

  return types
    .filter((type) => DAMAGE_ICON[type])
    .map((type) => ({
      value: type,
      Icon: DAMAGE_ICON[type],
      colourVar: `--aspect-damage-${type}`,
    }));
}

/**
 * Chooses the glyphs that draw an aspect.
 *
 * @param {ParsedAspect} aspect - A parsed aspect
 * @returns {AspectMark} The glyph, and an element badge when the aspect is a scoped defence
 */
export function aspectMark(aspect: ParsedAspect): AspectMark {
  const modifier = SCOPED_DEFENCE[aspect.group];
  if (modifier) {
    const members = stratumMembers(aspect.value);
    if (members) return { Icon: modifier, strata: members };

    const element = DAMAGE_ICON[aspect.value];
    if (element) {
      return {
        Icon: modifier,
        Badge: element,
        badgeVar: `--aspect-damage-${aspect.value}`,
      };
    }

    const condition = CONDITION_MARK[aspect.value];
    if (condition) {
      return {
        Icon: modifier,
        Badge: condition.Icon,
        badgeVar: '--aspect-condition',
      };
    }

    return { Icon: modifier };
  }

  if (aspect.group === 'damage') {
    const members = stratumMembers(aspect.value);
    if (members) return { Icon: GROUP_ICON.damage, strata: members };

    if (DAMAGE_ICON[aspect.value]) return { Icon: DAMAGE_ICON[aspect.value] };
  }

  if (aspect.group === 'condition') {
    const condition = CONDITION_MARK[aspect.value];
    if (condition) {
      const Badge = SEVERITY_BADGE[condition.severity];
      return Badge ? { Icon: condition.Icon, Badge } : { Icon: condition.Icon };
    }
  }

  return {
    Icon: VALUE_ICON[aspect.raw] ?? GROUP_ICON[aspect.group] ?? FALLBACK_ICON,
  };
}

/**
 * The CSS variable carrying an aspect's colour.
 *
 * @param {ParsedAspect} aspect - A parsed aspect
 * @returns {string} A `var(...)` expression
 */
export function aspectColour(aspect: ParsedAspect): string {
  if (STRATUM_TYPES[aspect.value]) {
    return 'var(--aspect-stratum, var(--aspect-default))';
  }
  if (aspect.group === 'damage') {
    return `var(--aspect-damage-${aspect.value}, var(--aspect-damage))`;
  }
  if (aspect.group === 'phase') {
    return `var(--aspect-phase-${aspect.value}, var(--color-phase-${aspect.value}, var(--aspect-default)))`;
  }
  return `var(--aspect-${aspect.group}, var(--aspect-default))`;
}

/**
 * Parses, filters and orders a raw tag list for display.
 *
 * Internal (`meta:`) aspects are dropped.
 *
 * @param {string[] | undefined} tags - Raw tag list from generated metadata
 * @returns {ParsedAspect[]} Display-ordered aspects
 */
export function displayAspects(tags: string[] | undefined): ParsedAspect[] {
  if (!tags?.length) return [];

  const parsed = tags
    .filter((tag) => !isInternalAspect(tag))
    .map(parseAspect)
    .filter((aspect): aspect is ParsedAspect => aspect !== null);

  return parsed.sort((a, b) => {
    const ai = ASPECT_GROUP_ORDER.indexOf(a.group);
    const bi = ASPECT_GROUP_ORDER.indexOf(b.group);
    return (
      (ai === -1 ? ASPECT_GROUP_ORDER.length : ai) -
        (bi === -1 ? ASPECT_GROUP_ORDER.length : bi) ||
      a.value.localeCompare(b.value)
    );
  });
}
