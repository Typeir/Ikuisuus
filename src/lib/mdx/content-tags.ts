/**
 * @fileoverview Content Tags System - Type definitions and tag utilities for MDX metadata
 * @description Defines TypeScript enums and type definitions for categorizing d20 content.
 * Includes spells, monsters, bloodlines, vocations, items, locations, and rules. Provides
 * union types for action economies, creature sizes, hit dice, and spellcasting progression.
 * Used by metadata generators and content filtering systems.
 * 
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires None - Pure type definitions
 * 
 * @example
 * ```typescript
 * import { ContentKind, SpellActionType } from '@/lib/mdx/content-tags';
 * 
 * const spellKind: ContentKind = ContentKind.Spell;
 * const actionType: SpellActionType = 'bonus_action';
 * ```
 * @module src/lib/mdx/content-tags
 */

/**
 * All valid content kinds.
 * @enum {string}
 */
export enum ContentKind {
  Spell = "spell",
  Monster = "monster",
  Bloodline = "bloodline",
  Vocation = "vocation",
  Item = "item",
  Location = "location",
  Rule = "rule",
}


/** @typedef {"action" | "bonus_action" | "reaction" | "special"} SpellActionType */
export type SpellActionType =
| "action"
| "bonus_action"
| "reaction"
| "special";

/** @typedef {"Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Gargantuan"} CreatureSize */
export type CreatureSize =
| "Tiny"
| "Small"
| "Medium"
| "Large"
| "Huge"
| "Gargantuan"
| "Colossal"
| "Titanic";

/** @typedef {"d6" | "d8" | "d10" | "d12"} HitDie */
export type HitDie = "d4" | "d6" | "d8" | "d10" | "d12";

/** @typedef {"none" | "half" | "full" | "third"} SpellcastingType */
export type SpellcastingType = "none" | "half" | "full" | "third";

/** @typedef {"STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA"} AbilityScore */
export type AbilityScore = "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";

/**
 * Common metadata for any MDX-backed content.
 * @typedef {Object} BaseContentMeta
 * @property {string} id
 * @property {ContentKind} kind
 * @property {string} title
 * @property {string} [slug]
 * @property {string} [lang]
 * @property {boolean} [draft]
 * @property {string} [source]
 */
export interface BaseContentMeta {
  id: string;
  kind: ContentKind;
  title: string;
  slug?: string;
  lang?: string;
  draft?: boolean;
  source?: string;
}

/**
 * Generic tagging/search helpers.
 * @typedef {Object} BaseTagging
 * @property {string[]} [tags]
 * @property {string[]} [keywords]
 * @property {string[]} [regions]
 * @property {string[]} [eras]
 */
export interface BaseTagging {
  tags?: string[];
  keywords?: string[];
  regions?: string[];
  eras?: string[];
}

/**
 * Spell component metadata.
 * @typedef {Object} SpellComponents
 * @property {boolean} v
 * @property {boolean} s
 * @property {boolean} m
 * @property {string} [materialText]
 * @property {number} [costGp]
 * @property {boolean} [consumed]
 */
export interface SpellComponents {
  v: boolean;
  s: boolean;
  m: boolean;
  materialText?: string;
  costGp?: number;
  consumed?: boolean;
}

/**
 * Spell metadata for spell list indexing.
 * @typedef {BaseContentMeta & BaseTagging & {
 *   kind: ContentKind.Spell,
 *   level: number,
 *   tier?: string,
 *   school: string,
 *   actionType: SpellActionType,
 *   range: string,
 *   ritual: boolean,
 *   concentration: boolean,
 *   duration: string,
 *   components: SpellComponents,
 *   damageType?: string | null,
 *   saveType?: string | null,
 *   attackRoll?: boolean,
 *   grantedBy?: string[],
 *   lists?: string[]
 * }} SpellTag
 */
