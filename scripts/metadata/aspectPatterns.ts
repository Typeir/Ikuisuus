/**
 * @fileoverview Aspect Detection Patterns
 * @description Pre-compiled regex patterns for aspect groups, keyed by facet
 * and grouped so a pattern sits adjacent to the aspect it produces. Excludes
 * judgement-valued facets (`source:`, `myth:`, `theme:`) which no regex can
 * reliably guess.
 *
 * @module lib/metadata/aspectPatterns
 * @version 1.0.0
 * @author Typeir
 * @since 3.1.0
 */

/**
 * Scoped defence patterns. Each captures the clause following the keyword.
 *
 * @property {RegExp} resistance - "resistance to …"
 * @property {RegExp} immunity - "immune to …", "immunity to …"
 * @property {RegExp} vulnerability - "vulnerable to …", "vulnerability to …"
 */
export const SCOPED_DEFENCE = {
  resistance: /\bresistances?\s+to\s+([^.;]{1,160})/gi,
  immunity: /\bimmun(?:e|ity|ities)\s+to\s+([^.;]{1,160})/gi,
  vulnerability: /\bvulnerab(?:le|ility|ilities)\s+to\s+([^.;]{1,160})/gi,
} as const;

/**
 * Flat damage-reduction patterns. Reduction subtracts a fixed amount, distinct
 * from resistance which halves incoming damage.
 *
 * @property {RegExp} reduction - Damage reduced by a fixed amount
 */
export const DAMAGE_REDUCTION = {
  reduction:
    /\bdamage reduction\b|\breduce[sd]?\s+(?:the\s+)?damage\b|\bdamage\s+(?:taken\s+)?is reduced by\b|\btakes?\s+\d+\s+less\s+damage\b|\breduce[sd]?\s+by\s+\d+\s+.{0,20}damage\b|\bdamage (?:it takes|dealt|taken) is halved\b|\bhalv(?:e|es|ed|ing) (?:the |all )?damage\b/i,
} as const;

/**
 * Retaliation patterns for damage dealt back to an attacker.
 *
 * @property {RegExp} retaliation - Damage returned to the creature that attacked
 */
export const RETALIATION = {
  retaliation:
    /\bin retaliation\b|\bretaliat\w+\b|\bthe attacker takes\b|\bdeals?\s+\d*d?\d*\s*\w*\s*damage to the (?:attacker|creature that|triggering)\b|\b(?:attacker|creature that hit you)\s+(?:takes|suffers)\b|\bwhen (?:a creature |you are )?hit\b.{0,60}\b(?:takes|suffers|deal)\b.{0,20}\bdamage\b/i,
} as const;

/**
 * Roll-modifier patterns applying to all content types, not just items.
 *
 * @property {RegExp} advantage - Advantage, excluding the "disadvantage" substring
 * @property {RegExp} disadvantage - Disadvantage
 * @property {RegExp} critical - Critical hits
 * @property {RegExp} reroll - Rerolls
 */
export const ROLL = {
  advantage: /\badvantage\b/i,
  disadvantage: /\bdisadvantage\b/i,
  critical: /\bcritical(?:\s+hits?)?\b/i,
  reroll: /\brerolls?\b/i,
} as const;

/**
 * Perception patterns covering both special senses and the lighting conditions
 * that defeat them.
 *
 * @property {RegExp} brightLight - Bright light
 * @property {RegExp} dimLight - Dim light
 * @property {RegExp} magicalDarkness - Magical darkness
 * @property {RegExp} darkness - Darkness, excluding the magical variant
 * @property {RegExp} lightlyObscured - Lightly obscured
 * @property {RegExp} heavilyObscured - Heavily obscured
 * @property {RegExp} concealed - Concealment keywords
 */
export const SENSE = {
  brightLight: /\bbright light\b/i,
  dimLight: /\bdim light\b/i,
  magicalDarkness: /\bmagical darkness\b/i,
  darkness: /(?<!magical\s)\bdarkness\b/i,
  lightlyObscured: /\blightly obscured\b/i,
  heavilyObscured: /\bheavily obscured\b/i,
  concealed: /\bconcealed\b|\bconcealment\b/i,
} as const;

/**
 * Health-state ladder patterns. These are states a creature passes through, not
 * conditions applied to it.
 *
 * @property {RegExp} wounded - Wounded
 * @property {RegExp} bloodied - Bloodied
 * @property {RegExp} doomed - Doomed
 * @property {RegExp} slain - Slain
 */
export const PHASE = {
  wounded: /\bwounded\b/i,
  bloodied: /\bbloodied\b/i,
  doomed: /\bdoomed\b/i,
  slain: /\bslain\b/i,
} as const;

