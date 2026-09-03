/**
 * @fileoverview Pre-compiled regex patterns for feature extraction.
 * @description Named patterns and lookup tables for extraction and generators.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * @module scripts/metadata/extraction/featurePatterns
 */

/**
 * Pre-compiled patterns for dice notation and damage expressions.
 *
 * @property {RegExp} full - Full dice expression with optional modifier
 * @property {RegExp} bare - Bare NdN without modifier
 * @property {RegExp} damageFormula - "deals 2d6 fire damage"
 * @property {RegExp} chargesInitial - "holds 10 charges"
 * @property {RegExp} chargesRecover - "regains 1d6+1 charges each dawn"
 * @property {RegExp} chargesDepletes - Item burns away on depletion
 * @property {RegExp} heirloomDamage - Heirloom stat line "1d8 slashing"
 */
export const DICE = {
  full: /(\d+)d(\d+)(?:\s*([+-])\s*(.+?))?(?:\s|,|$|\))/,
  bare: /\d+d\d+/,
  damageFormula:
    /(?:deals?|additional|extra)\s+(?:\d+d\d+|\d+)\s+(\w+)\s+damage/i,
  chargesInitial: /holds?\s+(?:up to\s+)?(\d+d\d+|\d+)\s+charges/i,
  chargesRecover:
    /(?:regain|recover)(?:ing|s)?\s+(\d+\s*\+\s*\d+d\d+|\d+d\d+|\d+)\s+charges?\s+(?:at|each)\s+(\w+)/i,
  chargesDepletes: /becomes?\s+inert|cannot be recharged|burns? away/i,
  heirloomDamage:
    /([\dd+]+)\s+(chemical|bludgeoning|frost|fire|force|lightning|dark|piercing|poison|psychic|holy|slashing)(?:\s*\(([\dd+]+)\s*(?:versatile)?\))?/i,
} as const;

/**
 * Pre-compiled patterns for Difficulty Class and saving throw expressions.
 *
 * @property {RegExp} dcFormula - "DC 10 + Prof + CHA mod", or the legacy "DC = ..." form
 * @property {RegExp} dcFlat - "DC 16"
 * @property {RegExp} savingThrow - "Wisdom saving throw" or "DEX save"
 * @property {RegExp} savingThrowWithDC - "DC 16 Wisdom saving throw"
 * @property {RegExp} autoFail - "automatically fails saving throws"
 */
export const SAVES = {
  dcFormula: /DC\s*(?:=\s*|(?=\d+\s*\+))(.+?)(?:\)|,|$)/i,
  dcFlat: /DC\s+(\d+)/i,
  savingThrow:
    /(?:(strength|dexterity|constitution|intelligence|wisdom|charisma|str|dex|con|int|wis|cha))\s+sav(?:ing\s+throw|e)/i,
  savingThrowWithDC: /DC\s+(\d+)\s+(\w+)\s+saving throw/i,
  autoFail: /automatically\s+(fails?|succeeds?)\s+(?:all\s+)?saving\s+throws?/i,
} as const;

/**
 * Regex source matching a distance in the `[= N stride =]` macro form or
 * the legacy imperial spellings. The opening bracket is optional, so the
 * numeric value always lands in capture group 1. Values are strides; convert
 * to imperial units downstream.
 *
 * @constant
 */
const MEASURE = String.raw`(?:\[=\s*)?(\d+)[- ]?(?:stride(?:;ADJ)?\s*=\]|foot|feet|ft\.?)`;

/**
 * Builds a case-insensitive pattern around the shared measure fragment.
 *
 * @param {string} source - Regex source, with `{M}` marking the measure slot
 * @returns {RegExp} The compiled pattern
 */
const measurePattern = (source: string): RegExp =>
  new RegExp(source.replace('{M}', MEASURE), 'i');

