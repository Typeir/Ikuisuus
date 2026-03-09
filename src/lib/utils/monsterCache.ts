/**
 * @fileoverview Monster Data Cache Utility
 * @description Client-safe monster data caching layer to reduce redundant API calls.
 * Provides locale-aware caching for monster index data and individual monster lookups.
 * Cache is stored in memory (module scope) and is cleared on page reload.
 *
 * @module monsterCache
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires @/lib/logging/logger Structured logging for cache operations
 *
 * @example
 * ```typescript
 * const monster = await getMonsterBySlug('ancient-red-dragon', 'en');
 * const index = await getMonsterIndex('en');
 * ```
 */

import { logger } from '@/lib/logging/logger';

/**
 * Minimal monster index entry for combobox display.
 * Contains only fields needed for search/filter operations.
 *
 * @interface MonsterIndexEntry
 * @property {string} slug - Unique identifier/URL slug for the monster
 * @property {string} title - Display name of the monster
 * @property {string} cr - Challenge rating (e.g., "23", "1/4")
 * @property {string} size - Size category (e.g., "medium", "gargantuan")
 * @property {string} creatureType - Type (e.g., "aberration", "dragon")
 */
export interface MonsterIndexEntry {
  slug: string;
  title: string;
  cr: string;
  size: string;
  creatureType: string;
}

/**
 * Full monster data returned from individual monster API.
 * Includes all combat-relevant fields for creature creation.
 *
 * @interface MonsterData
 * @property {string} slug - Unique identifier
 * @property {string} title - Display name
 * @property {string} cr - Challenge rating
 * @property {string} size - Size category
 * @property {string} creatureType - Monster type
 * @property {Object} [hp] - Hit points with average and formula
 * @property {Object} [ac] - Armor class with value and notes
 * @property {Object} [abilities] - Ability scores (modifiers derived via floor((score - 10) / 2))
 * @property {number} [proficiencyBonus] - Proficiency bonus
 * @property {Object} [speed] - Speed information
 * @property {string} [link] - Wiki link path
 * @property {string[]} [tags] - Mechanic tags for flags
 */
export interface MonsterData {
  slug: string;
  subSlug?: string;
  title: string;
  cr: string;
  size: string;
  creatureType: string;
  hp?: {
    average: number;
    formula: string;
  };
  ac?: {
    value: number;
    notes?: string;
  };
  abilities?: {
    str?: { score: number };
    dex?: { score: number };
    con?: { score: number };
    int?: { score: number };
    wis?: { score: number };
    cha?: { score: number };
  };
  proficiencyBonus?: number;
  speed?: {
    raw: string;
  };
  link?: string;
  tags?: string[];
}

/**
 * In-memory cache for monster index data, keyed by locale.
 * @private
 */
const indexCache = new Map<string, MonsterIndexEntry[]>();

/**
 * In-memory cache for individual monster data, keyed by "locale:slug".
 * @private
 */
const monsterCache = new Map<string, MonsterData>();

/**
 * Tracks in-flight index fetch promises to prevent duplicate requests.
 * @private
 */
const indexFetchPromises = new Map<string, Promise<MonsterIndexEntry[]>>();

/**
 * Tracks in-flight monster fetch promises to prevent duplicate requests.
 * @private
 */
const monsterFetchPromises = new Map<string, Promise<MonsterData | null>>();

/**
 * Builds a cache key for individual monster lookups.
 *
 * @function buildMonsterCacheKey
 * @param {string} locale - Locale code
 * @param {string} slug - Monster slug
 * @returns {string} Cache key in format "locale:slug"
 */
function buildMonsterCacheKey(locale: string, slug: string): string {
  return `${locale}:${slug}`;
}

/**
 * Fetches and caches the monster index for a given locale.
 * Returns cached data if available, otherwise fetches from API.
 * Prevents duplicate concurrent requests through promise tracking.
 *
 * @async
 * @function getMonsterIndex
 * @param {string} locale - Locale code for API request
 * @returns {Promise<MonsterIndexEntry[]>} Array of monster index entries
 *
 * @example
 * const monsters = await getMonsterIndex('en');
 * const filtered = monsters.filter(m => m.cr === '5');
 */
