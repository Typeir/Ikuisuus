/**
 * @fileoverview Content Metadata Service
 * @description Facade that sits between API routes and the content storage adapter.
 * Provides typed helpers for each content category and adapter hot-swapping via
 * `setContentAdapter()`. Defaults to the filesystem adapter.
 *
 * @module lib/db/content/contentService
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import type { ContentAdapter, ContentCategory } from './contentAdapter';
import { fsContentAdapter } from './fsContentAdapter';

/* ────────────────────────  Adapter wiring  ─────────────────────────── */

/** Active adapter — defaults to filesystem, override via `setContentAdapter`. */
let adapter: ContentAdapter = fsContentAdapter;

/**
 * Replaces the active content storage adapter.
 * Call this once at startup (e.g. in an instrumentation file) to switch backends.
 *
 * @param {ContentAdapter} newAdapter - Adapter to use
 */
export const setContentAdapter = (newAdapter: ContentAdapter): void => {
  adapter = newAdapter;
};

/**
 * Returns the currently active content adapter.
 *
 * @returns {ContentAdapter} Current adapter
 */
export const getContentAdapter = (): ContentAdapter => adapter;

/* ─────────────────────  Category helpers  ──────────────────────────── */

/**
 * Fetches all metadata records for a given category and locale.
 *
 * @param {ContentCategory} category - Content type (monsters, heirlooms, spells, trinkets)
 * @param {string} locale - Locale code (defaults to 'en')
 * @returns {Promise<Record<string, unknown>[]>} Flattened metadata array
 */
export const listMetadata = async (
  category: ContentCategory,
  locale: string = 'en',
): Promise<Record<string, unknown>[]> => {
  return adapter.listMetadata(category, locale);
};

/**
 * Fetches metadata records filtered by slug list.
 *
 * @param {ContentCategory} category - Content type
 * @param {string} locale - Locale code
 * @param {string[]} [slugs] - Optional slug filter (returns all if empty/undefined)
 * @returns {Promise<Record<string, unknown>[]>} Filtered metadata array
 */
export const listMetadataBySlugs = async (
  category: ContentCategory,
  locale: string = 'en',
  slugs?: string[],
): Promise<Record<string, unknown>[]> => {
  return adapter.listMetadataBySlugs(category, locale, slugs);
};

/* ─────────────────  Convenience per-category exports  ─────────────── */

/**
 * Fetches all monster metadata for a locale.
 *
 * @param {string} locale - Locale code
 * @returns {Promise<Record<string, unknown>[]>} Monster metadata array
 */
export const listMonsters = (
  locale: string = 'en',
): Promise<Record<string, unknown>[]> => listMetadata('monsters', locale);

/**
 * Fetches all heirloom metadata for a locale.
 *
 * @param {string} locale - Locale code
 * @returns {Promise<Record<string, unknown>[]>} Heirloom metadata array
 */
export const listHeirlooms = (
  locale: string = 'en',
): Promise<Record<string, unknown>[]> => listMetadata('heirlooms', locale);

/**
 * Fetches all spell metadata for a locale, optionally filtered by slugs.
 *
 * @param {string} locale - Locale code
 * @param {string[]} [slugs] - Optional slug filter
 * @returns {Promise<Record<string, unknown>[]>} Spell metadata array
 */
export const listSpells = (
  locale: string = 'en',
  slugs?: string[],
): Promise<Record<string, unknown>[]> =>
  listMetadataBySlugs('spells', locale, slugs);

/**
 * Fetches all trinket metadata for a locale.
 *
 * @param {string} locale - Locale code
 * @returns {Promise<Record<string, unknown>[]>} Trinket metadata array
 */
export const listTrinkets = (
  locale: string = 'en',
): Promise<Record<string, unknown>[]> => listMetadata('trinkets', locale);
