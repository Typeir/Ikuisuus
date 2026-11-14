/**
 * @fileoverview Shared contracts for the dev builder API, the window bridge, and the flag surface.
 *
 * @module modules/character-builder/application/builderCore/types
 * @version 1.0.0
 * @author Typeir
 * @since 9.1.0
 */

import type {
  AbilityKey,
  CharacterSheet,
  TierLevel,
} from '@/lib/types/character';
import type { CarryingInputs } from '@/modules/character-builder/domain/carrying-capacity';

/**
 * Stable code of one builder warning flair.
 *
 * @typedef {string} BuilderFlagCode
 */
export type BuilderFlagCode =
  | 'BP_OVER_BUDGET'
  | 'UNASSIGNED_LEVELS'
  | 'UNASSIGNED_SKILL_PROFICIENCY'
  | 'UNASSIGNED_SKILL_EXPERTISE'
  | 'UNASSIGNED_TRADE'
  | 'UNASSIGNED_FEAT'
  | 'CARRY_HEAVY_LOAD'
  | 'CARRY_OVER_CAPACITY';

/**
 * Character area a flag points at.
 *
 * @typedef {'boons'|'vocations'|'grants'|'equipment'} BuilderFlagSourceKind
 */
export type BuilderFlagSourceKind = 'boons' | 'vocations' | 'grants' | 'equipment';

/**
 * One feature or entry that feeds a flag.
 *
 * @interface BuilderFlagFeature
 * @property {string} id - Shard id, grant id, vocation slug, or item id
 * @property {string} label - Display name of the feature
 */
export interface BuilderFlagFeature {
  id: string;
  label: string;
}

/**
 * Origin of a flag.
 *
 * @interface BuilderFlagSource
 * @property {BuilderFlagSourceKind} kind - Character area
 * @property {BuilderFlagFeature[]} features - Features that feed the flag; empty when none apply
 */
export interface BuilderFlagSource {
  kind: BuilderFlagSourceKind;
  features: BuilderFlagFeature[];
}

/**
 * One advisory flag; flags never block a build.
 *
 * @interface BuilderFlag
 * @property {BuilderFlagCode} code - Stable flag code
 * @property {'warning'} severity - Always `warning`
 * @property {string|null} messageKey - `characterSheet` i18n key; null when the UI text is hardcoded
 * @property {Record<string, number>} params - ICU params for `messageKey`
 * @property {string} message - English text as shown in the UI
 * @property {BuilderFlagSource} source - Origin of the flag
 */
export interface BuilderFlag {
  code: BuilderFlagCode;
  severity: 'warning';
  messageKey: string | null;
  params: Record<string, number>;
  message: string;
  source: BuilderFlagSource;
}

/**
 * Carry inputs that override the character's stored `carrying` field key by key.
 *
 * @typedef {CarryingInputs} CarryOptions
 */
export type CarryOptions = CarryingInputs;

/**
 * One vocation request in a build payload.
 *
 * @interface BuilderVocationInput
 * @property {string} vocation - Vocation name or slug, fuzzy-resolved
 * @property {number} [level] - Levels in this vocation (default 1, min 1)
 * @property {string} [specialization] - Specialization name or slug, fuzzy-resolved within the vocation
 */
export interface BuilderVocationInput {
  vocation: string;
  level?: number;
  specialization?: string;
}

/**
 * One boon request in a build payload.
 *
 * @interface BuilderBoonInput
 * @property {string} name - Boon name, fuzzy-resolved within the bloodline
 * @property {string[]} [subOptions] - Sub-option names for a variable-cost boon
 */
export interface BuilderBoonInput {
  name: string;
  subOptions?: string[];
}

/**
 * One manual equipment row in a build payload.
 *
 * @interface BuilderEquipmentInput
 * @property {string} name - Item name
 * @property {number} [quantity] - Units carried (default 1)
 * @property {number} [weightLb] - Weight per unit in pounds (default 0)
 */
export interface BuilderEquipmentInput {
  name: string;
  quantity?: number;
  weightLb?: number;
}