/**
 * Tactical position patterns from the contextual-conflict rules.
 *
 * @property {RegExp} charging - Charging
 * @property {RegExp} flanking - Flanking
 * @property {RegExp} highGround - High ground
 * @property {RegExp} mounted - Mounted or mount
 * @property {RegExp} underwater - Underwater
 */
export const POSITION = {
  charging: /\bcharging\b|\bcharge\s+attack\b/i,
  flanking: /\bflank(?:ing|ed)?\b/i,
  highGround: /\bhigh ground\b/i,
  mounted: /(?<![-\w])mounted\b|\bon a mount\b|\bmounted combat\b/i,
  underwater: /\bunderwater\b/i,
} as const;

/**
 * Cover patterns. Tier values say how much, directional values say whether the
 * feature hands cover out or reads through it.
 *
 * @property {RegExp} half - Half cover
 * @property {RegExp} threeQuarters - Three-quarters cover
 * @property {RegExp} total - Total cover
 * @property {RegExp} grants - Grants or provides cover
 * @property {RegExp} ignores - Ignores or negates cover
 */
export const COVER = {
  half: /\bhalf cover\b/i,
  threeQuarters: /\bthree[- ]quarters cover\b/i,
  total: /\btotal cover\b/i,
  grants: /\b(?:grants?|provides?|gains?)\s+(?:\w+\s+){0,2}cover\b/i,
  ignores: /\b(?:ignor\w+|negat\w+|treats?\s+as\s+if\s+\w+\s+had\s+no)\s+(?:\w+\s+){0,2}cover\b/i,
} as const;

/**
 * Delivery patterns describing how an effect reaches its target.
 *
 * @property {RegExp} cone - Cone area
 * @property {RegExp} line - Line area
 * @property {RegExp} sphere - Sphere or radius area
 * @property {RegExp} zone - Persistent zone wording
 * @property {RegExp} attack - Spell attack roll
 * @property {RegExp} touch - Touch delivery
 * @property {RegExp} projectile - Ray, bolt, missile or similar
 * @property {RegExp} summon - Summoned creature or object
 * @property {RegExp} self - Self-targeted
 */
export const DELIVERY = {
  cone: /\bcone\b/i,
  line: /\bline\s+\d+\s*(?:ft|feet)\b|\b\d+\s*(?:ft|feet)[- ]long line\b|\bin a line\b/i,
  sphere: /\bsphere\b|\bradius\b/i,
  zone: /\bthe area (?:is|becomes)\b|\bfor the duration,? the\b|\bzone\b|\b(?:enters?|starts? its turn in) the (?:area|sphere|cloud|fog|wall)\b/i,
  attack: /\b(?:ranged|melee)\s+spell attack\b|\bmake a spell attack\b|\bspell attack roll\b|\bwhen you hit\b.{0,50}\battack\b|\byour (?:melee |ranged )?attacks\b/i,
  touch: /\byou touch\b|\brange[:*_\s]+touch\b/i,
  projectile: /\bray\b|\bbolt\b|\bmissile\b|\bdart(?:s)? of\b|\bhurls?\b/i,
  summon: /\bsummons?\b|\bconjures?\b|\bappears? in an unoccupied space\b/i,
  self: /\brange[:*_\s]+self\b/i,
} as const;

/**
 * Tempo patterns describing when an effect happens and how long it lasts.
 *
 * @property {RegExp} instant - Instantaneous duration
 * @property {RegExp} persistent - Permanent or until-dispelled duration
 * @property {RegExp} major - A Major Action
 * @property {RegExp} minor - A Minor Action
 * @property {RegExp} reactive - A Reaction
 * @property {RegExp} free - Costs no action
 */
export const TEMPO = {
  instant: /\binstantaneous\b/i,
  persistent: /\buntil dispelled\b|\bpermanent(?:ly)?\b/i,
  major: /\bmajor action\b/i,
  minor: /\bminor action\b/i,
  reactive: /\breactions?\b/i,
  free: /\bno action\b|\bfree action\b|\bwithout (?:using|expending) an action\b/i,
} as const;

/**
 * Range patterns read from the stat-block Range field.
 *
 * @property {RegExp} field - The Range field and its whole value
 * @property {RegExp} self - Range: Self
 * @property {RegExp} touch - Range: Touch
 * @property {RegExp} sight - Range: Sight
 * @property {RegExp} unlimited - Range: Unlimited
 * @property {RegExp} melee - Range: Melee
 * @property {RegExp} strides - A distance written in strides
 * @property {RegExp} feet - A distance written in feet
 * @property {RegExp} reach - Weapon reach
 */
