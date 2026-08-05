/**
 * @fileoverview Aspect Query Parameters
 * @description Translates `?aspect=` parameters into Pagefind filters.
 *
 * Every aspect pill links to `/search?aspect=damage:fire`. Without this the
 * parameter is inert and the pills are decoration — they navigate somewhere that
 * ignores what they asked for.
 *
 * The index stores an aspect group as its own filter key with colons flattened
 * to dashes, so `meta:source:ikuisuus` is the value `ikuisuus` under the key
 * `meta-source`. Splitting on the *last* colon is what makes both shapes work
 * from one rule.
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
 * Several values of one group are collected into that group's array, which
 * Pagefind treats as OR — asking for `damage:fire` and `damage:frost` returns
 * pages with either. Two different groups are separate keys, which it treats as
 * AND, so adding an axis always narrows.
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
 * Restores the aspect tokens a filter set came from, for display and for
 * building the link that removes one.
 *
 * @param {PagefindFilters} filters - Parsed filters
 * @returns {string[]} Aspect tokens in `group:value` form
 */
export function filtersToAspects(filters: PagefindFilters): string[] {
  return Object.entries(filters).flatMap(([key, values]) =>
    values.map((value) => `${key.replace(/-/g, ':')}:${value}`),
  );
}
