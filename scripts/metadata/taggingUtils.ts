/**
 * @fileoverview Tag extraction utilities: mechanics, organizational, lore, and content tags.
 * @module lib/metadata/taggingUtils
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

/* paw:gate:file-length ignore */

import { extractDerivedAspects, extractStrataTags } from './aspectExtractors';
import {
  CLAUSE_AFTER,
  CLAUSE_BEFORE,
  CLAUSE_BREAK,
  DAMAGE_WORD,
  DICE_EXPRESSION,
  ENTITY_CITATION,
} from './aspectPatterns';
import { GameData } from './gameData';
import { SLUG } from './parsingPatterns';
import type { SharedData } from './sharedData';
import {
  FRONTMATTER,
  ITEM_MECHANICS,
  MONSTER_MECHANICS,
  MOVEMENT,
} from './taggingPatterns';

/**
 * Options for tag extraction.
 *
 * @property {string} [contentType] - Type of content ('monster', 'item', 'generic')
 * @property {string[]} [factions] - Custom faction list
 * @property {string[]} [locations] - Custom location list
 * @property {boolean} [requireFlightMeasurement] - Require feet measurement for flight tag
 */
export interface TagExtractionOptions {
  contentType?: 'monster' | 'item' | 'generic';
  factions?: string[];
  locations?: string[];
  requireFlightMeasurement?: boolean;
}

/**
 * Removes the labels of links that cite another content entity. Rules links keep their labels.
 *
 * @param {string} text - Content to clean
 * @returns {string} The text with entity link labels removed
 */
export function stripCitations(text: string): string {
  const citations = new RegExp(ENTITY_CITATION.source, ENTITY_CITATION.flags);
  return text.replace(citations, ' ');
}

/**
 * Collects text regions where a damage type may appear: clauses containing "damage" and dice expressions.
 *
 * @param {string} text - Content to analyze
 * @returns {string} The damage-bearing regions of the text, joined with ' | '
 */
export function damageContexts(text: string): string {
  const regions: string[] = [];

  const words = new RegExp(DAMAGE_WORD.source, DAMAGE_WORD.flags);
  let match: RegExpExecArray | null;
  while ((match = words.exec(text)) !== null) {
    const head = text.slice(Math.max(0, match.index - CLAUSE_BEFORE), match.index);
    const tail = text.slice(
      match.index,
      match.index + match[0].length + CLAUSE_AFTER,
    );

    const headBreak = head.split(CLAUSE_BREAK);
    const tailBreak = tail.split(CLAUSE_BREAK);
    regions.push(headBreak[headBreak.length - 1] + tailBreak[0]);
  }

  const dice = new RegExp(DICE_EXPRESSION.source, DICE_EXPRESSION.flags);
  regions.push(...(text.match(dice) ?? []));

  return regions.join(' | ');
}

/**
 * Extract damage type tags from content.
 *
 * @param {string} text - Content to analyze
 * @param {SharedData} sharedData - Shared game data
 * @returns {string[]} Array of damage tags
 */
export function extractDamageTags(
  text: string,
  sharedData: SharedData,
): string[] {
  const context = damageContexts(text);
  if (!context) return [];

  return GameData.getDamageTypes(sharedData)
    .filter((type) => new RegExp(`\\b${type}\\b`, 'i').test(context))
    .map((type) => `damage:${type}`);
}

/**
 * Extract condition tags from content.
 *
 * @param {string} text - Content to analyze
 * @param {SharedData} sharedData - Shared game data
 * @returns {string[]} Array of condition tags
 */
export function extractConditionTags(
  text: string,
  sharedData: SharedData,
): string[] {
  const tags: string[] = [];
  const conditions = GameData.getConditions(sharedData);

  for (const condition of conditions) {
    if (new RegExp(`\\b${condition}\\b`, 'gi').test(text)) {
      tags.push(`condition:${condition}`);
    }
  }

  return tags;
}

/**
 * Extract ability save tags from content. Emits the abbreviated form (`save:dex`).
 *
 * @param {string} text - Content to analyze
 * @param {SharedData} sharedData - Shared game data
 * @returns {string[]} Array of save tags
 */
