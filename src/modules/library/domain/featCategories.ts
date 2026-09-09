/**
 * @fileoverview Feat categories and their catalogue keys.
 * @module modules/library/domain/featCategories
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

/**
 * Feat categories.
 */
export const FEAT_CATEGORIES = ['general', 'origin', 'epic boon'] as const;

/**
 * Feat category values.
 */
export type FeatCategory = (typeof FEAT_CATEGORIES)[number];

/**
 * Catalogue key for a feat category.
 *
 * @param {string} category - Authored category, any casing
 * @returns {string} Catalogue key under `library.feat.category`
 *
 * @example
 * featCategoryKey('Epic Boon'); // 'epicBoon'
 */
export function featCategoryKey(category: string): string {
  const [head, ...rest] = category.trim().toLowerCase().split(/\s+/);
  return (
    head + rest.map((word) => word[0].toUpperCase() + word.slice(1)).join('')
  );
}
