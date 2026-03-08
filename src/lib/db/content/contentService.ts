/**
 * @fileoverview Legacy Content Service Shim
 * @description Deprecated compatibility bridge that preserves the old
 * `ContentAdapter` / `setContentAdapter()` / `listMonsters()` API surface
 * for existing tests. All calls delegate to the factory-resolved repository
 * instances exported from each repository module.
 *
 * **New code should import the resolved repository directly:**
 * ```typescript
 * import { monsterRepository } from '@/lib/db/content/repositories/monsterRepository';
 *
 * const monsters = await monsterRepository.list('en');
 * ```
 *
 * @deprecated Use typed repository imports from `repositories/`.
 * @module lib/db/content/contentService
 * @version 4.0.0
 * @author Typeir
 * @since 3.0.0
 */

import type { ContentAdapter, ContentCategory } from './contentAdapter';
import { heirloomRepository } from './repositories/heirloomRepository';
import { monsterRepository } from './repositories/monsterRepository';
import { spellRepository } from './repositories/spellRepository';
import { trinketRepository } from './repositories/trinketRepository';

/* ──────────────  Legacy ContentAdapter Bridge  ──────────────────── */

/**
 * Maps category strings to the corresponding factory-resolved repository.
 * Bridges the old `ContentAdapter.listMetadata(category, locale)` call shape
 * into typed repository method calls.
 */
const factoryBridge: ContentAdapter = {
  listMetadata: async (
    category: ContentCategory,
    locale: string,
  ): Promise<Record<string, unknown>[]> => {
    switch (category) {
      case 'monsters':
        return monsterRepository.list(locale) as Promise<
          Record<string, unknown>[]
        >;
      case 'heirlooms':
        return heirloomRepository.list(locale) as Promise<
          Record<string, unknown>[]
        >;
      case 'spells':
        return spellRepository.list(locale) as Promise<
          Record<string, unknown>[]
        >;
      case 'trinkets':
        return trinketRepository.list(locale) as Promise<
          Record<string, unknown>[]
        >;
      default:
        throw new Error(`Unknown content category: ${category}`);
    }
  },

  listMetadataBySlugs: async (
    category: ContentCategory,
    locale: string,
    slugs?: string[],
  ): Promise<Record<string, unknown>[]> => {
    if (category === 'spells' && slugs && slugs.length > 0) {
      return spellRepository.listBySlugs(locale, slugs) as Promise<
        Record<string, unknown>[]
      >;
    }
    return factoryBridge.listMetadata(category, locale);
  },
};

/** @deprecated Active legacy adapter — use typed repositories instead. */
let adapter: ContentAdapter = factoryBridge;

/**
 * Replaces the active content storage adapter.
 *
 * @deprecated Inject mock repositories via `vi.mock()`.
 * @param {ContentAdapter} newAdapter - Adapter to use
 */
export const setContentAdapter = (newAdapter: ContentAdapter): void => {
  adapter = newAdapter;
};

/**
 * Returns the currently active content adapter.
 *
 * @deprecated Import repository directly from its module.
 * @returns {ContentAdapter} Current adapter
 */
export const getContentAdapter = (): ContentAdapter => adapter;

/* ─────────────────  Legacy Category helpers  ──────────────────────── */

/**
 * @deprecated Use `monsterRepository.list(locale)` from `repositories/monsterRepository`.
 * @param {string} locale - Locale code
 * @returns {Promise<Record<string, unknown>[]>} Monster metadata
 */
export const listMonsters = (
  locale: string = 'en',
): Promise<Record<string, unknown>[]> =>
  adapter.listMetadata('monsters', locale);

/**
 * @deprecated Use `heirloomRepository.list(locale)` from `repositories/heirloomRepository`.
 * @param {string} locale - Locale code
 * @returns {Promise<Record<string, unknown>[]>} Heirloom metadata
 */
export const listHeirlooms = (
  locale: string = 'en',
): Promise<Record<string, unknown>[]> =>
  adapter.listMetadata('heirlooms', locale);

/**
 * @deprecated Use `spellRepository.list(locale)` / `spellRepository.listBySlugs(locale, slugs)`.
 * @param {string} locale - Locale code
 * @param {string[]} [slugs] - Optional slug filter
 * @returns {Promise<Record<string, unknown>[]>} Spell metadata
 */
export const listSpells = (
  locale: string = 'en',
  slugs?: string[],
): Promise<Record<string, unknown>[]> =>
  adapter.listMetadataBySlugs('spells', locale, slugs);

/**
 * @deprecated Use `trinketRepository.list(locale)` from `repositories/trinketRepository`.
 * @param {string} locale - Locale code
 * @returns {Promise<Record<string, unknown>[]>} Trinket metadata
 */
export const listTrinkets = (
  locale: string = 'en',
): Promise<Record<string, unknown>[]> =>
  adapter.listMetadata('trinkets', locale);

/**
 * @deprecated Use `adapter.listMetadata(category, locale)` is no longer the primary pattern.
 * @param {ContentCategory} category - Content category
 * @param {string} locale - Locale code
 * @returns {Promise<Record<string, unknown>[]>} Metadata records
 */
export const listMetadata = (
  category: ContentCategory,
  locale: string = 'en',
): Promise<Record<string, unknown>[]> => adapter.listMetadata(category, locale);

/**
 * @deprecated Use typed repository methods directly.
 * @param {ContentCategory} category - Content category
 * @param {string} locale - Locale code
 * @param {string[]} [slugs] - Optional slug filter
 * @returns {Promise<Record<string, unknown>[]>} Metadata records
 */
export const listMetadataBySlugs = (
  category: ContentCategory,
  locale: string = 'en',
  slugs?: string[],
): Promise<Record<string, unknown>[]> =>
  adapter.listMetadataBySlugs(category, locale, slugs);
