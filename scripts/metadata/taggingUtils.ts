/**
 * @fileoverview Tag extraction utilities: mechanics, organizational, lore, and content tags.
 * @module lib/metadata/taggingUtils
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

/* paw:gate:file-length ignore */

import { toPlainMeasure } from '@/lib/units/nativeMeasure';
import { anchorSlug } from '@/modules/library/domain/anchorSlug';
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

/** A well-formed `group:value` aspect. */
const ASPECT_SHAPE = /^[a-z][a-z0-9-]*:[a-z0-9][a-z0-9-]*$/;

/**
 * Slug rule shared with the page anchors: lowercase, hyphenated, ASCII word
 * chars only. Feature-scoped frontmatter entries key on this.
 *
 * @param {string} text - Feature name or heading
 * @returns {string} Slug
 */
export function aspectAnchor(text: string): string {
  return featureAnchor(text);
}

/**
 * Anchor of a feature: `anchorSlug` of the measure-normalised heading text.
 *
 * @param {string} text - Rendered heading text, or the feature name
 * @returns {string} Anchor slug
 */
export function featureAnchor(text: string): string {
  return anchorSlug(toPlainMeasure(text));
}

/**
 * Stamps `anchor` on every shard from its heading (or name) in place.
 *
 * @param {Array<{ name?: string; heading?: string; anchor?: string }>} shards - Feature shards (mutated)
 */
export function stampAnchors(
  shards: Array<{ name?: string; heading?: string; anchor?: string }>,
): void {
  for (const shard of shards) {
    const text = shard.heading ?? shard.name;
    if (text) shard.anchor = featureAnchor(text);
  }
}

/**
 * Splits an `aspects:` / `denyAspects:` frontmatter list into sheet-level
 * and feature-scoped aspects. Entry: bare `group:value` (sheet) or
 * `{ anchor: [aspects] }` (feature). Malformed entries are ignored.
 *
 * @param {unknown} list - Frontmatter list value
 * @returns {{ sheet: string[]; features: Map<string, string[]> }} Parsed scopes
 */
export function parseAuthoredAspectList(list: unknown): {
  sheet: string[];
  features: Map<string, string[]>;
} {
  const sheet: string[] = [];
  const features = new Map<string, string[]>();
  if (!Array.isArray(list)) return { sheet, features };
  const clean = (v: unknown): string | null => {
    if (typeof v !== 'string') return null;
    const t = v.trim().toLowerCase();
    return ASPECT_SHAPE.test(t) ? t : null;
  };
  for (const entry of list) {
    const bare = clean(entry);
    if (bare) {
      sheet.push(bare);
      continue;
    }
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      for (const [key, value] of Object.entries(entry as Record<string, unknown>)) {
        const anchor = aspectAnchor(key);
        const values = (Array.isArray(value) ? value : [value])
          .map(clean)
          .filter((v): v is string => v !== null);
        if (!anchor || values.length === 0) continue;
        features.set(anchor, [...(features.get(anchor) ?? []), ...values]);
      }
    }
  }
  return { sheet, features };
}

/**
 * Applies the sheet-level authored aspect frontmatter to a generated tag set:
 * bare `aspects:` entries are added, bare `denyAspects:` entries removed.
 * Feature-scoped entries are ignored here; see `applyAuthoredFeatureAspects`.
 * Output is deduplicated and sorted.
 *
 * @param {string[]} tags - Generated aspects
 * @param {Record<string, unknown> | undefined} frontmatter - Parsed frontmatter
 * @returns {string[]} Final aspects
 */
export function applyAuthoredAspects(
  tags: string[],
  frontmatter: Record<string, unknown> | undefined,
): string[] {
  const add = parseAuthoredAspectList(frontmatter?.aspects).sheet;
  const deny = parseAuthoredAspectList(frontmatter?.denyAspects).sheet;
  const merged = Array.from(new Set([...tags, ...add])).sort();
  return applyAspectDenyList(merged, deny);
}

/**
 * Applies feature-scoped authored aspects to a list of feature shards in
 * place. A shard matches an entry when the anchor of its `heading` or `name`
 * equals the entry key.
 *
 * @param {Array<{ name?: string; heading?: string; tags?: string[] }>} features - Feature shards (mutated)
 * @param {Record<string, unknown> | undefined} frontmatter - Parsed frontmatter
 */
export function applyAuthoredFeatureAspects(
  features: Array<{ name?: string; heading?: string; anchor?: string; tags?: string[] }>,
  frontmatter: Record<string, unknown> | undefined,
): void {
  const add = parseAuthoredAspectList(frontmatter?.aspects).features;
  const deny = parseAuthoredAspectList(frontmatter?.denyAspects).features;
  if (add.size === 0 && deny.size === 0) return;
  for (const feature of features) {
    const keys = [feature.heading, feature.name]
      .filter((k): k is string => typeof k === 'string' && k.length > 0)
      .map(aspectAnchor);
    const extra = keys.flatMap((k) => add.get(k) ?? []);
    const denied = keys.flatMap((k) => deny.get(k) ?? []);
    if (extra.length === 0 && denied.length === 0) continue;
    const merged = Array.from(new Set([...(feature.tags ?? []), ...extra])).sort();
    feature.tags = applyAspectDenyList(merged, denied);
  }
}

/**
 * Filters generated aspects through the frontmatter `denyAspects` list.
 * An author lists exact aspects the generator must not assign to this
 * file. Unknown or absent list returns tags unchanged.
 *
 * @param {string[]} tags - Generated aspects
 * @param {unknown} denyAspects - Frontmatter `denyAspects` value
 * @returns {string[]} Aspects minus the denied
 */
export function applyAspectDenyList(
  tags: string[],
  denyAspects: unknown,
): string[] {
  if (!Array.isArray(denyAspects) || denyAspects.length === 0) return tags;
  const denied = new Set(
    denyAspects
      .filter((t): t is string => typeof t === 'string')
      .map((t) => t.trim().toLowerCase()),
  );
  return tags.filter((t) => !denied.has(t.toLowerCase()));
}

/**
 * Extract all tags from content. Unified entry point.
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
