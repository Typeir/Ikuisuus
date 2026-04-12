/**
 * @fileoverview Unified Tagging Utilities
 * @description Centralized tagging system that combines mechanics-based tagging
 * (damage types, conditions, abilities) with organizational and lore-based tagging
 * (factions, locations, categories). Used by metadata generators and the sync service.
 *
 * @module lib/metadata/taggingUtils
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

/* paw:gate:file-length ignore */

import { GameData } from './gameData';
import type { SharedData } from './sharedData';

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
  const tags: string[] = [];
  const damageTypes = GameData.getDamageTypes(sharedData);

  for (const type of damageTypes) {
    if (new RegExp(`\\b${type}\\s+damage\\b`, 'gi').test(text)) {
      tags.push(`damage:${type}`);
    }
  }

  return tags;
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
 * Extract ability save tags from content.
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
      tags.push(`mechanic:${ability.long}-save`);
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
  const movementPatterns: Record<string, RegExp> = {
    flight: /\b(fly|flying|flight)\b/i,
    burrowing: /\bburrow/i,
    swimming: /\bswim/i,
    climbing: /\bclimb/i,
    teleportation: /\bteleport/i,
    enhanced: /\bmovement\s+speed/i,
  };

  for (const movement of movementTypes) {
    if (movementPatterns[movement] && movementPatterns[movement].test(text)) {
      if (
        movement === 'flight' &&
        requireMeasurement &&
        !/\d+\s*ft/i.test(text)
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

  if (/\b(Legendary Deed: act?|Legendary Deed: resist)\b/i.test(text))
    tags.push('mechanic:legendary-deed');
  if (/\bLegendary Deed: resist?\b/i.test(text)) tags.push('mechanic:resist');
  if (/\bLegendary Deed: lair?\b/i.test(text)) tags.push('mechanic:lair');
  if (/\bLegendary Deed: Stratagem?\b/i.test(text))
    tags.push('mechanic:stratagem');
  if (/\bLegendary Deed: Phase?\b/i.test(text))
    tags.push('mechanic:phase-actions');
  if (/\bmultiattack\b/i.test(text)) tags.push('mechanic:multiattack');
  if (/\breactions?\b/i.test(text)) tags.push('mechanic:reactions');
  if (/\bbonus actions?\b/i.test(text)) tags.push('mechanic:bonus-actions');

  if (/\bregenerat(e|ion)\b/i.test(text)) tags.push('mechanic:regeneration');
  if (/\b(regains?|recover)\s+\d+\s+(hit points?|hp)\b/i.test(text))
    tags.push('mechanic:regeneration');

  if (/\b(spellcasting|cantrips?|spell slots?)\b/i.test(text))
    tags.push('mechanic:spellcasting');
  if (/\b(innate spellcasting)\b/i.test(text))
    tags.push('mechanic:innate-spellcasting');

  if (/\b(magic resistance)\b/i.test(text))
    tags.push('mechanic:magic-resistance');
  if (/\b(magic weapons?)\b/i.test(text)) tags.push('mechanic:magic-weapons');
  if (/\b(pack tactics)\b/i.test(text)) tags.push('mechanic:pack-tactics');
  if (/\b(sneak attack)\b/i.test(text)) tags.push('mechanic:sneak-attack');
  if (/\b(aura)\b/i.test(text)) tags.push('mechanic:aura');
  if (/\b(summon|summoning)\b/i.test(text)) tags.push('mechanic:summoning');
  if (/\b(shapechange|polymorph)\b/i.test(text))
    tags.push('mechanic:shapeshifting');

  if (/\b(resistant|resistance)\b/i.test(text))
    tags.push('mechanic:damage-resistance');
  if (/\b(immune|immunity)\b/i.test(text))
    tags.push('mechanic:damage-immunity');
  if (/\b(vulnerable|vulnerability)\b/i.test(text))
    tags.push('mechanic:damage-vulnerability');

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

  if (/\+\d+\s+(?:to\s+)?(?:attack|hit)/i.test(text))
    tags.push('mechanic:attack-bonus');
  if (/\+\d+\s+(?:to\s+)?(?:damage|AC)/i.test(text))
    tags.push('mechanic:damage-bonus');
  if (/\+\d+\s+(?:to\s+|bonus\s+to\s+)?AC/i.test(text))
    tags.push('mechanic:ac-bonus');
  if (/\+\d+\s+(?:to\s+|bonus\s+to\s+)?saving throws?/i.test(text))
    tags.push('mechanic:saving-throw-bonus');

  if (/\b(advantage|disadvantage)\b/i.test(text))
    tags.push('mechanic:advantage-disadvantage');
  if (/\bcritical(?:\s+hit)?/i.test(text)) tags.push('mechanic:critical-hits');
  if (/\breaction\b/i.test(text)) tags.push('mechanic:reaction');
  if (/\bbonus action\b/i.test(text)) tags.push('mechanic:bonus-action');
  if (/\bopportunity attack/i.test(text))
    tags.push('mechanic:opportunity-attacks');
  if (/does\s+not\s+provoke\s+opportunity\s+attacks?/i.test(text))
    tags.push('mechanic:no-opportunity-attacks');

  if (/\bresistance\s+to/i.test(text)) tags.push('mechanic:damage-resistance');
  if (/\bimmun(?:e|ity)\s+to/i.test(text))
    tags.push('mechanic:damage-immunity');
  if (/\bvulnerab(?:le|ility)\s+to/i.test(text))
    tags.push('mechanic:damage-vulnerability');

  if (/\bcasts?\s+\[?_?[A-Z][a-z]+|spell/i.test(text))
    tags.push('mechanic:spellcasting');
  if (/\bcantrips?\b/i.test(text)) tags.push('mechanic:cantrips');
  if (/\bcharges?\b/i.test(text)) tags.push('mechanic:charges');
  if (/\b\d+\/(?:short|long)\s+rest/i.test(text))
    tags.push('mechanic:limited-uses');
  if (/\brecharge\s+\d+/i.test(text)) tags.push('mechanic:recharge');
  if (/\breroll/i.test(text)) tags.push('mechanic:reroll');

  if (/\bconsumable\b/i.test(text) || /burns? away|destroyed|inert/i.test(text))
    tags.push('property:consumable');
  if (/\battunement\b/i.test(text)) tags.push('property:attunement-required');
  if (/\bproficiency\b/i.test(text)) tags.push('property:proficiency-required');

  return tags;
}

/**
 * Extract lore tags (factions, locations) from content.
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
      tags.push(`faction:${faction.toLowerCase()}`);
    }
  }

  for (const location of locations) {
    if (new RegExp(`\\b${location}\\b`, 'i').test(text)) {
      tags.push(`location:${location.toLowerCase()}`);
    }
  }

  return tags;
}

/**
 * Extract organizational tags from file path (category, locale, source).
 *
 * @param {string} filePath - Absolute path to content file
 * @param {string} [projectRoot] - Root directory of the project
 * @returns {string[]} Array of organizational tags
 */
export function extractOrganizationalTags(
  filePath: string,
  projectRoot: string = process.cwd(),
): string[] {
  const tags: string[] = [];
  const relativePath = filePath.replace(projectRoot, '').replace(/^[/\\]+/, '');
  const pathParts = relativePath.split(/[/\\]/);

  if (pathParts.includes('monsters')) tags.push('category:monsters');
  if (pathParts.includes('items')) tags.push('category:items');
  if (pathParts.includes('heirlooms')) tags.push('category:heirlooms');
  if (pathParts.includes('character-creation'))
    tags.push('category:character-creation');
  if (pathParts.includes('vocations')) tags.push('category:vocations');
  if (pathParts.includes('spells')) tags.push('category:spells');
  if (pathParts.includes('world')) tags.push('category:world');
  if (pathParts.includes('rules')) tags.push('category:rules');

  if (pathParts.includes('en')) tags.push('locale:en');
  if (pathParts.includes('es')) tags.push('locale:es');
  if (pathParts.includes('fi')) tags.push('locale:fi');

  tags.push('source:official');

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

  return tags.map((tag) => `content:${tag}`);
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
    factions = [],
    locations = [],
    requireFlightMeasurement = false,
  } = options;

  const allTags: string[] = [];

  allTags.push(...extractDamageTags(content, sharedData));
  allTags.push(...extractConditionTags(content, sharedData));
  allTags.push(...extractAbilitySaveTags(content, sharedData));
  allTags.push(
    ...extractMovementTags(content, sharedData, requireFlightMeasurement),
  );

  if (contentType === 'monster') {
    allTags.push(...extractMonsterMechanicTags(content));
  } else if (contentType === 'item') {
    allTags.push(...extractItemMechanicTags(content));
  } else {
    allTags.push(...extractMonsterMechanicTags(content));
    allTags.push(...extractItemMechanicTags(content));
  }

  if (factions.length > 0 || locations.length > 0) {
    allTags.push(...extractLoreTags(content, factions, locations));
  }

  allTags.push(...extractOrganizationalTags(filePath, process.cwd()));
  allTags.push(...extractContentTypeTags(filePath, content));

  return Array.from(new Set(allTags)).sort();
}
