/**
 * @fileoverview Bloodline Metadata Patterns
 * @description Pre-compiled regex patterns for the bloodline metadata generator.
 * Centralizes HTML/MDX markup cleanup, boon heading parsing, section
 * detection, and proficiency tagging patterns.
 *
 * @module scripts/metadata/bloodlinePatterns
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

/**
 * HTML and MDX markup patterns for table-cell content.
 *
 * @property {RegExp} listItem - HTML list item: {@literal <li>content</li>}
 * @property {RegExp} tooltipText - Tooltip display: {@literal <Tooltip><span>text</span>}
 * @property {RegExp} htmlTag - Any HTML tag for stripping
 * @property {RegExp} tooltipWrapper - Full Tooltip wrapper with both spans
 * @property {RegExp} markdownLink - Markdown link: [text](url)
 */
export const MARKUP = {
  listItem: /<li>([\s\S]*?)<\/li>/g,
  tooltipText: /<Tooltip><span>(.*?)<\/span>/,
  htmlTag: /<[^>]+>/g,
  tooltipWrapper:
    /<Tooltip>\s*<span>(.*?)<\/span>\s*<span>[\s\S]*?<\/span>\s*<\/Tooltip>/gi,
  markdownLink: /\[([^\]]+)\]\(([^)]+)\)/g,
} as const;

/**
 * Section boundary detection patterns.
 *
 * @property {RegExp} boons - Boons section start: "## Boons"
 * @property {RegExp} h2Heading - Any H2 heading (section boundary)
 * @property {RegExp} coreFeatures - Core Features section with content capture
 */
export const SECTION = {
  boons: /^##\s+Boons\b/i,
  h2Heading: /^##\s+/,
  coreFeatures: /## Core Features\s*\n([\s\S]*?)(?=\n---|\n## )/,
} as const;

/**
 * Boon heading parsing patterns.
 *
 * @property {RegExp} spanHeading - Span-annotated: "##### Name {@literal <span>3 BP</span>}"
 * @property {RegExp} plainHeading - Plain heading: "##### Name"
 * @property {RegExp} inlineCost - Inline BP cost suffix: "Name (3 BP)"
 * @property {RegExp} bpValue - Numeric BP value: "3 BP"
 * @property {RegExp} budgetPattern - Budget declaration: "budget of **10 Boon Points**"
 * @property {RegExp} headingGuard - H5/H6 heading level guard
 */
export const BOON = {
  spanHeading: /^#{5,6}\s+(.+?)\s*<span>(.*?)<\/span>\s*$/i,
  plainHeading: /^#{5,6}\s+(.+)$/,
  inlineCost: /^(.*?)[\s\-–—]*\(([^)]+BP[^)]*)\)\s*$/i,
  bpValue: /(?:^|\b)(\d{1,3})\s*BP\b/i,
  budgetPattern: /budget of \*\*(\d+)\s+Boon Points?\*\*/i,
  headingGuard: /^#{5,6}\s+/,
} as const;

/**
 * Proficiency detection patterns for boon tagging.
 *
 * @property {RegExp} keyword - "proficiency" or "proficient"
 * @property {ReadonlyArray<{ pattern: RegExp; tag: string }>} tools - Tool proficiency matchers
 * @property {RegExp} instrument - Musical instrument keyword
 * @property {RegExp} weaponMastery - Weapon mastery keyword
 * @property {RegExp} shortRest - Short rest recovery
 * @property {RegExp} longRest - Long rest recovery
 * @property {RegExp} variableCost - Variable/choice cost indicators
 */
export const PROFICIENCY = {
  keyword: /\bproficien(?:cy|t)\b/,
  tools: [
    { pattern: /mason'?s tools?/i, tag: 'mason-tools' },
    { pattern: /navigator'?s tools?/i, tag: 'navigators-tools' },
    { pattern: /tinkerer'?s tools?/i, tag: 'tinkerers-tools' },
    { pattern: /artisan'?s tools?/i, tag: 'artisans-tools' },
    { pattern: /thieves'? tools?/i, tag: 'thieves-tools' },
    { pattern: /lockpick set/i, tag: 'lockpicks' },
  ] as ReadonlyArray<{ pattern: RegExp; tag: string }>,
  instrument: /\binstrument\b|\bmusical\b/i,
  weaponMastery: /\bmartial weapon\b|\bweapon mastery\b|\bmastery\b/i,
} as const;

/**
 * Boon mechanic detection patterns.
 *
 * @property {RegExp} variableCost - Variable/choice BP cost in label
 * @property {RegExp} shortRest - Short rest recovery
 * @property {RegExp} longRest - Long rest recovery
 * @property {RegExp} limitedUses - Limited uses per proficiency bonus
 * @property {RegExp} armorClass - AC or armor class mechanic
 * @property {RegExp} savingThrow - Saving throw or spell save DC
 * @property {RegExp} weapon - Weapon, melee, or natural weapon mechanic
 * @property {RegExp} reach - Weapon reach
 * @property {RegExp} extraDamage - Extra damage dealing
 * @property {RegExp} bonusAction - Bonus action
 * @property {RegExp} reaction - Reaction
 * @property {RegExp} concentration - Concentration
 * @property {RegExp} spellcasting - Spellcasting or casting spells
 * @property {RegExp} innateSpellcasting - Innate spellcasting
 * @property {RegExp} cantrip - Cantrip
 * @property {RegExp} materialComponents - Material components or spellcasting focus
 */
export const BOON_MECHANICS = {
  variableCost: /\bvariable\b|\bchoose one\b|\bpick one\b|\bpick any\b/i,
  shortRest: /\bshort rest\b/i,
  longRest: /\blong rest\b/i,
  limitedUses: /\b(per|equal to your proficiency bonus)\b/i,
  armorClass: /\bac\b|\barmor class\b|\bunarmored\b/i,
  savingThrow: /\bsaving throws?\b|\bspell save dc\b|\bsave dc\b/i,
  weapon: /\bweapon\b|\bmelee\b|\bnatural weapon\b|\bopportunity attack\b/i,
  reach: /\breach\b/i,
  extraDamage: /\bextra\b[\s\S]{0,20}\bdamage\b|\bdeal extra\b/i,
  bonusAction: /\bbonus action\b/i,
  reaction: /\breaction\b/i,
  concentration: /\bconcentrat(?:e|ion)\b/i,
  spellcasting: /\bspellcasting\b|\bcast\b[\s\S]{0,12}\bspell\b/i,
  innateSpellcasting: /\binnate spellcasting\b/i,
  cantrip: /\bcantrip\b/i,
  materialComponents: /\bmaterial components?\b|\bspellcasting focus\b/i,
} as const;
