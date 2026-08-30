/**
 * @fileoverview Class & Specialization Metadata Patterns
 * @description Pre-compiled regex patterns shared by vocation and specialization
 * metadata generators. Centralizes table parsing, feature extraction, and
 * spellcasting detection into grouped dictionaries.
 *
 * @module scripts/metadata/classPatterns
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

/**
 * Markdown table detection and parsing patterns.
 *
 * @property {RegExp} featuresHeader - Feature table header row: "| Level |"
 * @property {RegExp} coreTraits - Core traits table start: "| Core X Traits"
 * @property {RegExp} traitHeader - Trait label table start: "| Trait |"
 * @property {RegExp} separator - Separator row: "|---|---|"
 * @property {RegExp} spellSlotColumn - Spell slot column: "1st", "2nd", etc.
 * @property {RegExp} classLevelHeader - "| (Class)? Level |"
 * @property {RegExp} levelSpellsHeader - "| Level | Spells |"
 * @property {RegExp} slotLevel - Slot level extraction: "1st", "2nd", etc.
 * @property {RegExp} markdownLink - Markdown link: [text](url)
 */
export const TABLE = {
  featuresHeader: /^\|\s*Level\s*\|/i,
  /** Matches "Features" or "Vocation Features" column header for index detection */
  featuresColumn: /^(?:(?:Vocation|Class)\s+)?Features$/i,
  coreTraits: /^\|\s*Core\s+\w+\s+Traits/i,
  traitHeader: /^\|\s*Trait\s*\|/i,
  separator: /^\|[-\s|]+\|$/,
  spellSlotColumn: /\d+(st|nd|rd|th)/,
  classLevelHeader:
    /^\|\s*(?:Berserker|Paladin|Druid|Villein|Strider|Warrior|Rogue|Pilgrim|Monk|Scion)?\s*Level\s*\|/i,
  levelSpellsHeader: /^\|\s*Level\s*\|\s*Spells?\s*\|/i,
  slotLevel: /(\d+)(st|nd|rd|th)/,
  markdownLink: /\[([^\]]+)\]\([^)]*\)/g,
} as const;

/**
 * Feature and level heading patterns.
 *
 * @property {RegExp} levelHeading - Collapsible block: "## 3rd Level – Feature Name"
 * @property {RegExp} specializationLink - "[name](/en/library/.../slug.specialization)"
 * @property {RegExp} hitDie - Hit die token: "d12"
 * @property {RegExp} skillCount - Skill count: "Choose 2", "Choose any 3", "Pick two"
 */
export const FEATURE = {
  levelHeading: /##\s+(\d+)\w*\s+Level\s+[–—-]\s+(.+)/,
  specializationLink: /\[.*?\]\(\/en\/library\/.*?\/([\w-]+)\.specialization\)/,
  hitDie: /d(\d+)/i,
  skillCount:
    /(?:Choose|Pick)\s+(?:any\s+)?(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i,
} as const;

/**
 * Spellcasting detection patterns for class/specialization context.
 *
 * @property {RegExp} abilityBold - "**Spellcasting Ability**: Wisdom"
 * @property {RegExp} abilityIs - "spellcasting ability is Wisdom"
 * @property {RegExp} abilityReversed - "Wisdom is your spellcasting ability"
 * @property {RegExp} modifierRef - "your Wisdom modifier"
 * @property {RegExp} dcModifier - "spell save DC...Wisdom modifier"
 * @property {RegExp} section - Spellcasting Collapsible block boundary
 * @property {RegExp} pactMagic - Pact Magic keyword
 * @property {RegExp} spellSlotsLabel - "Spell Slots" table header
 * @property {RegExp} slotLevelLabel - "Slot Level" table header
 * @property {RegExp} alwaysPrepared - Domain/Oath/Circle always-prepared keywords
 * @property {RegExp} specHeading - Spellblade/Arcane Trickster heading
 */
export const CASTING = {
  abilityBold: /\*\*Spellcasting Ability\*\*:\s*(\w+)/i,
  abilityIs: /spellcasting ability is (\w+)/i,
  abilityReversed: /(\w+) is your spellcasting ability/i,
  modifierRef: /your (\w+) modifier/i,
  dcModifier: /spell save DC.*?(\w+) modifier/i,
  section:
    /##\s+\d+\w*\s+Level\s+[–—-]\s+Spellcasting[\s\S]*?(?=<\/Collapsible>|##\s+\d)/i,
  pactMagic: /pact magic/i,
  spellSlotsLabel: /Spell Slots/i,
  slotLevelLabel: /Slot Level/i,
  alwaysPrepared:
    /(?:domain spells|oath spells|circle spells|expanded spell list|always.?prepared)/i,
  specHeading:
    /##\s+(?:Spellblade|Arcane Trickster|(?:\w+\s+)*Spellcasting)\s*$/m,
} as const;

/**
 * Specialization type classification — maps title patterns to type labels.
 *
 * @type {ReadonlyArray<{ pattern: RegExp; type: string }>}
 */
export const SPECIALIZATION_TYPES: ReadonlyArray<{
  pattern: RegExp;
  type: string;
}> = [
  { pattern: /^Path of/i, type: 'Path' },
  { pattern: /Domain$/i, type: 'Domain' },
  { pattern: /^College of/i, type: 'College' },
  { pattern: /^Circle of/i, type: 'Circle' },
  { pattern: /^Way of/i, type: 'Way' },
  { pattern: /^Oath of/i, type: 'Oath' },
  { pattern: /^Order of/i, type: 'Order' },
  { pattern: /^School of/i, type: 'School' },
  { pattern: /Patron$/i, type: 'Patron' },
  { pattern: /^The\s/i, type: 'Patron' },
  { pattern: /Knight$/i, type: 'Archetype' },
  { pattern: /Trickster$/i, type: 'Archetype' },
  { pattern: /Champion$/i, type: 'Archetype' },
  { pattern: /Master$/i, type: 'Archetype' },
];

/**
 * Flavor text detection patterns for specialization headers.
 *
 * @property {RegExp} underscoreItalic - Italic with underscores: "_text_"
 * @property {RegExp} asteriskItalic - Italic with asterisks: "*text*"
 */
export const FLAVOR = {
  underscoreItalic: /^_[^_]+_$/,
  asteriskItalic: /^\*[^*]+\*$/,
} as const;