export function extractAbilitySaveTags(
  text: string,
  sharedData: SharedData,
): string[] {
  const tags: string[] = [];
  const abilities = GameData.getAbilities(sharedData);
  const abilityNames = abilities.flatMap((a) => [a.long, a.short]);
  const pattern = new RegExp(
    `\\b(${abilityNames.join('|')})\\s+(saving throw|save)`,
    'gi',
  );

  let match;
  while ((match = pattern.exec(text)) !== null) {
    const matchedAbility = match[1].toLowerCase();
    const ability = abilities.find(
      (a) =>
        a.long.toLowerCase() === matchedAbility ||
        a.short.toLowerCase() === matchedAbility,
    );
    if (ability) {
      tags.push(`save:${ability.short.toLowerCase()}`);
    }
  }

  return tags;
}

/**
 * Extract movement type tags from content.
 *
 * @param {string} text - Content to analyze
 * @param {SharedData} sharedData - Shared game data
 * @param {boolean} [requireMeasurement=false] - For flight, require feet measurement
 * @returns {string[]} Array of movement tags
 */
export function extractMovementTags(
  text: string,
  sharedData: SharedData,
  requireMeasurement = false,
): string[] {
  const tags: string[] = [];
  const movementTypes = GameData.getMovementTypes(sharedData);
  for (const movement of movementTypes) {
    if (MOVEMENT[movement] && MOVEMENT[movement].test(text)) {
      if (
        movement === 'flight' &&
        requireMeasurement &&
        !MOVEMENT.distanceFeet.test(text)
      )
        continue;
      tags.push(`movement:${movement}`);
    }
  }

  return tags;
}

/**
 * Extract mechanic tags specific to monsters.
 *
 * @param {string} text - Content to analyze
 * @returns {string[]} Array of mechanic tags
 */
export function extractMonsterMechanicTags(text: string): string[] {
  const tags: string[] = [];

  if (MONSTER_MECHANICS.legendaryDeed.test(text))
    tags.push('mechanic:legendary-deed');
  if (MONSTER_MECHANICS.deedResist.test(text))
    tags.push('mechanic:deed-resist');
  if (MONSTER_MECHANICS.deedLair.test(text)) tags.push('mechanic:deed-lair');
  if (MONSTER_MECHANICS.deedStratagem.test(text))
    tags.push('mechanic:deed-stratagem');
  if (MONSTER_MECHANICS.deedPhase.test(text)) tags.push('mechanic:deed-phase');
  if (MONSTER_MECHANICS.multiattack.test(text))
    tags.push('mechanic:multiattack');
  if (MONSTER_MECHANICS.reactions.test(text)) tags.push('tempo:reactive');
  if (MONSTER_MECHANICS.minorActions.test(text)) tags.push('tempo:minor');

  if (MONSTER_MECHANICS.regeneration.test(text))
    tags.push('mechanic:regeneration');
  if (MONSTER_MECHANICS.healing.test(text)) tags.push('mechanic:regeneration');

  if (MONSTER_MECHANICS.spellcasting.test(text))
    tags.push('mechanic:spellcasting');
  if (MONSTER_MECHANICS.innateSpellcasting.test(text))
    tags.push('mechanic:innate-spellcasting');

  if (MONSTER_MECHANICS.magicResistance.test(text))
    tags.push('mechanic:magic-resistance');
  if (MONSTER_MECHANICS.magicWeapons.test(text))
    tags.push('mechanic:magic-weapon');
  if (MONSTER_MECHANICS.packTactics.test(text))
    tags.push('mechanic:pack-tactics');
  if (MONSTER_MECHANICS.sneakAttack.test(text))
    tags.push('mechanic:sneak-attack');
  if (MONSTER_MECHANICS.aura.test(text)) tags.push('delivery:aura');
  if (MONSTER_MECHANICS.summoning.test(text)) tags.push('delivery:summon');
  if (MONSTER_MECHANICS.shapeshifting.test(text))
    tags.push('mechanic:shapeshifting');

  if (MONSTER_MECHANICS.damageResistance.test(text))
    tags.push('defense:resistance');
  if (MONSTER_MECHANICS.damageImmunity.test(text)) tags.push('defense:immunity');
  if (MONSTER_MECHANICS.damageVulnerability.test(text))
    tags.push('defense:vulnerability');

  return tags;
}

