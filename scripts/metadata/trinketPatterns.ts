/**
 * @fileoverview Trinket Metadata Patterns
 * @description Pre-compiled regex patterns for the trinket metadata generator.
 *
 * @module scripts/metadata/trinketPatterns
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

/**
 * Bold property extraction patterns for trinket stat blocks.
 *
 * @property {RegExp} damage - "**Damage**
 * @property {RegExp} damageType - "**Damage Type**
 * @property {RegExp} properties - "**Properties**
 * @property {RegExp} range - "**Range**
 * @property {RegExp} weight - "**Weight**
 * @property {RegExp} specialNotation - "special (effect)" to strip
 */
export const PROPERTY = {
  damage: /\*\*Damage\*\*:\s*(.+)/,
  damageType: /\*\*Damage Type\*\*:\s*(.+)/,
  properties: /\*\*Properties\*\*:\s*(.+)/,
  range: /\*\*Range\*\*:\s*(.+)/,
  weight: /\*\*Weight\*\*:\s*(.+)/,
  specialNotation: /special\s*\([^)]+\)/gi,
} as const;

/**
 * Combat mechanic patterns for trinkets.
 *
 * @property {RegExp} dcSavingThrow - "DC 16 Wisdom saving throw"
 * @property {RegExp} specialEffects - "Special (effect description)"
 */
export const MECHANICS = {
  dcSavingThrow: /DC\s+(\d+)\s+(\w+)\s+saving throw/i,
  specialEffects: /Special\s*\(([^)]+)\)/i,
} as const;