/**
 * Pre-compiled patterns for distances, areas, and shapes.
 *
 * Each distance pattern accepts the `[= N stride =]` macro as well as the
 * legacy imperial spellings.
 *
 * @property {RegExp} feet - "[= 6 stride =]", "30 ft", "60-foot", "10 feet"
 * @property {RegExp} wide - "[= 2 stride;ADJ =]-wide", "10-foot wide"
 * @property {RegExp} high - "20 feet high", "30-foot tall"
 * @property {RegExp} reach - "reach [= 1 stride =]", "reach 10 ft"
 * @property {RegExp} range - "range 30/120 ft"
 * @property {RegExp} aoeShape - "sphere", "cone", "cube", etc.
 * @property {RegExp} sense - "darkvision [= 12 stride =]"
 */
export const DISTANCE = {
  feet: measurePattern(String.raw`{M}`),
  wide: measurePattern(String.raw`{M}[- ]?wide`),
  high: measurePattern(String.raw`{M}[- ]?(?:high|tall)`),
  reach: measurePattern(String.raw`reach\s+{M}`),
  range: /range\s+(\d+)(?:\/(\d+))?\s*ft/i,
  aoeShape: /\b(sphere|cube|cone|line|cylinder|radius|wall|square)\b/i,
  sense: measurePattern(String.raw`{M}`),
} as const;

/**
 * Reads the numeric value from a match produced by a measure-bearing pattern.
 * The macro and legacy alternatives occupy different capture groups, so
 * consumers should not index groups directly.
 *
 * @param {RegExpMatchArray | null} match - A match from a DISTANCE pattern
 * @returns {number | undefined} The distance, or undefined when absent
 *
 * @example
 * measureValue('[= 6 stride =]'.match(DISTANCE.feet)) // 6
 * measureValue('30 ft'.match(DISTANCE.feet))          // 30
 */
export function measureValue(
  match: RegExpMatchArray | null,
): number | undefined {
  if (!match) {
    return undefined;
  }

  for (let i = 1; i < match.length; i += 1) {
    if (match[i] !== undefined && /^\d+$/.test(match[i])) {
      return Number.parseInt(match[i], 10);
    }
  }

  return undefined;
}

/**
 * Pre-compiled patterns for action types and timing.
 *
 * @property {RegExp} minorAction - "Minor Action"
 * @property {RegExp} reaction - "reaction"
 * @property {RegExp} freeAction - "free action"
 * @property {RegExp} passive - "passive"
 * @property {RegExp} action - "action"
 * @property {RegExp} bonus - "bonus" (negative filter)
 * @property {RegExp} free - "free" (negative filter)
 * @property {RegExp} ritual - "ritual"
 */
export const ACTIONS = {
  minorAction: /\bminor\s+action\b/i,
  reaction: /\breaction\b/i,
  freeAction: /\bfree\s+action\b/i,
  passive: /\bpassive\b/i,
  action: /\baction\b/i,
  bonus: /\bbonus\b/i,
  free: /\bfree\b/i,
  ritual: /\britual\b/i,
} as const;

/**
 * Pre-compiled patterns for spell and effect durations.
 *
 * @property {RegExp} concentration - "concentration"
 * @property {RegExp} instantaneous - "instant" or "instantaneous"
 * @property {RegExp} upTo - "up to 1 minute"
 * @property {RegExp} timeUnit - "10 minutes", "1 round"
 * @property {RegExp} untilDismissed - "until dismissed"
 * @property {RegExp} untilEndOfTurn - "until [the] end of your turn"
 */
export const DURATION = {
  concentration: /\bconcentration\b/i,
  instantaneous: /\binstant(?:aneous)?\b/i,
  upTo: /up\s+to\s+(\d+)\s+(minute|hour|round|day|turn)s?/,
  timeUnit: /(\d+)\s+(minute|hour|round|day|turn)s?/,
  untilDismissed: /\buntil\s+dismissed\b/i,
  untilEndOfTurn:
    /\buntil\s+(?:the\s+)?end\s+of\s+(?:your|its|the)\s+(?:next\s+)?turn\b/i,
} as const;

