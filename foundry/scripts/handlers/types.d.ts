/**
 * @fileoverview Type definitions for the Foundry feature handler system.
 * @description Defines the interfaces that all parser classes and the registry
 * use. Keeps type contracts separate from runtime code so transformers can
 * import types without pulling in decorator metadata.
 *
 * Types target the dnd5e 5.3.0 Activity-based item model where activation,
 * damage, saves, and targeting live inside Activity entries rather than on
 * the item's top-level system data.
 *
 * @module foundry/scripts/handlers/types
 * @version 2.0.0
 * @author Typeir
 * @since 2026-04-14
 *
 * @see {@link FoundryItemOverrides} for the partial item shape handlers return
 * @see {@link IFeatureParser} for the parser class contract
 * @see {@link FoundryActivity} for the dnd5e 5.3 Activity union type
 */

/**
 * dnd5e DamageField — represents a single damage dice group.
 *
 * @property {number | null} number - Number of dice (null if none)
 * @property {number | null} denomination - Die sides (4, 6, 8, 10, 12, 20)
 * @property {string} bonus - Flat bonus as string (e.g. "+4", "")
 * @property {string[]} types - Damage type keys (e.g. ["piercing"])
 * @property {{ enabled: boolean; formula: string }} custom - Custom formula override
 * @property {{ mode: string; formula: string }} [scaling] - Scaling configuration
 */
export interface DamageField {
  number: number | null;
  denomination: number | null;
  bonus: string;
  types: string[];
  custom: { enabled: boolean; formula: string };
  scaling?: { mode: string; formula: string };
}

/**
 * Single damage part within an Activity's damage array.
 *
 * @property {string} number - Dice count as string
 * @property {string} denomination - Die sides as string
 * @property {string} bonus - Flat bonus
 * @property {string[]} types - Damage type keys
 * @property {{ enabled: boolean; formula: string }} custom - Custom formula
 * @property {{ mode: string; formula: string }} [scaling] - Scaling config
 */
export interface ActivityDamagePart {
  number: string;
  denomination: string;
  bonus: string;
  types: string[];
  custom: { enabled: boolean; formula: string };
  scaling?: { mode: string; formula: string };
}

/**
 * Activation descriptor shared by all Activity types.
 *
 * @property {string} type - Activation type (action, bonus, reaction, lair, legendary, none)
 * @property {number | null} value - Number of actions consumed
 * @property {string} condition - Activation condition text
 * @property {boolean} override - Whether this overrides the item-level activation
 */
export interface ActivityActivation {
  type: string;
  value: number | null;
  condition: string;
  override: boolean;
}

/**
 * Target descriptor for an Activity.
 *
 * @property {{ type: string; value: string; units: string; width: string }} template - AoE template shape
 * @property {{ type: string; count: string; special: string }} affects - What the Activity affects
 * @property {boolean} override - Whether this overrides the item-level target
 */
export interface ActivityTarget {
  template: { type: string; value: string; units: string; width: string };
  affects: { type: string; count: string; special: string };
  override: boolean;
}

/**
 * Range descriptor for an Activity.
 *
 * @property {string | null} value - Range distance
 * @property {string} units - Range units (ft, mi, self, etc.)
 * @property {string} special - Special range text
 * @property {boolean} override - Whether this overrides the item-level range
 */
export interface ActivityRange {
  value: string | null;
  units: string;
  special: string;
  override: boolean;
}

/**
 * Duration descriptor for an Activity.
 *
 * @property {string} value - Duration amount
 * @property {string} units - Duration units (inst, round, minute, etc.)
 * @property {string} special - Special duration text
 * @property {boolean} override - Whether this overrides the item-level duration
 */
export interface ActivityDuration {
  value: string;
  units: string;
  special: string;
  override: boolean;
}

/**
 * Base fields shared by all dnd5e Activity types.
 *
 * @property {string} _id - Activity document ID (e.g. "dnd5eactivity000")
 * @property {string} type - Activity type discriminant
 * @property {ActivityActivation} activation - When/how the Activity is used
 * @property {object} consumption - Resource consumption config
 * @property {{ chatFlavor: string }} description - Description and chat text
 * @property {ActivityDuration} duration - How long the effect lasts
 * @property {unknown[]} effects - Active Effects triggered
 * @property {ActivityRange} range - Range of the Activity
 * @property {ActivityTarget} target - Targeting/AoE configuration
 * @property {object} uses - Per-Activity use limits
 * @property {number} sort - Sort order within the item
 */
export interface ActivityBase {
  _id: string;
  type: string;
  activation: ActivityActivation;
  consumption: {
    targets: unknown[];
    scaling: { allowed: boolean; max: string };
  };
  description: { chatFlavor: string };
  duration: ActivityDuration;
  effects: unknown[];
  range: ActivityRange;
  target: ActivityTarget;
  uses: {
    spent: number;
    max: string;
    recovery: unknown[];
  };
  sort: number;
}

/**
 * dnd5e Attack Activity — weapon or spell attack roll.
 *
 * @property {'attack'} type - Activity type discriminant
 * @property {object} attack - Attack configuration
 * @property {object} damage - Damage configuration with includeBase flag
 */
export interface AttackActivity extends ActivityBase {
  type: 'attack';
  attack: {
    ability: string;
    bonus: string;
    critical: { threshold: number | null };
    flat: boolean;
    type: { value: string; classification: string };
  };
  damage: {
    critical: { bonus: string };
    includeBase: boolean;
    parts: ActivityDamagePart[];
  };
}

/**
 * dnd5e Save Activity — forced saving throw.
 *
 * @property {'save'} type - Activity type discriminant
 * @property {object} save - Saving throw DC configuration
 * @property {object} damage - Damage dealt, with onSave behavior
 */
export interface SaveActivity extends ActivityBase {
  type: 'save';
  save: {
    ability: string;
    dc: { calculation: string; formula: string };
  };
  damage: {
    onSave: string;
    parts: ActivityDamagePart[];
  };
}

/**
 * dnd5e Utility Activity — descriptive or non-mechanical action.
 *
 * @property {'utility'} type - Activity type discriminant
 */
export interface UtilityActivity extends ActivityBase {
  type: 'utility';
}

/**
 * Union of all supported dnd5e Activity types.
 */
export type FoundryActivity = AttackActivity | SaveActivity | UtilityActivity;

/**
 * Partial Foundry VTT dnd5e item overrides that a handler can return
 * to override or extend the generic feature-to-item transformation.
 *
 * Only the fields a handler cares about need to be set; they are merged
 * over the base item produced by the generic transformer.
 *
 * Uses the dnd5e 5.3.0 Activity model: activation, damage, saves, and
 * targeting live inside Activity entries in the `activities` map.
 *
 * @property {Record<string, FoundryActivity>} [activities] - Activity entries keyed by activity _id
 * @property {string} [description] - HTML description override (appended or replaced)
 * @property {Record<string, unknown>} [flags] - Foundry flags to set on the item
 */
export interface FoundryItemOverrides {
  activities?: Record<string, FoundryActivity>;
  description?: string;
  flags?: Record<string, unknown>;
}

/**
 * Contract for a parser class that handles features from a specific monster sheet.
 * Implementations are decorated with `@parser(sheetSlug)` and have methods
 * decorated with `@handler(featureId)`.
 *
 * The registry instantiates parsers and calls handler methods via the
 * metadata collected by decorators.
 *
 * @interface IFeatureParser
 * @property {string} sheetSlug - The monster sheet slug this parser handles
 */
export interface IFeatureParser {
  sheetSlug: string;
}