/**
 * Extract mechanic tags specific to items.
 *
 * @param {string} text - Content to analyze
 * @returns {string[]} Array of mechanic tags
 */
export function extractItemMechanicTags(text: string): string[] {
  const tags: string[] = [];

  if (ITEM_MECHANICS.accuracyBonus.test(text))
    tags.push('mechanic:accuracy-bonus');
  if (ITEM_MECHANICS.damageBonus.test(text)) tags.push('mechanic:damage-bonus');
  if (ITEM_MECHANICS.acBonus.test(text)) tags.push('mechanic:ac-bonus');
  if (ITEM_MECHANICS.savingThrowBonus.test(text))
    tags.push('mechanic:save-bonus');

  if (ITEM_MECHANICS.reaction.test(text)) tags.push('tempo:reactive');
  if (ITEM_MECHANICS.minorAction.test(text)) tags.push('tempo:minor');
  if (ITEM_MECHANICS.opportunityAttack.test(text))
    tags.push('mechanic:opportunity-attack');
  if (ITEM_MECHANICS.noOpportunityAttack.test(text))
    tags.push('mechanic:no-opportunity-attack');

  if (ITEM_MECHANICS.damageResistanceTo.test(text))
    tags.push('defense:resistance');
  if (ITEM_MECHANICS.damageImmunityTo.test(text)) tags.push('defense:immunity');
  if (ITEM_MECHANICS.damageVulnerabilityTo.test(text))
    tags.push('defense:vulnerability');

  if (ITEM_MECHANICS.spellcasting.test(text))
    tags.push('mechanic:spellcasting');
  if (ITEM_MECHANICS.cantrips.test(text)) tags.push('mechanic:cantrip');
  if (ITEM_MECHANICS.charges.test(text)) tags.push('resource:charge');
  if (ITEM_MECHANICS.limitedUses.test(text)) tags.push('resource:limited');
  if (ITEM_MECHANICS.recharge.test(text)) tags.push('resource:recharge');

  if (
    ITEM_MECHANICS.consumable.test(text) ||
    ITEM_MECHANICS.consumableDestroyed.test(text)
  )
    tags.push('property:consumable');
  if (ITEM_MECHANICS.attunement.test(text))
    tags.push('property:attunement-required');
  if (ITEM_MECHANICS.tier.test(text))
    tags.push('property:proficiency-required');

  return tags;
}

/**
 * Extract lore tags (factions, locations) from content. Both carry the `meta:` prefix.
 *
 * @param {string} text - Content to analyze
 * @param {string[]} factions - List of faction names to search for
 * @param {string[]} locations - List of location names to search for
 * @returns {string[]} Array of lore tags
 */
export function extractLoreTags(
  text: string,
  factions: string[],
  locations: string[],
): string[] {
  const tags: string[] = [];

  for (const faction of factions) {
    if (new RegExp(`\\b${faction}\\b`, 'i').test(text)) {
      tags.push(`meta:faction:${faction.toLowerCase().replace(/\s+/g, '-')}`);
    }
  }

  for (const location of locations) {
    if (new RegExp(`\\b${location}\\b`, 'i').test(text)) {
      tags.push(`meta:location:${location.toLowerCase().replace(/\s+/g, '-')}`);
    }
  }

  return tags;
}

/**
 * Extract organizational tags from file path (category, locale, provenance).
 *
 * @param {string} filePath - Absolute path to content file
 * @param {string} [projectRoot] - Root directory of the project
 * @param {string} [declaredSource] - Frontmatter `source` value
 * @returns {string[]} Array of organizational tags
 */
