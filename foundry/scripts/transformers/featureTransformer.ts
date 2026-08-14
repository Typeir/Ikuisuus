/**
 * @fileoverview Monster feature to dnd5e 5.3 Foundry Item transformer.
 * @description Converts a MonsterFeature to a Foundry Item and applies
 * handler overrides.
 *
 * @module foundry/scripts/transformers/featureTransformer
 * @version 3.0.0
 * @author Typeir
 * @since 2026-04-14
 *
 * @see {@link transformFeature} for the public entry point
 * @see {@link ParserRegistry} for handler dispatch
 * @see {@link itemBuilders} for per-type item construction
 */

import type { MonsterFeature } from '../../../src/lib/types/feature';
import type { ParserRegistry } from '../handlers/registry';
import type { FoundryActivity, FoundryItemOverrides } from '../handlers/types';
import { generateFoundryId } from '../utils/idGenerator';
import {
  buildMultiattackItem,
  buildPassiveItem,
  buildSaveFeatItem,
  buildWeaponItem,
} from './itemBuilders';

/**
 * Foundry VTT dnd5e embedded Item JSON structure (Activity model).
 *
 * @property {string} _id - 16-character alphanumeric Foundry document ID
 * @property {string} name - Display name of the item
 * @property {string} type - dnd5e item type ("feat" or "weapon")
 * @property {Record<string, unknown>} system - dnd5e system data with activities map
 * @property {Record<string, unknown>} flags - Module flag data
 */
export interface FoundryItem {
  _id: string;
  name: string;
  type: string;
  system: Record<string, unknown>;
  flags: Record<string, unknown>;
}

/**
 * Parses a dice formula string into structured components.
 *
 * @param {string} formula - Dice formula string (e.g. "2d6+4", "10d10")
 * @returns {{ count: number; sides: number; bonus: string } | null} Parsed result, or null if unparseable
 */
export function parseDamageFormula(
  formula: string,
): { count: number; sides: number; bonus: string } | null {
  const match = formula.trim().match(/^(\d+)d(\d+)\s*([+-]\s*\d+)?$/);
  if (!match) return null;
  return {
    count: parseInt(match[1], 10),
    sides: parseInt(match[2], 10),
    bonus: match[3]?.replace(/\s/g, '') ?? '',
  };
}

/**
 * Builds a generic dnd5e item from a MonsterFeature using the Activity model.
 *
 * @param {MonsterFeature} feature - Source feature metadata
 * @param {string} actorId - Parent actor ID for unique item ID generation
 * @param {number} featureIndex - Array index of the feature within the actor's feature list
 * @returns {FoundryItem} Base Foundry item with Activity-model field mappings
 */
function buildBaseItem(
  feature: MonsterFeature,
  actorId: string,
  featureIndex: number,
): FoundryItem {
  const itemId = generateFoundryId(
    `${actorId}:${feature.id}:${featureIndex}`,
    'feature',
  );
  if (feature.attack) return buildWeaponItem(feature, itemId);
  if (feature.multiattack) return buildMultiattackItem(feature, itemId);
  if (feature.saving_throw) return buildSaveFeatItem(feature, itemId);
  return buildPassiveItem(feature, itemId);
}

/**
 * Deep-merges handler overrides into a base item's system and flags.
 *
 * @param {FoundryItem} item - Base item to merge into (mutated)
 * @param {FoundryItemOverrides} overrides - Handler-provided overrides
 * @returns {FoundryItem} The mutated item with overrides applied
 */
function applyOverrides(
  item: FoundryItem,
  overrides: FoundryItemOverrides,
): FoundryItem {
  if (overrides.activities) {
    const existing = (item.system.activities ?? {}) as Record<
      string,
      FoundryActivity
    >;
    item.system.activities = { ...existing, ...overrides.activities };
  }
  if (overrides.description !== undefined)
    item.system.description = { value: overrides.description };
  if (overrides.flags) {
    for (const [key, value] of Object.entries(overrides.flags)) {
      if (
        typeof value === 'object' &&
        value !== null &&
        typeof item.flags[key] === 'object' &&
        item.flags[key] !== null
      ) {
        item.flags[key] = { ...(item.flags[key] as object), ...value };
      } else {
        item.flags[key] = value;
      }
    }
  }
  return item;
}

/**
 * Transforms a MonsterFeature into a Foundry VTT dnd5e embedded Item.
 *
 * @param {MonsterFeature} feature - Source feature from monster metadata
 * @param {ParserRegistry} registry - Parser registry to check for handlers
 * @param {string} actorId - Parent actor ID for unique item ID generation
 * @param {number} featureIndex - Array index of the feature within the actor's feature list
 * @returns {FoundryItem} Complete Foundry item ready for Actor embedding
 */
export function transformFeature(
  feature: MonsterFeature,
  registry: ParserRegistry,
  actorId: string,
  featureIndex: number,
): FoundryItem {
  const item = buildBaseItem(feature, actorId, featureIndex);
  const overrides = registry.dispatch(feature.id, '');
  return overrides ? applyOverrides(item, overrides) : item;
}