/**
 * Pre-compiled patterns for resource costs and recharge mechanics.
 *
 * @property {RegExp} charges - "3 charges"
 * @property {RegExp} spellSlot - "1 spell slot"
 * @property {RegExp} sorceryPoints - "2 sorcery points"
 * @property {RegExp} boonPoints - "3 BP"
 * @property {RegExp} uses - "2 uses"
 * @property {RegExp} hitDice - "1 hit dice"
 * @property {RegExp} spellPoints - "4 spell points"
 * @property {RegExp} deeds - "2 deeds"
 * @property {RegExp} rechargeAmount - "regains 3"
 * @property {RegExp} oncePer - "once per day"
 * @property {RegExp} rechargeAfter - "recharges after a Recovery"
 */
export const RESOURCES = {
  charges: /(\d+)\s*charges?/i,
  spellSlot: /(\d+)\s*(?:spell\s+)?slots?/i,
  sorceryPoints: /(\d+)\s*sorcery\s+points?/i,
  boonPoints: /(\d+)\s*(?:boon\s+points?|BP)/i,
  uses: /(\d+)\s*(?:wild\s+shape\s+)?uses?/i,
  hitDice: /(\d+)\s*(?:hit\s+dice|HD)/i,
  spellPoints: /(\d+)\s*(?:spell\s+)?points?/i,
  deeds: /(\d+)\s*deeds?/i,
  rechargeAmount: /(?:regain|recover|restore)s?\s+(\d+)/,
  oncePer: /once\s+per\s+(day|hour|round|turn|minute)/,
  rechargeAfter: /recharges?\s+(?:after|on)\s+(?:a\s+)?(.+?)(?:\.|,|$)/,
} as const;

/**
 * Pre-compiled patterns for formula template expressions.
 *
 * @property {RegExp} abilityModifier - "your Wisdom modifier"
 * @property {RegExp} tierBonus - "your tier bonus"
 * @property {RegExp} classLevel - "your Warrior level"
 * @property {RegExp} compositeFormula - "8 + Prof + CHA modifier"
 */
