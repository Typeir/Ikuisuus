/**
 * @fileoverview Shared lookup maps for Foundry VTT dnd5e data model mappings.
 * @description Maps Ikuisuus metadata values (sizes, damage types, conditions,
 * skills, languages) to their dnd5e system equivalents. Used by all
 * content transformers.
 *
 * @module foundry/scripts/constants/dnd5eMaps
 * @version 1.0.0
 * @author Typeir
 * @since 2026-04-12
 *
 * @see {@link SIZE_MAP} for creature size mappings
 */

/** Maps Ikuisuus creature size strings to dnd5e size codes. */
export const SIZE_MAP: Record<string, string> = {
  tiny: 'tiny',
  small: 'sm',
  medium: 'med',
  large: 'lg',
  huge: 'huge',
  gargantuan: 'grg',
};

/** Maps Ikuisuus damage type strings to dnd5e damage type keys. */
export const DAMAGE_TYPE_MAP: Record<string, string> = {
  chemical: 'acid',
  bludgeoning: 'bludgeoning',
  frost: 'cold',
  fire: 'fire',
  force: 'force',
  lightning: 'lightning',
  dark: 'necrotic',
  piercing: 'piercing',
  poison: 'poison',
  psychic: 'psychic',
  holy: 'radiant',
  slashing: 'slashing',
};

/**
 * Maps condition names from Ikuisuus metadata to dnd5e condition keys.
 * Ikuisuus uses "Terrified" where dnd5e uses "frightened".
 */
export const CONDITION_MAP: Record<string, string> = {
  blinded: 'blinded',
  charmed: 'charmed',
  deafened: 'deafened',
  exhaustion: 'exhaustion',
  frightened: 'frightened',
  terrified: 'frightened',
  grappled: 'grappled',
  incapacitated: 'incapacitated',
  invisible: 'invisible',
  paralyzed: 'paralyzed',
  petrified: 'petrified',
  poisoned: 'poisoned',
  prone: 'prone',
  restrained: 'restrained',
  stunned: 'stunned',
  unconscious: 'unconscious',
};

/** Maps skill display names to dnd5e skill keys. */
export const SKILL_MAP: Record<string, string> = {
  acrobatics: 'acr',
  'animal handling': 'ani',
  arcana: 'arc',
  athletics: 'ath',
  deception: 'dec',
  history: 'his',
  insight: 'ins',
  intimidation: 'itm',
  investigation: 'inv',
  medicine: 'med',
  nature: 'nat',
  perception: 'prc',
  performance: 'prf',
  persuasion: 'per',
  religion: 'rel',
  'sleight of hand': 'slt',
  stealth: 'ste',
  survival: 'sur',
};

/** Maps dnd5e skill keys to their governing ability. */
export const SKILL_ABILITY_MAP: Record<string, string> = {
  acr: 'dex',
  ani: 'wis',
  arc: 'int',
  ath: 'str',
  dec: 'cha',
  his: 'int',
  ins: 'wis',
  itm: 'cha',
  inv: 'int',
  med: 'wis',
  nat: 'int',
  prc: 'wis',
  prf: 'cha',
  per: 'cha',
  rel: 'int',
  slt: 'dex',
  ste: 'dex',
  sur: 'wis',
};

/** Maps language display names to dnd5e language keys. */
export const LANGUAGE_MAP: Record<string, string> = {
  common: 'common',
  dwarvish: 'dwarvish',
  elvish: 'elvish',
  giant: 'giant',
  gnomish: 'gnomish',
  goblin: 'goblin',
  halfling: 'halfling',
  orc: 'orc',
  abyssal: 'abyssal',
  celestial: 'celestial',
  draconic: 'draconic',
  'deep speech': 'deep',
  infernal: 'infernal',
  primordial: 'primordial',
  sylvan: 'sylvan',
  undercommon: 'undercommon',
};

/** Maps creature size to prototype token grid dimensions. */
export const TOKEN_SIZE_MAP: Record<string, number> = {
  tiny: 0.5,
  small: 1,
  medium: 1,
  large: 2,
  huge: 3,
  gargantuan: 4,
};
