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
 * Ability names as a sheet writes them, long form or short.
 */
const ABILITY =
  '(strength|dexterity|constitution|intelligence|wisdom|charisma|str|dex|con|int|wis|cha)';

/**
 * Pre-compiled patterns for Difficulty Class and saving throw expressions.
 *
 * @property {RegExp} dcFormula - "DC 10 + Prof + CHA mod", or the legacy "DC = ..."
 * @property {RegExp} dcFlat - "DC 16"
 * @property {RegExp} savingThrow - a save the block imposes, in either grammar
 * @property {RegExp} notImposed - lead-in words that make a save a mention
 * @property {RegExp} savingThrowWithDC - "DC 16 Wisdom saving throw"
 * @property {RegExp} autoFail - "automatically fails saving throws"
 */
export const SAVES = {
  dcFormula: /DC\s*(?:=\s*|(?=\d+\s*\+))(.+?)(?:\)|,|$)/i,
  dcFlat: /DC\s+(\d+)/i,
  /* A block imposes a save two ways: `the target saves Wisdom`, which is how
     the corpus writes it, and `a Strength save against DC 18`. The ability is
     held to a word boundary on the left, since `that point saves Dexterity`
     otherwise reads the tail of `point` as `int`. */
  savingThrow: new RegExp(
    `saves?\\s+\\*{0,2}${ABILITY}\\b` +
      `|\\b\\*{0,2}${ABILITY}\\*{0,2}\\s+sav(?:ing\\s+throws?|es?)\\b`,
    'i',
  ),
  /* Naming an ability beside the word `save` is not enough on its own: a block
     granting advantage on Constitution saving throws, or immunity to them,
     names both and imposes nothing. The word can stand a little back from the
     save it qualifies — `advantage on Strength checks and Strength saving
     throws` — but never across a sentence end, so a block that grants a bonus
     and then imposes a save still reports the save. */
  notImposed:
    /(?:advantage|disadvantage|immune|immunity|resistance|resistant|proficient|proficiency|bonus|succeeds?|allows?|allowing|automatically\s+fails?|rerolls?|re-rolls?)\b[^.!?]{0,60}$/i,
  savingThrowWithDC: /DC\s+(\d+)\s+(\w+)\s+saving throw/i,
  autoFail: /automatically\s+(fails?|succeeds?)\s+(?:all\s+)?saving\s+throws?/i,
} as const;

