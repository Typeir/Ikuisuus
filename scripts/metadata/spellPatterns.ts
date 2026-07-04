/**
 * @fileoverview Spell Metadata Patterns
 * @description Pre-compiled regex patterns for the spell metadata generator.
 * Centralizes stat-block line detection, component parsing, casting-time
 * classification, and spell-list extraction.
 *
 * @module scripts/metadata/spellPatterns
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

/**
 * Spell stat-block line detection patterns.
 *
 * @property {RegExp} italicHeader - Italic header: "> *1st-Level Evocation*"
 * @property {RegExp} levelPrefix - Spell level: "1st-Level", "2nd-Level", etc.
 * @property {RegExp} componentsLine - "Components" line detection
 * @property {RegExp} componentsStrip - Strip the "Components" header
 * @property {RegExp} castingTimeLine - "Casting Time" line detection
 * @property {RegExp} castingTimeStrip - Strip the "Casting Time" header
 * @property {RegExp} rangeLine - "Range" line detection
 * @property {RegExp} rangeStrip - Strip the "Range" header
 * @property {RegExp} durationLine - "Duration" line detection
 * @property {RegExp} durationStrip - Strip the "Duration" header
 */
export const STAT_BLOCK = {
  italicHeader: /^>\s*[*_](.+?)[*_]\s*$/,
  levelPrefix: /^(\d+)(?:st|nd|rd|th)-Level/i,
  componentsLine: /^>\s*\*\*Components\*\*:/i,
  componentsStrip: /^>\s*\*\*Components\*\*:\s*/i,
  castingTimeLine: /^>\s*\*\*Casting Time\*\*:/i,
  castingTimeStrip: /^>\s*\*\*Casting Time\*\*:\s*/i,
  rangeLine: /^>\s*\*\*Range\*\*:/i,
  rangeStrip: /^>\s*\*\*Range\*\*:\s*/i,
  durationLine: /^>\s*\*\*Duration\*\*:/i,
  durationStrip: /^>\s*\*\*Duration\*\*:\s*/i,
} as const;

/**
 * Spell component detection patterns.
 *
 * @property {RegExp} verbal - Verbal component marker
 * @property {RegExp} somatic - Somatic component marker
 * @property {RegExp} material - Material component marker
 * @property {RegExp} materialDesc - Material description: "M (a pinch of sulfur)"
 */
export const COMPONENTS = {
  verbal: /\bV\b/i,
  somatic: /\bS\b/i,
  material: /\bM\b/i,
  materialDesc: /\bM\s*\(([^)]+)\)/i,
} as const;

/**
 * Casting time classification patterns.
 *
 * @property {RegExp} minorAction - "Minor Action"
 * @property {RegExp} action - "action" (with negative lookbehind for "bonus")
 * @property {RegExp} reaction - "reaction"
 * @property {RegExp} timeDuration - "10 minutes", "1 hour", etc.
 * @property {RegExp} ritual - "ritual"
 */
export const CASTING_TIME = {
  minorAction: /\bminor\s+action\b/i,
  action: /\b(?<!minor\s)action\b/i,
  reaction: /\breaction\b/i,
  timeDuration: /(\d+\s*(?:minute|min|hour|hr|round|day)s?)/i,
  ritual: /\britual\b/i,
} as const;

/**
 * Duration and concentration patterns.
 *
 * @property {RegExp} concentration - "concentration" keyword
 * @property {RegExp} concentrationPrefix - "Concentration, " prefix to strip
 */
export const DURATION = {
  concentration: /\bconcentration\b/i,
  concentrationPrefix: /^concentration,\s*/i,
} as const;

/**
 * Spell tag detection patterns.
 *
 * @property {RegExp} aoeShape - Area-of-effect shapes
 * @property {RegExp} ritual - Ritual spell keyword
 */
export const SPELL_TAGS = {
  aoeShape: /\b(sphere|cube|cone|line|cylinder|radius)\b/i,
  ritual: /\britual\b/i,
} as const;

/**
 * Spell list extraction patterns.
 *
 * @property {RegExp} section - "#### Spell Lists" section boundary
 * @property {RegExp} link - Spell list link: "[_Wizard Spell List_](/path)"
 * @property {RegExp} nameSuffix - "Spell List" suffix to strip from names
 */
export const SPELL_LISTS = {
  section: /####\s*Spell Lists\s*([\s\S]*?)(?=\n#|$)/i,
  link: /\[_?([^_\]]+?)(?:\s+Spell List)?_?\]\(([^)]+)\)/gi,
  nameSuffix: /\s+Spell List$/i,
} as const;
