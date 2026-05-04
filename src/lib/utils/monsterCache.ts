/**
 * @fileoverview Client-safe monster data caching layer with locale-aware deduplication.
 * Cache is stored in memory (module scope) and cleared on page reload.
 *
 * @module monsterCache
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
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
 * @property {Object} [scores] - Flat ability scores matching MonsterScoreEmbed (modifiers derived via floor((score - 10) / 2))
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
  scores?: {
    str?: number;
    dex?: number;
    con?: number;
    int?: number;
    wis?: number;
    cha?: number;
  };
  proficiencyBonus?: number;
  speed?: {
    raw: string;
  };
  link?: string;
  tags?: string[];
}

/** In-memory cache for monster index data, keyed by locale. */
const indexCache = new Map<string, MonsterIndexEntry[]>();

/** In-memory cache for individual monster data, keyed by "locale:slug". */
const monsterCache = new Map<string, MonsterData>();

/** Tracks in-flight index fetch promises to prevent duplicate requests. */
const indexFetchPromises = new Map<string, Promise<MonsterIndexEntry[]>>();

/** Tracks in-flight monster fetch promises to prevent duplicate requests. */
const monsterFetchPromises = new Map<string, Promise<MonsterData | null>>();

/** Builds a cache key for individual monster lookups. */
function buildMonsterCacheKey(locale: string, slug: string): string {
  return `${locale}:${slug}`;
}

/**
 * Fetches and caches the monster index for a given locale.
 * Prevents duplicate concurrent requests through promise tracking.
 *
 * @param {string} locale - Locale code for API request
 * @returns {Promise<MonsterIndexEntry[]>} Array of monster index entries
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

/** Internal fetch for monster index. */
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
 * Prevents duplicate concurrent requests through promise tracking.
 *
 * @param {string} slug - Monster slug identifier
 * @param {string} locale - Locale code for API request
 * @returns {Promise<MonsterData | null>} Monster data or null if not found
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

/** Internal fetch for single monster by slug. */
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

/** Clears all cached monster data. */
export function clearMonsterCache(): void {
  indexCache.clear();
  monsterCache.clear();
  indexFetchPromises.clear();
  monsterFetchPromises.clear();
}

/** Clears cached data for a specific locale only. */
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
