/**
 * @fileoverview Feature Extractor Types
 * @description TypeScript interfaces for the concise feature extraction system.
 * Defines the complete data model for extracted game features from MDX content
 * files, including class features, monster mechanics, spells, items, and
 * bloodline boons. Covers both the canonical Feature schema and the
 * MonsterFeature extension for stat-block-specific data.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * @module src/lib/types/feature
 */

/**
 * Token representing a parsed dice expression like "2d6+3".
 *
 * @interface DiceToken
 * @property {number} count - Number of dice
 * @property {number} sides - Number of sides per die
 * @property {string} [modifier] - Modifier expression (e.g., "+3", "+STR")
 */
export interface DiceToken {
  count: number;
  sides: number;
  modifier?: string;
}

/**
 * Token representing a parsed damage expression like "2d6 fire".
 *
 * @interface DamageToken
 * @property {DiceToken} dice - Dice component of the damage
 * @property {string} [type] - Damage type (fire, necrotic, etc.)
 */
export interface DamageToken {
  dice: DiceToken;
  type?: string;
}

/**
 * Token representing a parsed DC expression.
 *
 * @interface DCToken
 * @property {number} [flat] - Static DC value (e.g., 16)
 * @property {string} [formula] - Formula DC (e.g., "12 + Prof + CHA mod")
 */
export interface DCToken {
  flat?: number;
  formula?: string;
}

/**
 * Token representing a parsed saving throw.
 *
 * @interface SaveToken
 * @property {string} ability - Ability used (str, dex, con, int, wis, cha)
 * @property {DCToken} dc - The DC for the save
 */
export interface SaveToken {
  ability: string;
  dc: DCToken;
}

/**
 * Token representing a parsed range or area expression.
 *
 * @interface RangeToken
 * @property {number} distance - Distance in feet
 * @property {string} [shape] - Area shape (cone, sphere, line, cube, radius, cylinder)
 * @property {number} [width] - Width in feet for line/wall shapes
 * @property {number} [height] - Height in feet for cylinder/wall shapes
 */
export interface RangeToken {
  distance: number;
  shape?: string;
  width?: number;
  height?: number;
}

/**
 * Token representing a parsed resource reference.
 *
 * @interface ResourceToken
 * @property {string} type - Resource type (charges, spell_slot, sorcery_points, boon_points, wild_shape_uses, hit_dice, etc.)
 * @property {number | string} [amount] - Amount consumed or available
 */
export interface ResourceToken {
  type: string;
  amount?: number | string;
}

/**
 * Token representing a parsed recharge condition.
 *
 * @interface RechargeToken
 * @property {string} timing - When the ability recharges (repose, recovery, dawn, sundown, etc.)
 * @property {number} [amount] - Number of uses regained
 */
export interface RechargeToken {
  timing: string;
  amount?: number;
}

/**
 * Token representing a parsed action type.
 *
 * @interface ActionToken
 * @property {string} type - Action type: action, minor_action, reaction, free, passive
 */
export interface ActionToken {
  type: string;
}

/**
 * Token representing a parsed duration expression.
 *
 * @interface DurationToken
 * @property {string} value - Duration text (e.g., "1 minute", "instant", "until dismissed")
 * @property {boolean} [concentration] - Whether concentration is required
 */
export interface DurationToken {
  value: string;
  concentration?: boolean;
}

/**
 * Token representing a natural-language formula or template expression.
 *
 * @interface TemplateToken
 * @property {string} expr - The template expression (e.g., "ability:WIS", "2*level+INT")
 */
export interface TemplateToken {
  expr: string;
}

/**
 * Token representing a parsed attack line from a monster stat block.
 *
 * @interface AttackToken
 * @property {'melee' | 'ranged' | 'spell'} type - Attack type
 * @property {number} bonus - Attack bonus
 * @property {number} [reach] - Reach in feet (melee)
 * @property {{ normal: number; long?: number }} [range] - Range in feet (ranged)
 * @property {string} targets - Target description
 */
export interface AttackToken {
  type: 'melee' | 'ranged' | 'spell';
  bonus: number;
  reach?: number;
  range?: { normal: number; long?: number };
  targets: string;
}

/**
 * Token representing a parsed hit/damage line from a monster stat block.
 *
 * @interface HitToken
 * @property {number} average - Average damage
 * @property {string} dice - Dice expression (e.g., "2d8 + 4")
 * @property {string} [type] - Damage type
 */
