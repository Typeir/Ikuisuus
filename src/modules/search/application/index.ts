/**
 * @fileoverview Search application layer barrel
 * @module modules/search/application/index
 * @author Typeir
 * @version 1.0.0
 * @since 8.0.0
 */

export { useScopedSearch } from './useScopedSearch';
export type {
    ScopedSearchOptions,
    ScopedSearchState,
} from './useScopedSearch';
export { useSearch } from './useSearch';
export { useSearchFacets } from './useSearchFacets';

