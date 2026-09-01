/**
 * @fileoverview Search domain types
 * @module modules/search/domain/types
 * @description Shared, JSON-safe contracts for the search system: index/result
 * record, query, result, facet, and response shapes.
 *
 * @author Typeir
 * @version 1.0.0
 * @since 8.0.0
 */

import type { SearchContentType } from './contentTypes';

/**
 * A single searchable record as stored in the index and returned to the client.
 *
 * @interface SearchRecord
 * @property {string} id - Stable unique identifier (e.g. `{type}:{locale}:{slug}`)
 * @property {SearchContentType} type - Content type group
 * @property {string} locale - Locale code (e.g. `en`)
 * @property {string} slug - URL-friendly identifier
 * @property {string} title - Display title
 * @property {string} link - Page-level link (e.g. `/en/library/monsters/aboleth`)
 * @property {string} [description] - Short prose description
 * @property {string} [snippet] - Highlighted excerpt (may contain `<mark>` tags)
 * @property {string[]} [tags] - Gameplay/lore tags
 * @property {string} [image] - Thumbnail image path
 * @property {Record<string, string | number>} [meta] - Type-specific display fields
 *   (e.g. `cr`, `level`, `school`, `size`, `rarity`)
 */
export interface SearchRecord {
  id: string;
  type: SearchContentType;
  locale: string;
  slug: string;
  title: string;
  link: string;
  description?: string;
  snippet?: string;
  tags?: string[];
  image?: string;
  meta?: Record<string, string | number>;
}

/**
 * A scored search result: a record plus relevance and match provenance.
 *
 * @interface SearchResult
 * @property {SearchRecord} record - The matched record
 * @property {number} score - Relevance score (higher is more relevant)
 * @property {string} [snippet] - Highlighted excerpt for this match
 * @property {string[]} [matchedFields] - Fields that contributed to the match
 */
export interface SearchResult {
  record: SearchRecord;
  score: number;
  snippet?: string;
  matchedFields?: string[];
}

/**
 * A single selectable value within a facet, with its result count.
 *
 * @interface SearchFacetValue
 * @property {string} value - The facet value (e.g. `Evocation`)
 * @property {number} count - Number of results carrying this value
 */
export interface SearchFacetValue {
  value: string;
  count: number;
}

/**
 * A facet (filterable dimension) with its available values.
 *
 * @interface SearchFacet
 * @property {string} field - Facet field name (e.g. `type`, `tags`, `school`)
 * @property {string} label - Human-readable facet label
 * @property {SearchFacetValue[]} values - Available values with counts
 */
export interface SearchFacet {
  field: string;
  label: string;
  values: SearchFacetValue[];
}

/**
 * The full response for a search query.
 *
 * @interface SearchResponse
 * @property {SearchResult[]} results - Matched, scored results (current page)
 * @property {number} total - Total number of matches across all pages
 * @property {SearchFacet[]} facets - Facets computed for the result set
 * @property {number} page - Current 1-based page number
 */
export interface SearchResponse {
  results: SearchResult[];
  total: number;
  facets: SearchFacet[];
  page: number;
}