export interface SpellTag extends BaseContentMeta, BaseTagging {
  kind: ContentKind.Spell;
  level: number;
  tier?: string;
  school: string;
  actionType: SpellActionType;
  range: string;
  ritual: boolean;
  concentration: boolean;
  duration: string;
  components: SpellComponents;
  damageType?: string | null;
  saveType?: string | null;
  attackRoll?: boolean;
  grantedBy?: string[];
  lists?: string[];
}

/**
 * Monster metadata for indexing.
 * @typedef {BaseContentMeta & BaseTagging & {
 *   kind: ContentKind.Monster,
 *   cr: number,
 *   size: CreatureSize,
 *   creatureType: string,
 *   alignment?: string,
 *   environment?: string[],
 *   levelRange?: [number, number]
 * }} MonsterTag
 */
export interface MonsterTag extends BaseContentMeta, BaseTagging {
  kind: ContentKind.Monster;
  cr: number;
  size: CreatureSize;
  creatureType: string;
  alignment?: string;
  environment?: string[];
  levelRange?: [number, number];
}

/**
 * Bloodline metadata.
 * @typedef {BaseContentMeta & BaseTagging & {
 *   kind: ContentKind.Bloodline,
 *   vocation: string,
 *   primaryAbility?: AbilityScore,
 *   theme?: string,
 *   originRegion?: string,
 *   recommendedRoles?: string[]
 * }} BloodlineTag
 */
export interface BloodlineTag extends BaseContentMeta, BaseTagging {
  kind: ContentKind.Bloodline;
  vocation: string;
  primaryAbility?: AbilityScore;
  theme?: string;
  originRegion?: string;
  recommendedRoles?: string[];
}

/**
 * Vocation/class metadata.
 * @typedef {BaseContentMeta & BaseTagging & {
 *   kind: ContentKind.Vocation,
 *   hitDie: HitDie,
 *   primaryAbilities: AbilityScore[],
 *   saves: AbilityScore[],
 *   armorProficiencies?: string[],
 *   weaponProficiencies?: string[],
 *   spellcastingType?: SpellcastingType,
 *   spellListId?: string | null,
 *   maxLevel?: number
 * }} VocationTag
 */
export interface VocationTag extends BaseContentMeta, BaseTagging {
  kind: ContentKind.Vocation;
  hitDie: HitDie;
  primaryAbilities: AbilityScore[];
  saves: AbilityScore[];
  armorProficiencies?: string[];
  weaponProficiencies?: string[];
  spellcastingType?: SpellcastingType;
  spellListId?: string | null;
  maxLevel?: number;
}

/**
 * @typedef {SpellTag | MonsterTag | BloodlineTag | VocationTag} AnyTag
 */
export type AnyTag = SpellTag | MonsterTag | BloodlineTag | VocationTag;

/**
 * Type guard to check if a content tag is a SpellTag.
 * 
 * @param {AnyTag} tag - The tag to check
 * @returns {tag is SpellTag} True if tag is a SpellTag
 */
export const isSpellTag = (tag: AnyTag): tag is SpellTag =>
  tag.kind === ContentKind.Spell;

/**
 * Type guard to check if a content tag is a MonsterTag.
 * 
 * @param {AnyTag} tag - The tag to check
 * @returns {tag is MonsterTag} True if tag is a MonsterTag
 */
export const isMonsterTag = (tag: AnyTag): tag is MonsterTag =>
  tag.kind === ContentKind.Monster;

/**
 * Type guard to check if a content tag is a BloodlineTag.
 * 
 * @param {AnyTag} tag - The tag to check
 * @returns {tag is BloodlineTag} True if tag is a BloodlineTag
 */
export const isBloodlineTag = (tag: AnyTag): tag is BloodlineTag =>
  tag.kind === ContentKind.Bloodline;

/**
 * Type guard to check if a content tag is a VocationTag.
 * 
 * @param {AnyTag} tag - The tag to check
 * @returns {tag is VocationTag} True if tag is a VocationTag
 */
export const isVocationTag = (tag: AnyTag): tag is VocationTag =>
  tag.kind === ContentKind.Vocation;