/**
 * Regex source matching a distance in the `[= N stride =]` macro form or
 * the legacy imperial spellings.
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
 * @property {RegExp} attackLine - the legacy "_Melee Weapon Attack:_ +7 to hit"
 * @property {RegExp} accuracySlot - a block's own `accuracy="+12"`
 * @property {RegExp} reachSlot - a block's own `reach="[= 1 stride =]"`
 * @property {RegExp} rangeSlot - a block's own `range="[= 24 stride =]/[= 60 stride =]"`
 * @property {RegExp} spellAttack - "ranged spell attack", naming the kind
 * @property {RegExp} hitLine - the hit and its damage, in either grammar
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
  /* An attack states its numbers on its own block — `<Attack accuracy="+12"
     reach="[= 1 stride =]">` — so the block's attributes are what there is to
     read; whether it reaches or ranges is what says melee from ranged. */
  accuracySlot: /\baccuracy\s*=\s*"\+?(\d+)"/i,
  reachSlot: /\breach\s*=\s*"\[=\s*(\d+)\s*stride[^"]*"/i,
  rangeSlot:
    /\brange\s*=\s*"\[=\s*(\d+)\s*stride[^\]]*\](?:\s*\/\s*\[=\s*(\d+)\s*stride[^\]]*\])?/i,
  spellAttack: /\b(?:melee|ranged)\s+spell\s+attack\b/i,
  /* The hit is written `On a hit, 21 ([% 3d6 +10 slashing %])` or, where the
     average is left to the roller, `**Hit**: [% 4d12 +8 force %]`. The average
     is optional in both, and the dice sit inside the roll macro. */
  hitLine:
    /(?:_?Hit:?_?|\*\*Hit\*\*:|On a hit,)\s*\*{0,2}(?:(\d+)\s*)?\(?\s*(?:\[%\s*)?(\d+d\d+(?:\s*[+-]\s*\d+)?)\s*([a-z]+)?[^%)]*(?:%\]|\))?\s*\*{0,2}\s*([a-z]+)?/i,
  multiattack: /multiattack/i,
  attackSegment:
    /(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+((?:\w+\s+)*\w+)\s+attacks?/i,
  condition: /(?:while|when|if)\s+(.+?)(?:\.|,|$)/i,
  deedCost: /\(Costs?\s+(\d+)\s+Deeds?\)/i,
  /* A block states its deed cost on its own slot; the parenthetical is
     how a sheet wrote it before the slot existed. */
  deedCostSlot: /\bcost="(\d+)\s*Deeds?"/i,
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
 * @property {RegExp} keyBullet - "- **Key**
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
 * @property {RegExp} openTag - A slot component's opening tag on its own line
 */
export const SECTIONS = {
  subHeading: /^#{4,6}\s+(.+?)\s*$/,
  boldLabel: /^\s*[-*]\s*\*\*([^*]+?)\.?\*\*(?!\s*:)\s*/,
  deedBullet:
    /^\s*[-*]\s*\*\*([^*]+?)\.?\*\*(?!\s*:)\s*(?:\(Costs?\s*(\d+)\s*Deeds?\))?/i,
  openTag: /^<[A-Z][A-Za-z]*(?:\s[^>]*)?>$/,
} as const;

/**
 * Pre-compiled patterns for spellcasting block parsing.
 *
 * @property {RegExp} slotRow - Inline slot row "1st level (2 slots)"
 * @property {RegExp} slotCell - Table cell with level + slot count
 * @property {RegExp} slotTableCell - Bold/plain table cell variant
 * @property {RegExp} dc - the block's `saveDc` slot, or a DC stated in prose
 * @property {RegExp} attackBonus - the block's `accuracy` slot, or one stated in prose
 * @property {RegExp} ability - "casting ability is X"
 */
export const SPELLCASTING = {
  /* A sheet writes its slots either at length — `1st level (4 slots)` — or as
     the run `1st (4), 2nd (3), 3rd (3)`, so both the word `level` and the word
     `slots` are optional. */
  slotRow: /(\d+)(?:st|nd|rd|th)\s*(?:level)?\s*\((\d+)(?:\s*slots?)?\)/i,
  slotCell: /(\d+)(?:st|nd|rd|th)\s*(?:level)?\s*\((\d+)(?:\s*slots?)?\)/i,
  slotTableCell:
    /\*?\*?(\d+)(?:st|nd|rd|th)\s*(?:level)?\s*\((\d+)(?:\s*slots?)?\)\*?\*?/i,
  /* A sheet declares both on the block as slots, and states them in prose only
     where the number differs from the sheet's own. Both spellings are read, and
     emphasis is tolerated around either. */
  dc: /saveDc="(\d+)"|\bsave\s+DC\s*\*{0,2}(\d+)/i,
  attackBonus: /accuracy="\+?(\d+)"|\baccuracy\s*\*{0,2}\+(\d+)/i,
  ability: /casting\s+ability\s+is\s+\*{0,2}(\w+)|\*{0,2}(\w+)\*{0,2}\s+is\s+its\s+casting\s+ability/i,
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
 * @property {RegExp} deedAct - Legendary Deed
 * @property {RegExp} deedStratagem - Legendary Deed
 * @property {RegExp} deedLair - Legendary Deed
 * @property {RegExp} deedPhase - Legendary Deed
 * @property {RegExp} spellcasting - Spellcasting heading
 * @property {RegExp} condition - Condition heading
 * @property {RegExp} bloodrage - Bloodrage heading
 * @property {RegExp} minorActions - Minor / Bonus Actions heading
 * @property {RegExp} reactions - Reactions heading
 * @property {RegExp} actions - Actions / Major Actions heading
 * @property {RegExp} attacks - Attacks heading
 * @property {RegExp} features - Features heading
 * @property {RegExp} traits - Traits heading
 * @property {RegExp} heading - Any heading with level and text capture
 */
export const CLASSIFIER = {
  deedAct: /^legendary\s+deed:\s*act/i,
  deedStratagem: /^legendary\s+deed:\s*stratagem/i,
  deedLair: /^legendary\s+deed:\s*lair/i,
  deedPhase: /^legendary\s+deed:\s*phase/i,
  /* One section now holds every deed, each block naming its own kind. */
  deeds: /^deeds?$/i,
  spellcasting: /^spellcasting/i,
  condition: /^condition:\s*/i,
  bloodrage: /^bloodrage/i,
  minorActions: /^(?:bonus|minor)\s*actions?$/i,
  reactions: /^reactions?$/i,
  actions: /^(?:major\s+)?actions?$/i,
  /* Each attack is a feature of its own, and so is each alteration and rider
     filed beneath it. */
  attacks: /^attacks?$/i,
  /* The section holding the Actions and Attacks of a v2 sheet. Blocks written
     directly beneath it are features in their own right. */
  features: /^features?$/i,
  traits: /^traits?$/i,
  heading: /^(#{1,6})\s+(.+?)\s*$/,
} as const;

/**
 * Meta tag parsing patterns for MDX {@literal <Meta>} JSX directives.
 *
 * @property {RegExp} tag - Self-closing Meta tag
 * @property {RegExp} attribute - JSX attribute
 */
export const META_TAG = {
  tag: /<Meta\s+([\s\S]*?)\/>/g,
  attribute: /(\w+)=["']([^"']*)["']/g,
} as const;
