/**
 * @fileoverview Tagging Utility Patterns
 * @description Pre-compiled regex patterns used by the tagging utility functions.
 * Centralizes movement detection, monster mechanic matching, and item mechanic
 * matching into grouped dictionaries.
 *
 * @module lib/metadata/taggingPatterns
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

/**
 * Frontmatter field patterns.
 *
 * @property {RegExp} source - The declared `source` field, anchored to the frontmatter block
 */
export const FRONTMATTER = {
  source: /^source:\s*(.+?)\s*$/m,
} as const;

/**
 * Movement type detection patterns keyed by movement category.
 *
 * @property {RegExp} flight - Fly, flying, or flight
 * @property {RegExp} burrowing - Burrow keyword
 * @property {RegExp} swimming - Swim keyword
 * @property {RegExp} climbing - Climb keyword
 * @property {RegExp} teleportation - Teleport keyword
 * @property {RegExp} enhanced - "movement speed" phrase
 * @property {RegExp} distanceFeet - Feet measurement for flight validation
 */
export const MOVEMENT: Record<string, RegExp> = {
  flight: /\b(fly|flying|flight)\b/i,
  burrowing: /\bburrow/i,
  swimming: /\bswim/i,
  climbing: /\bclimb/i,
  teleportation: /\bteleport/i,
  enhanced: /\bmovement\s+speed/i,
  distanceFeet: /\d+\s*ft/i,
};

/**
 * Monster mechanic detection patterns. Each key maps to a tag suffix.
 *
 * @property {RegExp} legendaryDeed - Any mention of legendary deeds, including the bare section heading
 * @property {RegExp} deedResist - Legendary Deed: Resist
 * @property {RegExp} deedLair - Legendary Deed: Lair
 * @property {RegExp} deedStratagem - Legendary Deed: Stratagem
 * @property {RegExp} deedPhase - Legendary Deed: Phase
 * @property {RegExp} multiattack - Multiattack keyword
 * @property {RegExp} reactions - Reaction(s) keyword
 * @property {RegExp} minorActions - Minor Action(s) keyword
 * @property {RegExp} regeneration - Regeneration keyword
 * @property {RegExp} healing - Regains/recovers hit points
 * @property {RegExp} spellcasting - Spellcasting, cantrips, spell slots
 * @property {RegExp} innateSpellcasting - Innate spellcasting
 * @property {RegExp} magicResistance - Magic resistance
 * @property {RegExp} magicWeapons - Magic weapon(s)
 * @property {RegExp} packTactics - Pack tactics
 * @property {RegExp} sneakAttack - Sneak attack
 * @property {RegExp} aura - Aura keyword
 * @property {RegExp} summoning - Summon or summoning
 * @property {RegExp} shapeshifting - Shapechange or polymorph
 * @property {RegExp} damageResistance - Resistant or resistance
 * @property {RegExp} damageImmunity - Immune or immunity
 * @property {RegExp} damageVulnerability - Vulnerable or vulnerability
 */
export const MONSTER_MECHANICS = {
  legendaryDeed: /\blegendary deeds?\b/i,
  deedResist: /\bLegendary Deed: resist?\b/i,
  deedLair: /\bLegendary Deed: lair?\b/i,
  deedStratagem: /\bLegendary Deed: Stratagem?\b/i,
  deedPhase: /\bLegendary Deed: Phase?\b/i,
  multiattack: /\bmultiattack\b/i,
  reactions: /\breactions?\b/i,
  minorActions: /\bminor actions?\b/i,
  regeneration: /\bregenerat(e|ion)\b/i,
  healing: /\b(regains?|recover)\s+\d+\s+(hit points?|hp)\b/i,
  spellcasting: /\b(spellcasting|cantrips?|spell slots?)\b/i,
  innateSpellcasting: /\b(innate spellcasting)\b/i,
  magicResistance: /\b(magic resistance)\b/i,
  magicWeapons: /\b(magic weapons?)\b/i,
  packTactics: /\b(pack tactics)\b/i,
  sneakAttack: /\b(sneak attack)\b/i,
  aura: /\b(aura)\b/i,
  summoning: /\b(summon|summoning)\b/i,
  shapeshifting: /\b(shapechange|polymorph)\b/i,
  damageResistance: /\b(resistant|resistance)\b/i,
  damageImmunity: /\b(immune|immunity)\b/i,
  damageVulnerability: /\b(vulnerable|vulnerability)\b/i,
} as const;

