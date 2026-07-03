/**
 * @fileoverview Heirloom Metadata Patterns
 * @description Pre-compiled regex patterns for the heirloom metadata generator.
 * Centralizes weapon title-line parsing, attunement detection, and damage
 * extraction from property sections.
 *
 * @module scripts/metadata/heirloomPatterns
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

/**
 * Weapon title-line parsing patterns.
 *
 * @property {RegExp} nameBeforeParen - Name before parenthesis: "Longsword ("
 * @property {RegExp} enhancementMod - Enhancement modifier: "Longsword +2"
 * @property {RegExp} mastery - Mastery extraction: "Mastery: Cleave"
 * @property {RegExp} masteryEnd - End mastery capture: "Special:", "Range:", etc.
 * @property {RegExp} range - Range variant: "Range 30/120"
 * @property {RegExp} reach - Reach variant: "Reach (10 ft.)"
 * @property {RegExp} special - Special property: "Special: on crit..."
 * @property {RegExp} typeExtract - Type with optional paren: "Longsword (props)"
 * @property {RegExp} reachInParens - Reach in parentheses: "reach (10 ft.)"
 */
export const WEAPON = {
  nameBeforeParen: /^(.+?)\s*\(/i,
  enhancementMod: /^(.+?)\s+\+(\d+)$/,
  mastery: /^Mastery:\s*(.+)$/i,
  masteryEnd: /^(Special|Range|Ranged?|Reach)\s*[:(/]/i,
  range: /^(?:Ranged?|Range)\s+(\d+\/\d+|\(\d+\s+ft\))$/i,
  reach: /^Reach\s+\((\d+\s+ft\.?)\)$/i,
  special: /^Special:\s*(.+)$/i,
  typeExtract: /^([A-Za-z][A-Za-z\s-]+?)(?:\s*\(|$)/i,
  reachInParens: /^reach\s*\(\d+\s*ft\.?\)$/i,
} as const;

/**
 * Attunement detection patterns.
 *
 * @property {RegExp} requirement - "requires attunement (by a Pilgrim)"
 */
export const ATTUNEMENT = {
  requirement: /requires attunement(?:\s+by\s+(.+?))?(?:\)|$)/i,
} as const;

/**
 * Italic metadata line patterns used in heirloom header parsing.
 *
 * @property {RegExp} line - Italic line: "_text_"
 * @property {RegExp} subtypeFormat - "Type, Subtype (properties)" format
 * @property {RegExp} propertyOrApplies - "property" or "applies" keyword filter
 */
export const ITALIC = {
  line: /^_.*_$/,
  subtypeFormat: /^[^,]+,\s*[^,]+\s*\([^)]+\)\s*$/,
  propertyOrApplies: /property|applies/i,
} as const;

/**
 * Weapon damage parsing from Properties section.
 *
 * @property {RegExp} weaponDamage - "1d8 slashing (1d10 versatile)"
 */
export const DAMAGE = {
  weaponDamage:
    /([\dd+]+)\s+(acid|bludgeoning|cold|fire|force|lightning|necrotic|piercing|poison|psychic|radiant|slashing|thunder)(?:\s*\(([\dd+]+)\s*(?:versatile)?\))?/i,
} as const;

/**
 * Type property parsing patterns for heirloom classification.
 *
 * @property {RegExp} parenContent - Extract parenthesized content: "(properties)"
 * @property {RegExp} masterySpecialGuard - Guard: skip Mastery/Special items
 * @property {RegExp} twoPartFormat - "Type, Subtype" comma-split format
 * @property {RegExp} beforeParen - Text before first parenthesis
 */
export const TYPE_PARSING = {
  parenContent: /\(([^)]+)\)/i,
  masterySpecialGuard: /^(Mastery|Special):/i,
  twoPartFormat: /^([^,]+),\s*([^,]+)$/,
  beforeParen: /^([^(]+)/,
} as const;