export interface HitToken {
  average: number;
  dice: string;
  type?: string;
}

/**
 * Token representing a parsed multiattack description.
 *
 * @interface MultiattackToken
 * @property {{ name: string; count: number }[]} attacks - Attacks and their counts
 * @property {'all' | 'exclusive' | 'flexible'} mode - How attacks are combined
 * @property {string} [condition] - Conditional modifier (e.g., "four while in Bloodrage")
 */
export interface MultiattackToken {
  attacks: { name: string; count: number }[];
  mode: 'all' | 'exclusive' | 'flexible';
  condition?: string;
}

/**
 * Token representing a legendary deed cost.
 *
 * @interface DeedCostToken
 * @property {number} cost - Number of deeds required
 */
export interface DeedCostToken {
  cost: number;
}

/**
 * Token representing a phase threshold trigger.
 *
 * @interface PhaseToken
 * @property {string} name - Phase name (Wounded, Bloodied, Doomed, Slain)
 * @property {number | 'slain'} threshold - HP percentage or "slain"
 */
export interface PhaseToken {
  name: string;
  threshold: number | 'slain';
}

/**
 * Token representing a declare/resolve marker in stratagem text.
 *
 * @interface DeclareResolveToken
 * @property {'declare' | 'resolve'} phase - Which phase of the stratagem
 */
export interface DeclareResolveToken {
  phase: 'declare' | 'resolve';
}

/**
 * Token representing an auto-fail/auto-succeed mechanic.
 *
 * @interface AutoFailToken
 * @property {boolean} fails - True if auto-fail, false if auto-succeed
 */
export interface AutoFailToken {
  fails: boolean;
}

/**
 * Token representing a charge-based recharge notation.
 *
 * @interface ChargeRechargeToken
 * @property {number} charges - Number of charges
 * @property {number} min - Minimum recharge roll
 * @property {number} max - Maximum recharge roll
 */
export interface ChargeRechargeToken {
  charges: number;
  min: number;
  max: number;
}

/**
 * All possible flag values for extracted features.
 *
 * @typedef {string} FeatureFlag
 */
export type FeatureFlag =
  | 'unparseable'
  | 'ambiguous_resource'
  | 'ambiguous_target'
  | 'multi_option'
  | 'cross_reference'
  | 'scaling'
  | 'nested_feature'
  | 'template_expr'
  | 'weird_mechanic'
  | 'auto_fail'
  | 'escalation'
  | 'conditional_multiattack'
  | 'multi_aspect'
  | 'shared_resource'
  | 'phase_added';

/**
 * Canonical extracted feature record. Represents a single game mechanic
 * parsed from an MDX content file (class feature, spell, item effect,
 * monster action, etc.).
 *
 * @interface Feature
 * @property {string} id - Stable slug (e.g., "rimelord/avalanche-blade")
 * @property {string} name - Display name
 * @property {{ start: number; end: number; archetype: string }} [source] - Source location in the MDX file — 0-based start/end line of the enclosing section, plus section archetype ('H' for standard sections, 'M' for deed sections)
 * @property {string} [trigger] - Action economy type: action, minor_action, reaction, free, passive
 * @property {{ type?: string; range?: number; area?: RangeToken; scope?: string }} [target] - Target descriptor
 * @property {DamageToken} [damage] - Damage descriptor
 * @property {{ dice: DiceToken; modifier?: string }} [healing] - Healing descriptor
 * @property {SaveToken} [saving_throw] - Saving throw descriptor
 * @property {string} [save_effect] - Effect on save (e.g., "damage:half", "no_effect")
 * @property {string | number} [range] - Range in feet or a description
 * @property {DurationToken} [duration] - Duration descriptor
 * @property {{ type: string; cost?: number | string; max?: number | string; recharge?: RechargeToken }} [resource] - Resource cost/pool descriptor
 * @property {{ level: number; value: string }[]} [scaling] - Level-based scaling data
 * @property {Feature[]} [children] - Nested sub-features (spells, forms, options)
 * @property {string} [pick_mode] - Selection mode: choose_one, pick_any, random
 * @property {number} [confidence] - Quality score 0.0–1.0 (separate rollout phase)
 * @property {FeatureFlag[]} flags - Structural/quality flags
 * @property {string[]} [tags] - Aspects derived from this feature alone, not from the whole stat block
 */
