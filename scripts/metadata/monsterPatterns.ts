/**
 * @fileoverview Monster Metadata Generator Patterns
 * @description Pre-compiled regex patterns specific to the monster metadata
 * generator. Patterns shared with the feature extraction pipeline are in
 * `extraction/featurePatterns.ts`; this file covers stat-block identification,
 * table parsing, speed modes, ability scores, and image detection.
 *
 * @module scripts/metadata/monsterPatterns
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

/**
 * Italic metadata line cleanup patterns.
 *
 * @property {RegExp} cleanPrefix - Strip leading comma and whitespace
 * @property {RegExp} stripParen - Remove parenthetical annotations
 */
export const ITALIC_META = {
  cleanPrefix: /^\s*,?\s*/g,
  stripParen: /\(.*?\)/g,
} as const;

/**
 * Stat block table detection patterns.
 *
 * @property {RegExp} dataRow - Line starting with pipe (table data row)
 * @property {RegExp} abilityHeader - Six-ability header row (STR DEX CON INT WIS CHA)
 * @property {RegExp} separatorRow - Table separator row (|---|---|)
 */
export const STAT_TABLE = {
  dataRow: /^\s*\|/,
  abilityHeader:
    /^\s*\|\s*\*?\*?STR\*?\*?\s+\|\s*\*?\*?DEX\*?\*?\s+\|\s*\*?\*?CON\*?\*?\s+\|\s*\*?\*?INT\*?\*?\s+\|\s*\*?\*?WIS\*?\*?\s+\|\s*\*?\*?CHA\*?\*?\s*\|/i,
  separatorRow: /^\|[-\s|]+\|$/,
} as const;

/**
 * Speed parsing patterns.
 *
 * @property {RegExp} hoverDistance - "hover 60 ft."
 */
export const SPEED = {
  hoverDistance: /hover\s+(\d+)\s*ft\.?/i,
} as const;

/**
 * Stat block heading detection patterns for title extraction.
 *
 * @property {RegExp} blockquoteHeading - Blockquote heading: "> ## Title"
 * @property {RegExp} normalHeading - Normal H1–H3 heading: "## Title"
 */
export const MONSTER_HEADING = {
  blockquoteHeading: /^>\s*#{1,4}\s+\*?\*?(.+?)\*?\*?\s*$/,
  normalHeading: /^#{1,3}\s+\*?\*?(.+?)\*?\*?\s*$/,
} as const;

/**
 * Image detection patterns for BlendedImage JSX components.
 *
 * @property {RegExp} srcAttr - Multi-line JSX src attribute
 * @property {RegExp} blendedImageTag - BlendedImage tag opening
 * @property {RegExp} jsxSelfClose - JSX self-closing marker "/>"
 * @property {RegExp} tableStart - Table row start "|" (used as scan stop)
 */
export const IMAGE = {
  srcAttr: /^\s*src\s*=\s*['"]([^'"]+)['"]/i,
  blendedImageTag: /<BlendedImage\b/i,
  jsxSelfClose: /\/>/,
  tableStart: /^\|/,
} as const;

/**
 * Stat block content parsing patterns.
 *
 * @property {RegExp} nonmagicalDamage - "bludgeoning, piercing, and slashing from nonmagical..."
 * @property {RegExp} keyValueBullet - Key-value bullet with known stat label
 * @property {RegExp} blockquotePrefix - Blockquote line prefix "> " and any indentation after it
 * @property {RegExp} blockquoteMarker - Just the "> " marker; keeps the line's own indentation
 * @property {RegExp} armorClassRow - Header-table row opening with **Armor Class**, quoted or not
 * @property {RegExp} sheetFilePattern - Monster sheet file extension pattern
 */
export const STAT_CONTENT = {
  nonmagicalDamage:
    /bludgeoning,?\s+piercing,?\s+and\s+slashing\s+from\s+nonmagical\s+[^;,]+/i,
  keyValueBullet:
    /^[-*]\s+\*\*(Tier Bonus|Challenge|Languages|Senses|Condition Immunities|Damage|Skills|Saving Throws)\*\*/i,
  blockquotePrefix: /^>\s*/,
  blockquoteMarker: /^> ?/,
  armorClassRow: /^>?\s*\|\s*\*\*Armor Class\*\*/i,
  sheetFilePattern: /\.sheet\.mdx$/i,
} as const;