/**
 * Item mechanic detection patterns. Each key maps to a tag suffix.
 *
 * @property {RegExp} accuracyBonus - "+N to attack/hit", or an accuracy bonus in canonical wording
 * @property {RegExp} damageBonus - "+N to damage/AC", or a damage bonus in canonical wording
 * @property {RegExp} acBonus - "+N to AC"
 * @property {RegExp} savingThrowBonus - "+N to saving throws"
 * @property {RegExp} advantage - Advantage, excluding the "disadvantage" substring
 * @property {RegExp} disadvantage - Disadvantage
 * @property {RegExp} criticalHit - Critical hit
 * @property {RegExp} reaction - Reaction keyword
 * @property {RegExp} minorAction - Minor Action
 * @property {RegExp} opportunityAttack - Opportunity attack
 * @property {RegExp} noOpportunityAttack - "does not provoke opportunity attacks"
 * @property {RegExp} damageResistanceTo - "resistance to"
 * @property {RegExp} damageImmunityTo - "immune/immunity to"
 * @property {RegExp} damageVulnerabilityTo - "vulnerable/vulnerability to"
 * @property {RegExp} spellcasting - Casts a named spell, or the spellcasting and spell-slot keywords
 * @property {RegExp} cantrips - Cantrip keyword
 * @property {RegExp} charges - Charge(s) keyword
 * @property {RegExp} limitedUses - "N/Repose" or "N/Recovery"
 * @property {RegExp} recharge - "recharge N"
 * @property {RegExp} reroll - Reroll keyword
 * @property {RegExp} consumable - Consumable keyword
 * @property {RegExp} consumableDestroyed - "burns away", "destroyed", "inert"
 * @property {RegExp} attunement - Attunement keyword
 * @property {RegExp} proficiency - Proficiency keyword
 */
export const ITEM_MECHANICS = {
  accuracyBonus:
    /\+\d+\s+(?:to\s+)?(?:attack|hit)|\baccuracy(?:\s+and\s+damage)?\s+bonus\b/i,
  damageBonus: /\+\d+\s+(?:to\s+)?(?:damage|AC)|\bdamage\s+bonus\b/i,
  acBonus: /\+\d+\s+(?:to\s+|bonus\s+to\s+)?AC/i,
  savingThrowBonus: /\+\d+\s+(?:to\s+|bonus\s+to\s+)?saving throws?/i,
  advantage: /\badvantage\b/i,
  disadvantage: /\bdisadvantage\b/i,
  criticalHit: /\bcritical(?:\s+hit)?/i,
  reaction: /\breaction\b/i,
  minorAction: /\bminor action\b/i,
  opportunityAttack: /\bopportunity attack/i,
  noOpportunityAttack: /does\s+not\s+provoke\s+opportunity\s+attacks?/i,
  damageResistanceTo: /\bresistance\s+to/i,
  damageImmunityTo: /\bimmun(?:e|ity)\s+to/i,
  damageVulnerabilityTo: /\bvulnerab(?:le|ility)\s+to/i,
  spellcasting: /\bcasts?\s+\[?_?[A-Z][a-z]+|\bspellcasting\b|\bspell slots?\b/i,
  cantrips: /\bcantrips?\b/i,
  charges: /\bcharges?\b/i,
  limitedUses: /\b\d+\/(?:Repose|Recovery)/i,
  recharge: /\brecharge\s+\d+/i,
  reroll: /\breroll/i,
  consumable: /\bconsumable\b/i,
  consumableDestroyed: /burns? away|destroyed|inert/i,
  attunement: /\battunement\b/i,
  tier: /\bproficiency\b/i,
} as const;
