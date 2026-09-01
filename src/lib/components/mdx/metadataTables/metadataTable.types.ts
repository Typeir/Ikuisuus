/**
 * @fileoverview MetadataTable type definitions
 * @description Row shape, column configuration, sort direction, filter state, and
 * component props for the generic MetadataTable.
 *
 * @module lib/components/mdx/metadataTables/metadataTable.types
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import type { SearchContentType } from '@/modules/search/domain/contentTypes';

/**
 * A single metadata row; any key mapped to any value.
 * @typedef {Object} MetadataRow
 * @property {*} [key] - Any property with any value type
 */
/* health:check-ignore-nextline antipatterns.no-explicit-any */
export type MetadataRow = Record<string, any>;

/* health:check-ignore-nextline antipatterns.no-explicit-any */
export type FilterState = Record<string, any>;

/**
 * Column display and interaction config.
 * @typedef {Object} ColumnConfig
 * @property {string} key - Unique identifier for the column
 * @property {string} label - Display text for column header
 * @property {boolean} [sortable=true] - Whether column can be sorted
 * @property {boolean} [filterable=false] - Whether to show filter control
 * @property {Function} [render] - Custom render function for cell display
 * @property {'text'|'select'|'multiselect'|'range'} [filterType] - Type of filter UI control
 * @property {Function} [getFilterOptions] - Function to generate filter dropdown options
 * @property {Function} [getValue] - Extracts value from row for filtering/sorting (handles nested data)
 * @property {Function} [compareValues] - Custom comparison logic for sorting
 * @property {Record<string, number>} [filterSortOrder] - Sort order map for dropdown options (e.g., RARITY_SORT_ORDER)
 */
export type ColumnConfig = {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: unknown, row: MetadataRow) => React.ReactNode;
  filterType?: 'text' | 'select' | 'multiselect' | 'range';
  getFilterOptions?: (rows: MetadataRow[]) => string[];
  getValue?: (row: MetadataRow) => unknown;
  compareValues?: (a: unknown, b: unknown) => number;
  filterSortOrder?: Record<string, number>;
};

/**
 * Sort direction indicator.
 * @typedef {('asc'|'desc'|null)} SortDirection
 */
export type SortDirection = 'asc' | 'desc' | null;

/**
 * Props for MetadataTable component.
 * @typedef {Object} MetadataTableProps
 * @property {MetadataRow[]} data - Array of data rows to display
 * @property {ColumnConfig[]} columns - Column configuration array
 * @property {string} [basePath=''] - Base URL path for row navigation
 * @property {Object} [defaultSort] - Initial sort configuration
 * @property {string} defaultSort.key - Column key to sort by
 * @property {SortDirection} defaultSort.direction - Sort direction
 * @property {string} [locale='en'] - Current locale for URL construction
 * @property {number} [pageSize=50] - Number of rows per page
 * @property {Function} [getRowSlug] - Function to extract slug from row data
 * @property {string[]} [searchKeys=['title']] - Row properties to search across; the fallback when the search index cannot answer
 * @property {SearchContentType} [searchScope] - Content type the rows belong to; scopes the index-backed search
 * @property {Function} [onRowSelect] - When provided, rows render as buttons that call this with the row instead of navigating
 * @property {'md'|'s'} [size='md'] - Density variant; 's' renders a compact table (smaller font + tighter rows/columns) for embedded contexts
 * @property {{ label: string; icon?: React.ReactNode; onSelect: (row: MetadataRow) => void }} [rowAction] - Optional trailing per-row action button, rendered in its own cell
 */
export type MetadataTableProps = {
  data: MetadataRow[];
  columns: ColumnConfig[];
  basePath?: string;
  defaultSort?: { key: string; direction: SortDirection };
  locale?: string;
  pageSize?: number;
  getRowSlug?: (row: MetadataRow) => string;
  searchKeys?: string[];
  searchScope?: SearchContentType;
  onRowSelect?: (row: MetadataRow) => void;
  size?: 'md' | 's';
  rowAction?: {
    label: string;
    icon?: React.ReactNode;
    onSelect: (row: MetadataRow) => void;
  };
};