export async function getMonsterIndex(
  locale: string,
): Promise<MonsterIndexEntry[]> {
  const cached = indexCache.get(locale);
  if (cached) {
    return cached;
  }

  const existingPromise = indexFetchPromises.get(locale);
  if (existingPromise) {
    return existingPromise;
  }

  const fetchPromise = fetchMonsterIndex(locale);
  indexFetchPromises.set(locale, fetchPromise);

  try {
    const data = await fetchPromise;
    indexCache.set(locale, data);
    return data;
  } finally {
    indexFetchPromises.delete(locale);
  }
}

/**
 * Internal fetch implementation for monster index.
 *
 * @async
 * @function fetchMonsterIndex
 * @param {string} locale - Locale code
 * @returns {Promise<MonsterIndexEntry[]>} Fetched monster index
 * @private
 */
async function fetchMonsterIndex(locale: string): Promise<MonsterIndexEntry[]> {
  try {
    const response = await fetch(`/api/monsters/index?locale=${locale}`);
    if (!response.ok) {
      logger.error('Failed to fetch monster index from API', {
        status: response.status,
        locale,
      });
      return [];
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    logger.error('Error fetching monster index', {
      error: error instanceof Error ? error.message : String(error),
      locale,
    });
    return [];
  }
}

/**
 * Fetches and caches a single monster by slug for a given locale.
 * Returns cached data if available, otherwise fetches from API.
 * Prevents duplicate concurrent requests through promise tracking.
 *
 * @async
 * @function getMonsterBySlug
 * @param {string} slug - Monster slug identifier
 * @param {string} locale - Locale code for API request
 * @returns {Promise<MonsterData | null>} Monster data or null if not found
 *
 * @example
 * const dragon = await getMonsterBySlug('ancient-red-dragon', 'en');
 * if (dragon) {
 *   console.log(dragon.title); // "Ancient Red Dragon"
 * }
 */
export async function getMonsterBySlug(
  slug: string,
  locale: string,
): Promise<MonsterData | null> {
  const cacheKey = buildMonsterCacheKey(locale, slug);

  const cached = monsterCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const existingPromise = monsterFetchPromises.get(cacheKey);
  if (existingPromise) {
    return existingPromise;
  }

  const fetchPromise = fetchMonsterBySlug(slug, locale);
  monsterFetchPromises.set(cacheKey, fetchPromise);

  try {
    const data = await fetchPromise;
    if (data) {
      monsterCache.set(cacheKey, data);
    }
    return data;
  } finally {
    monsterFetchPromises.delete(cacheKey);
  }
}

/**
 * Internal fetch implementation for single monster.
 *
 * @async
 * @function fetchMonsterBySlug
 * @param {string} slug - Monster slug
 * @param {string} locale - Locale code
 * @returns {Promise<MonsterData | null>} Fetched monster or null
 * @private
 */
async function fetchMonsterBySlug(
  slug: string,
  locale: string,
): Promise<MonsterData | null> {
  try {
    const response = await fetch(`/api/monsters/${slug}?locale=${locale}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      logger.error('Failed to fetch monster', {
        status: response.status,
        slug,
        locale,
      });
      return null;
    }
    return await response.json();
  } catch (error) {
    logger.error('Error fetching monster', {
      error: error instanceof Error ? error.message : String(error),
      slug,
      locale,
    });
    return null;
  }
}

/**
 * Clears all cached monster data.
 * Useful for testing or when locale changes globally.
 *
 * @function clearMonsterCache
 * @returns {void}
 *
 * @example
 * clearMonsterCache();
 */
export function clearMonsterCache(): void {
  indexCache.clear();
  monsterCache.clear();
  indexFetchPromises.clear();
  monsterFetchPromises.clear();
}

/**
 * Clears cached data for a specific locale only.
 *
 * @function clearMonsterCacheForLocale
 * @param {string} locale - Locale to clear
 * @returns {void}
 */
export function clearMonsterCacheForLocale(locale: string): void {
  indexCache.delete(locale);

  const keysToDelete: string[] = [];
  monsterCache.forEach((_, key) => {
    if (key.startsWith(`${locale}:`)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((key) => monsterCache.delete(key));
}