export const TEMPLATES = {
  abilityModifier:
    /your\s+(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+modifier/i,
  tierBonus: /your\s+tier\s+bonus/i,
  classLevel: /your\s+(\w+)\s+level/i,
  compositeFormula:
    /(\d+)\s*\+\s*(?:your\s+)?(?:tier\s+bonus|Tier)\s*\+\s*(?:your\s+)?(STR|DEX|CON|INT|WIS|CHA)\s+mod(?:ifier)?/i,
} as const;

/**
 * Pre-compiled patterns for monster stat block parsing.
 *
 * @property {RegExp} attackLine - "_Melee Weapon Attack:_ +7 to hit"
 * @property {RegExp} hitLine - "_Hit:_ 12 (2d8 + 3) slashing damage"
 * @property {RegExp} multiattack - "multiattack"
 * @property {RegExp} attackSegment - "two claw attacks"
 * @property {RegExp} condition - "while raging", "when transformed"
 * @property {RegExp} deedCost - "(Costs 2 Deeds)"
 * @property {RegExp} phaseThreshold - "Wounded (75%)"
 * @property {RegExp} phaseSlain - "Slain"
 * @property {RegExp} declareResolve - "**Declare** ..."
 * @property {RegExp} chargeRecharge - "(3 charges, Recharge 5-6)"
 * @property {RegExp} targets - "one target", "two creatures"
 * @property {RegExp} passivePerception - "passive Perception 14"
 * @property {RegExp} speedMode - "fly 60 ft."
 * @property {RegExp} hover - "hover"
 * @property {RegExp} armorClassHeader - "| **Armor Class**"
 * @property {RegExp} savingThrowBonus - "Str +5"
 * @property {RegExp} challengeRating - "1/2" or "17"
 */
export const MONSTER = {
  attackLine:
    /_?(Melee|Ranged)\s+(Weapon|Spell)\s+Attack:_?\s*\+(\d+)\s+to\s+hit/i,
  hitLine: /_?Hit:_?\s*\*{0,2}(\d+)\s*\((.+?)\)\*{0,2}\s*(\w+)?\s*damage/i,
  multiattack: /multiattack/i,
  attackSegment:
    /(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+((?:\w+\s+)*\w+)\s+attacks?/i,
  condition: /(?:while|when|if)\s+(.+?)(?:\.|,|$)/i,
  deedCost: /\(Costs?\s+(\d+)\s+Deeds?\)/i,
  phaseThreshold: /(Wounded|Bloodied|Doomed)\s*\((\d+)%/i,
  phaseSlain: /\bSlain\b/i,
  declareResolve: /\*\*(Declare|Resolve).*?\*\*:?/i,
  chargeRecharge: /\((\d+)\s*charges?,?\s*Recharge\s*(\d+)(?:[–\-](\d+))?\)/i,
  targets: /(?:one|two|three|four|all)\s+(?:target|creature|enemy|object)s?/i,
  passivePerception: /passive\s+Perception\s+(\d+)/i,
  speedMode:
    /(?:(walk|climb|fly|swim|burrow)\s+)?(?:\[=\s*)?(\d+)\s*(?:stride(?:;ADJ)?\s*=\]|ft\.?)/i,
  hover: /\bhover\b/i,
  armorClassHeader: /\|\s*\*\*Armor\s*Class\*\*/i,
  savingThrowBonus: /^(Str|Dex|Con|Int|Wis|Cha)\s*([+-]?\d+)/i,
  challengeRating: /(\d+\/\d+|\d+)/,
} as const;

/**
 * Pre-compiled patterns for MDX structural elements.
 *
 * @property {RegExp} numericWithParen - "18 (natural armor)"
 * @property {RegExp} blendedImageSrc - BlendedImage JSX src attribute
 * @property {RegExp} heading - "## Title"
 * @property {RegExp} keyBullet - "- **Key**: Value"
 * @property {RegExp} italicLine - "_text_"
 * @property {RegExp} weight - "2.5 lbs"
 */
export const STRUCTURE = {
  numericWithParen: /([\d,]+)\s*(?:\((.*?)\))?/,
  blendedImageSrc: /<BlendedImage\s[^>]*?src\s*=\s*['"]([^'"]+)['"]/i,
  heading: /^#{1,3}\s+\*?\*?(.+?)\*?\*?\s*$/,
  keyBullet: /^-\s*\*\*([^*]+)\*\*\s*:\s*(.+?)\s*$/gm,
  italicLine: /^_.*_$/,
  weight: /([\d.]+)\s*lbs?\.?/i,
} as const;

/**
 * Canonical set of damage type keywords.
 */
export const DAMAGE_TYPES: ReadonlySet<string> = new Set([
  'chemical',
  'bludgeoning',
  'frost',
  'fire',
  'force',
  'lightning',
  'dark',
  'piercing',
  'poison',
  'psychic',
  'holy',
  'slashing',
  'true',
]);

/**
 * Canonical set of ability score short names.
 */
export const ABILITY_SHORTS: ReadonlySet<string> = new Set([
  'str',
  'dex',
  'con',
  'int',
  'wis',
  'cha',
]);

/**
 * Long ability name to short abbreviation mapping.
 */
export const ABILITY_MAP: Readonly<Record<string, string>> = {
  strength: 'str',
  dexterity: 'dex',
  constitution: 'con',
  intelligence: 'int',
  wisdom: 'wis',
  charisma: 'cha',
};

/**
 * Canonical set of AoE shape keywords.
 */
export const SHAPES = new Set([
  'cone',
  'sphere',
  'line',
  'cube',
  'radius',
  'cylinder',
  'wall',
  'square',
]);

/**
 * Word-to-number mapping for multiattack parsing.
 */
export const WORD_NUMBERS: Readonly<Record<string, number>> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

/**
 * Ordered resource pattern entries for recognizeResource iteration.
 *
 * @property {RegExp} regex - Pre-compiled pattern
 * @property {string} type - Semantic resource type identifier
 */
export const RESOURCE_ENTRIES: ReadonlyArray<{
  regex: RegExp;
  type: string;
}> = [
  { regex: RESOURCES.charges, type: 'charges' },
  { regex: RESOURCES.spellSlot, type: 'spell_slot' },
  { regex: RESOURCES.sorceryPoints, type: 'sorcery_points' },
  { regex: RESOURCES.boonPoints, type: 'boon_points' },
  { regex: RESOURCES.uses, type: 'uses' },
  { regex: RESOURCES.hitDice, type: 'hit_dice' },
  { regex: RESOURCES.spellPoints, type: 'spell_points' },
  { regex: RESOURCES.deeds, type: 'deeds' },
];

/**
 * Recharge timing entries for recognizeRecharge iteration.
 *
 * @property {string} pattern - String to match via includes()
 * @property {string} timing - Semantic timing identifier
 */
export const RECHARGE_TIMINGS: ReadonlyArray<{
  pattern: string;
  timing: string;
}> = [
  { pattern: 'repose', timing: 'repose' },
  { pattern: 'recovery', timing: 'recovery' },
  { pattern: 'dawn', timing: 'dawn' },
  { pattern: 'sundown', timing: 'sundown' },
  { pattern: 'midnight', timing: 'midnight' },
  { pattern: 'dusk', timing: 'dusk' },
];

/**
 * Pre-compiled patterns for section splitting and sub-heading detection.
 *
 * @property {RegExp} subHeading - H4–H6 heading
 * @property {RegExp} boldLabel - Bullet with bold-label prefix
 * @property {RegExp} deedBullet - Deed option bullet with optional cost
 */
export const SECTIONS = {
  subHeading: /^#{4,6}\s+(.+?)\s*$/,
  boldLabel: /^\s*[-*]\s*\*\*([^*]+?)\.?\*\*(?!\s*:)\s*/,
  deedBullet:
    /^\s*[-*]\s*\*\*([^*]+?)\.?\*\*(?!\s*:)\s*(?:\(Costs?\s*(\d+)\s*Deeds?\))?/i,
} as const;

/**
 * Pre-compiled patterns for spellcasting block parsing.
 *
 * @property {RegExp} slotRow - Inline slot row "1st level (2 slots)"
 * @property {RegExp} slotCell - Table cell with level + slot count
 * @property {RegExp} slotTableCell - Bold/plain table cell variant
 * @property {RegExp} casterLevel - "N-level spellcaster"
 * @property {RegExp} dc - "spell save DC N"
 * @property {RegExp} attackBonus - "+N to hit with spell"
 * @property {RegExp} ability - "spellcasting ability is X"
 */
export const SPELLCASTING = {
  slotRow: /(\d+)(?:st|nd|rd|th)\s*(?:level)?\s*\((\d+)\s*slots?\)/i,
  slotCell: /(\d+)(?:st|nd|rd|th)\s+level\s+\((\d+)\s+slots?\)/i,
  slotTableCell:
    /\*?\*?(\d+)(?:st|nd|rd|th)\s+level\s*\((\d+)\s+slots?\)\*?\*?/i,
  casterLevel: /(\d+)(?:st|nd|rd|th)?[- ]level\s+spellcaster/i,
  dc: /spell\s+save\s+DC\s*(\d+)/i,
  attackBonus: /\+(\d+)\s+to\s+hit\s+with\s+spell/i,
  ability: /spellcasting\s+ability\s+is\s+(\w+)/i,
} as const;

/**
 * Pre-compiled patterns for enrichFromBody inline detection.
 *
 * @property {RegExp} extraDamage - "plus N (XdY) type damage" (bold-tolerant)
 * @property {RegExp} saveDamage - "takes/taking N (XdY) type damage" or "takes N type damage" (flat)
 * @property {RegExp} rechargeSuffix - "(Recharge N–M)"
 * @property {RegExp} dailyUse - "(N/Repose)" or "(N/Recovery)"
 * @property {RegExp} perDay - "(N/day)"
 * @property {RegExp} escalation - "each subsequent/consecutive/additional"
 * @property {RegExp} reactionTrigger - "uses her/his/its/their reaction"
 * @property {RegExp} critRange - "critically hits on a roll of N–"
 */
export const ENRICHMENT = {
  extraDamage: /plus\s+\*{0,2}\d+\s*\((.+?)\)\*{0,2}\s*(\w+)\s*damage/i,
  saveDamage:
    /tak(?:es?|ing)\s+\*{0,2}(\d+)\s*(?:\(([^)]+)\)\s*\*{0,2}\s*)?(\w+)\s+damage/i,
  rechargeSuffix: /\(Recharge\s+(\d+)(?:[–\-](\d+))?\)/i,
  dailyUse: /\((\d+)\/(Repose|Recovery)\)/i,
  perDay: /\((\d+)\/day\)/i,
  escalation: /each\s+(?:subsequent|consecutive|additional)/i,
  reactionTrigger: /\buses?\s+(?:her|his|its|their)\s+reaction\b/i,
  critRange:
    /\bcritical(?:ly)?\s+(?:hit|strike)s?\s+on\s+(?:a\s+)?(?:roll\s+of\s+)?(\d+)[-–,]/i,
} as const;

/**
 * Section classifier patterns for monster stat block headings.
 *
 * @property {RegExp} deedAct - Legendary Deed: Act heading
 * @property {RegExp} deedStratagem - Legendary Deed: Stratagem heading
 * @property {RegExp} deedLair - Legendary Deed: Lair heading
 * @property {RegExp} deedPhase - Legendary Deed: Phase heading
 * @property {RegExp} spellcasting - Spellcasting heading
 * @property {RegExp} condition - Condition heading
 * @property {RegExp} bloodrage - Bloodrage heading
 * @property {RegExp} minorActions - Minor / Bonus Actions heading
 * @property {RegExp} reactions - Reactions heading
 * @property {RegExp} actions - Actions / Major Actions heading
 * @property {RegExp} traits - Traits heading
 * @property {RegExp} heading - Any heading with level and text capture
 */
export const CLASSIFIER = {
  deedAct: /^legendary\s+deed:\s*act/i,
  deedStratagem: /^legendary\s+deed:\s*stratagem/i,
  deedLair: /^legendary\s+deed:\s*lair/i,
  deedPhase: /^legendary\s+deed:\s*phase/i,
  spellcasting: /^spellcasting/i,
  condition: /^condition:\s*/i,
  bloodrage: /^bloodrage/i,
  minorActions: /^(?:bonus|minor)\s*actions?$/i,
  reactions: /^reactions?$/i,
  actions: /^(?:major\s+)?actions?$/i,
  traits: /^traits?$/i,
  heading: /^(#{1,6})\s+(.+?)\s*$/,
} as const;

/**
 * Meta tag parsing patterns for MDX {@literal <Meta>} JSX directives.
 *
 * @property {RegExp} tag - Self-closing Meta tag: {@literal <Meta ... />}
 * @property {RegExp} attribute - JSX attribute: key="value"
 */
export const META_TAG = {
  tag: /<Meta\s+([\s\S]*?)\/>/g,
  attribute: /(\w+)=["']([^"']*)["']/g,
} as const;