/**
 * Structured character request; every name is fuzzy-resolved.
 *
 * @interface BuilderPayload
 * @property {string} [name] - Character name
 * @property {number} [experience] - XP; raised to the vocation-level floor
 * @property {string} [bloodline] - Bloodline name or slug
 * @property {BuilderVocationInput[]} [vocations] - Vocations in order; the first is primary
 * @property {Array<string|BuilderBoonInput>} [boons] - Boons of the bloodline
 * @property {string[]} [feats] - Feat names or slugs; repeats add instances
 * @property {Partial<Record<AbilityKey, number>>} [abilityScores] - Ability scores
 * @property {Record<string, TierLevel>} [skills] - Skill name to manual tier
 * @property {Record<string, TierLevel>} [trades] - Trade name to manual tier
 * @property {Partial<Record<AbilityKey, TierLevel>>} [savingThrows] - Manual save tiers
 * @property {string[]} [heirlooms] - Heirloom names, imported as abilities
 * @property {string[]} [trinkets] - Trinket names, imported as abilities
 * @property {string[]} [spells] - Spell names, imported as abilities
 * @property {BuilderEquipmentInput[]} [equipment] - Manual equipment rows
 * @property {CarryingInputs} [carrying] - Carry widget inputs, merged into the stored ones
 */
export interface BuilderPayload {
  name?: string;
  experience?: number;
  bloodline?: string;
  vocations?: BuilderVocationInput[];
  boons?: Array<string | BuilderBoonInput>;
  feats?: string[];
  abilityScores?: Partial<Record<AbilityKey, number>>;
  skills?: Record<string, TierLevel>;
  trades?: Record<string, TierLevel>;
  savingThrows?: Partial<Record<AbilityKey, TierLevel>>;
  heirlooms?: string[];
  trinkets?: string[];
  spells?: string[];
  equipment?: BuilderEquipmentInput[];
  carrying?: CarryingInputs;
}

/**
 * One fuzzy match candidate.
 *
 * @interface ResolutionCandidate
 * @property {string} slug - Resolved slug or option name
 * @property {string} title - Display title
 * @property {number} similarity - Score in [0, 1]
 */
export interface ResolutionCandidate {
  slug: string;
  title: string;
  similarity: number;
}

/**
 * Outcome of resolving one payload name.
 *
 * @interface Resolution
 * @property {string} field - Payload path, e.g. `vocations[0].specialization`
 * @property {string} query - Name as sent
 * @property {ResolutionCandidate|null} match - Picked candidate; null when nothing scored
 * @property {ResolutionCandidate[]} alternates - Other candidates, best first
 * @property {boolean} ambiguous - True when an alternate scores within the threshold of the match
 */
export interface Resolution {
  field: string;
  query: string;
  match: ResolutionCandidate | null;
  alternates: ResolutionCandidate[];
  ambiguous: boolean;
}

/**
 * One changed leaf between two JSON values.
 *
 * @interface StateChange
 * @property {string} path - Dot/bracket path, e.g. `boonPoints.spent`
 * @property {unknown} before - Old value; undefined when added
 * @property {unknown} after - New value; undefined when removed
 */
export interface StateChange {
  path: string;
  before: unknown;
  after: unknown;
}

/**
 * Flag delta between two flag lists.
 *
 * @interface FlagDiff
 * @property {BuilderFlag[]} added - Flags present only after
 * @property {BuilderFlag[]} removed - Flags present only before
 * @property {BuilderFlag[]} changed - Flags present in both with a different message or source
 */
export interface FlagDiff {
  added: BuilderFlag[];
  removed: BuilderFlag[];
  changed: BuilderFlag[];
}

/**
 * Slot names the options listing accepts.
 *
 * @typedef {string} BuilderSlot
 */
export type BuilderSlot =
  | 'bloodline'
  | 'vocation'
  | 'specialization'
  | 'boons'
  | 'feats'
  | 'skills'
  | 'trades'
  | 'heirlooms'
  | 'trinkets'
  | 'spells'
  | 'features';

/**
 * One listed option for a slot.
 *
 * @interface SlotOption
 * @property {string} slug - Slug or option key
 * @property {string} title - Display title
 * @property {Record<string, unknown>} [info] - Slot-specific facts, e.g. BP cost or `unlocked`
 */
export interface SlotOption {
  slug: string;
  title: string;
  info?: Record<string, unknown>;
}

/**
 * Character plus its computed state and flags.
 *
 * @interface BuilderSnapshot
 * @property {CharacterSheet} character - Character entity
 * @property {import('./builderState').BuilderState} state - Computed state
 * @property {BuilderFlag[]} flags - Advisory flags
 */
export interface BuilderSnapshot {
  character: CharacterSheet;
  state: import('./builderState').BuilderState;
  flags: BuilderFlag[];
}