export interface Feature {
  id: string;
  name: string;
  source?: { start: number; end: number; archetype: string };
  trigger?: string;
  target?: { type?: string; range?: number; area?: RangeToken; scope?: string };
  damage?: DamageToken;
  healing?: { dice: DiceToken; modifier?: string };
  saving_throw?: SaveToken;
  save_effect?: string;
  range?: string | number;
  duration?: DurationToken;
  resource?: {
    type: string;
    cost?: number | string;
    max?: number | string;
    recharge?: RechargeToken;
  };
  scaling?: { level: number; value: string }[];
  children?: Feature[];
  pick_mode?: string;
  confidence?: number;
  flags: FeatureFlag[];
  tags?: string[];
}

/**
 * Extended feature record for monster stat block mechanics.
 * Adds attack, multiattack, legendary deed, phase, spellcasting,
 * condition, and relationship fields.
 *
 * Flat damage/save fields override the nested base-Feature tokens for
 * PostgreSQL compatibility (max 1 level nesting).
 *
 * @interface MonsterFeature
 * @extends {Feature}
 * @property {string} [damage] - Damage formula (e.g. "3d8+6")
 * @property {string} [damageType] - Primary damage type
 * @property {string} [damageFlat] - Flat bonus damage formula (e.g. "10")
 * @property {string} [damageFlatType] - Flat bonus damage type
 * @property {{ ability: string; dc: number }} [saving_throw] - Flat saving throw (1-level)
 * @property {AttackToken} [attack] - Parsed attack line data
 * @property {MultiattackToken} [multiattack] - Multiattack composition
 * @property {{ id: string; count: number }[]} [multiattack_refs] - References to individual attack feature IDs
 * @property {{ category: 'act' | 'stratagem' | 'lair' | 'phase'; cost?: number; declare_resolve?: boolean }} [legendary_deed] - Legendary deed data
 * @property {{ hp_threshold: number | 'slain'; name: string; features_added: string[]; features_modified: string[] }} [phase] - Phase trigger data
 * @property {{ min: number; max: number; charges?: number; custom?: string }} [recharge] - Recharge notation data
 * @property {{ level: number; ability: string; dc: number; attack_bonus: number; slots: Record<number, number>; spells?: string[] }} [spellcasting] - Spellcasting block data
 * @property {{ name: string; effects: string[]; cure?: string }} [custom_condition] - Custom condition definition
 * @property {'shared_body' | 'shared_hp' | 'aspect' | 'tethered' | 'angelical_link' | 'summoned'} [relationship] - Relationship to other entities
 * @property {boolean} [auto_fail_saves] - Whether the creature auto-fails all saves
 * @property {{ type: string; trigger: string; per?: string }} [escalation_mechanic] - Escalating mechanic descriptor
 * @property {Record<string, string>} [meta] - Metadata directives from `<Meta>` MDX tags
 * @property {string} [description] - HTML description text populated at Foundry export time
 */
export interface MonsterFeature extends Omit<
  Feature,
  'damage' | 'saving_throw' | 'description' | 'rawText'
> {
  damage?: string;
  damageType?: string;
  damageFlat?: string;
  damageFlatType?: string;
  saving_throw?: { ability: string; dc: number };
  attack?: AttackToken;
  multiattack?: MultiattackToken;
  multiattack_refs?: { id: string; count: number }[];
  legendary_deed?: {
    category: 'act' | 'stratagem' | 'lair' | 'phase';
    cost?: number;
    declare_resolve?: boolean;
  };
  phase?: {
    hp_threshold: number | 'slain';
    name: string;
    features_added: string[];
    features_modified: string[];
  };
  recharge?: {
    min: number;
    max: number;
    charges?: number;
    custom?: string;
  };
  spellcasting?: {
    level: number;
    ability: string;
    dc: number;
    attack_bonus: number;
    slots: Record<number, number>;
    spells?: string[];
  };
  custom_condition?: {
    name: string;
    effects: string[];
    cure?: string;
  };
  relationship?:
    | 'shared_body'
    | 'shared_hp'
    | 'aspect'
    | 'tethered'
    | 'angelical_link'
    | 'summoned';
  auto_fail_saves?: boolean;
  escalation_mechanic?: {
    type: string;
    trigger: string;
    per?: string;
  };
  meta?: Record<string, string>;
  description?: string;
}
