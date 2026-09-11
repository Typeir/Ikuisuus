/**
 * @fileoverview Turns a metadata sidecar into Pagefind meta and facet filters.
 * @description Pagefind takes strings and string arrays; a sidecar holds
 * numbers, lists and nested aspect tags
 *
 * @module scripts/search/recordFilters
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-10
 */

/** Shape of an aspect token */
const ASPECT_TOKEN = /^[a-z][a-z0-9-]*(:[a-z0-9-]+)+$/;

/** Sidecar fields copied straight into a facet filter. */
const TAG_FIELDS = ['school', 'cr', 'category'];

/**
 * Splits aspect tags into one filter per group.
 *
 * @param {unknown} tags - The metadata `tags` value
 * @param {Record<string, string[]>} filters - Filter map, mutated in place
 * @returns {void}
 */
export function assignAspectFilters(
  tags: unknown,
  filters: Record<string, string[]>,
): void {
  if (!Array.isArray(tags)) return;

  for (const tag of tags) {
    if (typeof tag !== 'string') continue;

    const lower = tag.toLowerCase();
    if (!ASPECT_TOKEN.test(lower)) continue;

    const boundary = lower.lastIndexOf(':');
    const field = lower.slice(0, boundary).replace(/:/g, '-');
    const value = lower.slice(boundary + 1);

    if (!filters[field]) filters[field] = [];
    if (!filters[field].includes(value)) filters[field].push(value);
  }
}

/**
 * Converts metadata fields to Pagefind meta (string values only).
 *
 * @param {Record<string, unknown>} metadata - Parsed metadata record
 * @returns {Record<string, string>} String-keyed meta map
 */
export function metadataToMeta(
  metadata: Record<string, unknown>,
): Record<string, string> {
  const meta: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (typeof value === 'string') {
      meta[key] = value;
    } else if (typeof value === 'number') {
      meta[key] = String(value);
    } else if (Array.isArray(value)) {
      meta[key] = value
        .filter((v): v is string => typeof v === 'string')
        .join(', ');
    }
  }
  return meta;
}

/**
 * Converts metadata fields to Pagefind filters (string arrays).
 *
 * @param {Record<string, unknown>} metadata - Parsed metadata record
 * @param {string} contentType - Content type key
 * @returns {Record<string, string[]>} Facet filter map
 */
export function metadataToFilters(
  metadata: Record<string, unknown>,
  contentType: string,
): Record<string, string[]> {
  const filters: Record<string, string[]> = {
    type: [contentType],
  };

  for (const field of TAG_FIELDS) {
    const value = metadata[field];
    if (Array.isArray(value)) {
      filters[field] = value
        .filter((v): v is string => typeof v === 'string')
        .map((v) => v.toLowerCase());
    } else if (typeof value === 'string') {
      filters[field] = [value.toLowerCase()];
    } else if (typeof value === 'number') {
      filters[field] = [String(value)];
    }
  }

  assignAspectFilters(metadata.tags, filters);

  if (Array.isArray(metadata.features)) {
    for (const feature of metadata.features) {
      if (feature && typeof feature === 'object') {
        assignAspectFilters((feature as Record<string, unknown>).tags, filters);
      }
    }
  }

  return filters;
}