export const RANGE = {
  field: /(?:^|\n)[>\s]*\*{0,2}Range\*{0,2}\s*:\s*(.+?)\s*(?=\r?\n|$)/i,
  self: /^Self\b/i,
  touch: /^Touch\b/i,
  sight: /^Sight\b/i,
  unlimited: /^Unlimited\b/i,
  melee: /^Melee\b/i,
  strides: /\[=\s*(\d+)\s*stride/i,
  feet: /(\d+)\s*(?:ft\.?|feet)\b/i,
  reach: /\breach of your weapon\b|\bmelee reach\b|\breach increases\b/i,
} as const;

/**
 * Feet per stride, the unit the rules are written in.
 */
export const FEET_PER_STRIDE = 5;

/**
 * Upper bound in feet for each named range band, in ascending order.
 */
export const RANGE_BANDS: ReadonlyArray<{ band: string; maxFeet: number }> = [
  { band: 'close', maxFeet: 30 },
  { band: 'medium', maxFeet: 60 },
  { band: 'long', maxFeet: Number.POSITIVE_INFINITY },
];

/**
 * Scaling patterns describing what makes an effect stronger.
 *
 * @property {RegExp} slot - Upcasting with a higher spell slot
 * @property {RegExp} level - Character or vocation level thresholds
 * @property {RegExp} tier - Tier bonus
 * @property {RegExp} ability - Spellcasting ability modifier
 * @property {RegExp} stacks - Stacking or cumulative effects
 */
export const SCALING = {
  slot: /\bspell slot of \d(?:st|nd|rd|th) level or higher\b|\bat higher levels\b|\bupcast\b/i,
  level: /\bwhen you reach \d+(?:st|nd|rd|th) level\b|\b\d+(?:st|nd|rd|th) level(?:\s+or higher)?\b.{0,24}\byou (?:gain|can|may)\b/i,
  tier: /\btier bonus\b/i,
  ability: /\byour spellcasting ability modifier\b|\byour \w+ modifier\b/i,
  stacks: /\bstacks?\b|\bcumulative\b|\bthis effect stacks\b/i,
} as const;

/**
 * Resource patterns for the costs and pools an effect spends or grants.
 *
 * @property {RegExp} tempHp - Temporary hit points
 * @property {RegExp} slot - Spell slots
 * @property {RegExp} hitDie - Hit dice
 * @property {RegExp} perTurn - Once-per-turn limits
 */
export const RESOURCE = {
  tempHp: /\btemporary hit points?\b|\btemp(?:orary)? hp\b/i,
  slot: /\bspell slots?\b/i,
  hitDie: /\bhit di(?:c?e|e)\b/i,
  perTurn: /\bonce per turn\b|\bper turn\b/i,
} as const;

/**
 * Movement patterns for the modes the base tagger does not already cover.
 *
 * @property {RegExp} hover - Hovering
 * @property {RegExp} ethereal - Ethereal plane travel
 * @property {RegExp} dimensional - Planar or dimensional travel
 * @property {RegExp} difficultTerrain - Difficult terrain
 * @property {RegExp} jump - Jump distance
 * @property {RegExp} squeeze - Squeezing through tight spaces
 * @property {RegExp} crawl - Crawling
 * @property {RegExp} fall - Falling and fall damage
 */
export const MOVEMENT_EXTRA = {
  hover: /\bhover(?:s|ing)?\b/i,
  ethereal: /\bethereal\b/i,
  dimensional: /\bdimension(?:al)?\b|\bplanar\b|\banother plane\b|\bteleports?\b|\bteleportation\b/i,
  difficultTerrain: /\bdifficult terrain\b/i,
  jump: /\bjump(?:s|ing)?\b|\blong jump\b|\bhigh jump\b/i,
  squeeze: /\bsqueez(?:e|es|ing)\b/i,
  crawl: /\bcrawl(?:s|ing)?\b/i,
  fall: /\bfall damage\b|\bfeather fall\b|\bfalling speed\b|\bfalls?\s+(?:\[=|\d)/i,
} as const;

/**
 * The word that licenses a damage type. A type word alone is ambiguous, so it
 * counts only where the text is talking about damage.
 */
export const DAMAGE_WORD = /\bdamage\b/gi;

/**
 * A dice expression, the other place a damage type is stated, which never
 * contains the word "damage".
 */
export const DICE_EXPRESSION = /\[%[^%]*%\]/g;

/**
 * How far before "damage" still counts as the same clause.
 */
export const CLAUSE_BEFORE = 60;

/** How far past "damage" still counts as the same clause. */
export const CLAUSE_AFTER = 24;

/**
 * Punctuation that ends a clause. A colon does not end a clause because a stat
 * block writes `**Damage**: 1d4 poison`, where the colon introduces the type.
 */
export const CLAUSE_BREAK = /[.;!?\n]/;

/**
 * A markdown link that cites another content entity. Excludes links under a
 * rules path, which cite the mechanic rather than name an entity.
 */
export const ENTITY_CITATION =
  /\[([^\]]*)\]\((?:[^)]*\/)?(?:spells|monsters|heirlooms|trinkets|feats|bloodlines|vocations|specializations)\/[^)]*\)/gi;
