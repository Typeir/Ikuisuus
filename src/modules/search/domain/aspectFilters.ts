/**
 * @fileoverview Aspect Query Parameters
 * @description Translates `?aspect=` parameters into Pagefind filters.
 *
 * Colons in aspects are flattened to dashes in filter keys; splitting on the
 * last colon preserves nested group and value shapes.
 *
 * @module modules/search/domain/aspectFilters
 * @version 1.0.0
 * @author Typeir
 * @since 2026-08-05
 */

/** Shape Pagefind expects: one array of accepted values per filter key. */
export type PagefindFilters = Record<string, string[]>;

/**
 * Converts aspect tokens into Pagefind filters.
 *
 * @param {string[]} aspects - Raw `aspect` query parameters
 * @returns {PagefindFilters} Filters keyed by group, empty when nothing parses
 */
export function aspectsToFilters(aspects: string[]): PagefindFilters {
  const filters: PagefindFilters = {};

  for (const aspect of aspects) {
    const token = aspect.trim();
    const boundary = token.lastIndexOf(':');
    if (boundary <= 0 || boundary === token.length - 1) continue;

    const key = token.slice(0, boundary).replace(/:/g, '-');
    const value = token.slice(boundary + 1);

    if (!filters[key]) filters[key] = [];
    if (!filters[key].includes(value)) filters[key].push(value);
  }

  return filters;
}

/**
 * Whether any filter is actually set.
 *
 * @param {PagefindFilters} filters - Parsed filters
 * @returns {boolean} True when at least one group carries a value
 */
export function hasFilters(filters: PagefindFilters): boolean {
  return Object.values(filters).some((values) => values.length > 0);
}

/**
 * Restores the aspect tokens a filter set came from.
 *
 * @param {PagefindFilters} filters - Parsed filters
 * @returns {string[]} Aspect tokens in `group:value` form
 */
export function filtersToAspects(filters: PagefindFilters): string[] {
  return Object.entries(filters).flatMap(([key, values]) =>
    values.map((value) => `${key.replace(/-/g, ':')}:${value}`),
  );
}