export function extractOrganizationalTags(
  filePath: string,
  projectRoot: string = process.cwd(),
  declaredSource?: string,
): string[] {
  const tags: string[] = [];
  const relativePath = filePath
    .replace(projectRoot, '')
    .replace(SLUG.pathSeparatorLeading, '');
  const pathParts = relativePath.split(SLUG.pathSeparator);

  if (pathParts.includes('monsters')) tags.push('meta:category:monsters');
  if (pathParts.includes('items')) tags.push('meta:category:items');
  if (pathParts.includes('heirlooms')) tags.push('meta:category:heirlooms');
  if (pathParts.includes('character-creation'))
    tags.push('meta:category:character-creation');
  if (pathParts.includes('vocations')) tags.push('meta:category:vocations');
  if (pathParts.includes('spells')) tags.push('meta:category:spells');
  if (pathParts.includes('world')) tags.push('meta:category:world');
  if (pathParts.includes('rules')) tags.push('meta:category:rules');

  if (pathParts.includes('en')) tags.push('meta:locale:en');
  if (pathParts.includes('es')) tags.push('meta:locale:es');
  if (pathParts.includes('fi')) tags.push('meta:locale:fi');

  if (declaredSource) tags.push(`meta:source:${declaredSource.toLowerCase()}`);

  return tags;
}

/**
 * Extract content type tags from file path and content structure.
 *
 * @param {string} filePath - Absolute path to content file
 * @param {string} content - File content
 * @returns {string[]} Array of content type tags
 */
export function extractContentTypeTags(
  filePath: string,
  content: string,
): string[] {
  const tags: string[] = [];

  if (filePath.includes('.sheet.mdx')) {
    tags.push('sheet', 'statblock');
  } else if (filePath.endsWith('.mdx')) {
    tags.push('content');
  }

  if (content.includes('**Armor Class**')) tags.push('statblock', 'creature');
  if (content.includes('**Challenge Rating**'))
    tags.push('monster', 'encounter');
  if (content.includes('_Spell level_') || content.includes('**Casting Time**'))
    tags.push('spell');
  if (
    content.includes('**Rarity**') ||
    content.includes('_weapon_') ||
    content.includes('_armor_')
  ) {
    tags.push('item', 'equipment');
  }
  if (
    content.includes('**Class Features**') ||
    content.includes('**Subclass**')
  )
    tags.push('class');

  return tags.map((tag) => `meta:content:${tag}`);
}

/**
 * Extract all tags from content — unified entry point.
 *
 * @param {string} content - File content to analyze
 * @param {string} filePath - Absolute path to file
 * @param {SharedData} sharedData - Shared game data
 * @param {TagExtractionOptions} [options] - Additional options
 * @returns {string[]} Sorted, deduplicated array of all extracted tags
 */
export function extractAllTags(
  content: string,
  filePath: string,
  sharedData: SharedData,
  options: TagExtractionOptions = {},
): string[] {
  const {
    contentType = 'generic',
    factions = sharedData.worldData?.factions ?? [],
    locations = sharedData.worldData?.locations ?? [],
    requireFlightMeasurement = false,
  } = options;

  const allTags: string[] = [];
  const prose = stripCitations(content);

  allTags.push(...extractDamageTags(prose, sharedData));
  allTags.push(...extractConditionTags(prose, sharedData));
  allTags.push(...extractAbilitySaveTags(prose, sharedData));
  allTags.push(
    ...extractMovementTags(prose, sharedData, requireFlightMeasurement),
  );
  allTags.push(...extractDerivedAspects(prose, sharedData));

  if (contentType === 'monster') {
    allTags.push(...extractMonsterMechanicTags(prose));
  } else if (contentType === 'item') {
    allTags.push(...extractItemMechanicTags(prose));
  } else {
    allTags.push(...extractMonsterMechanicTags(prose));
    allTags.push(...extractItemMechanicTags(prose));
  }

  if (factions.length > 0 || locations.length > 0) {
    allTags.push(...extractLoreTags(content, factions, locations));
  }

  allTags.push(
    ...extractOrganizationalTags(
      filePath,
      process.cwd(),
      content.match(FRONTMATTER.source)?.[1]?.trim(),
    ),
  );
  allTags.push(...extractContentTypeTags(filePath, content));
  allTags.push(...extractStrataTags(allTags, sharedData));

  return Array.from(new Set(allTags)).sort();
}
