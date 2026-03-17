/**
 * @fileoverview Generic filterable and sortable table component for metadata display.
 * @description Provides interactive data browsing with search, column filtering, sorting,
 * and pagination. Fully data-agnostic - accepts any JSON structure with configurable
 * column definitions and value extraction logic.
 *
 * @module metadataTable
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react Client-side interactivity hooks
 * @requires next/navigation Client-side routing
 * @requires ./metadataTable.module.scss Component styles
 *
 * @example
 * ```tsx
 * <MetadataTable
 *   data={jsonData}
 *   columns={[
 *     { key: 'name', label: 'Name', sortable: true },
 *     { key: 'level', label: 'Level', filterType: 'range' }
 *   ]}
 *   basePath="/content"
 *   searchKeys={['name', 'description']}
 * />
 * ```
 */

'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { FilterSelect, NumericInput } from '../../ui';
import styles from './metadataTable.module.scss';

/**
 * Represents a single row of metadata - can contain any JSON structure.
 * @typedef {Object} MetadataRow
 * @property {*} [key] - Any property with any value type
 */
export type MetadataRow = Record<string, any>;

/**
 * Configuration for a single table column, defining display and interaction behavior.
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
 */
export type ColumnConfig = {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: MetadataRow) => React.ReactNode;
  filterType?: 'text' | 'select' | 'multiselect' | 'range';
  getFilterOptions?: (rows: MetadataRow[]) => string[];
  getValue?: (row: MetadataRow) => any;
  compareValues?: (a: any, b: any) => number;
};

/**
 * Sort direction indicator.
 * @typedef {('asc'|'desc'|null)} SortDirection
 */
type SortDirection = 'asc' | 'desc' | null;

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
 * @property {string[]} [searchKeys=['title']] - Row properties to search across
 */
type MetadataTableProps = {
  data: MetadataRow[];
  columns: ColumnConfig[];
  basePath?: string;
  defaultSort?: { key: string; direction: SortDirection };
  locale?: string;
  pageSize?: number;
  getRowSlug?: (row: MetadataRow) => string;
  searchKeys?: string[];
};

/**
 * Generic filterable, sortable, paginated table component for metadata display.
 *
 * @description This client component provides interactive data browsing with:
 * - Global text search across configured keys
 * - Per-column filtering (text, select, range inputs)
 * - Click-to-sort on column headers (ascending/descending/none)
 * - Pagination for large datasets
 * - Click-to-navigate row interaction
 *
 * The component is fully data-agnostic - it accepts any JSON structure and uses
 * configuration functions (getValue, compareValues, render) to handle data-specific logic.
 *
 * @param {MetadataTableProps} props - Component props
 * @param {MetadataRow[]} props.data - Array of data rows to display
 * @param {ColumnConfig[]} props.columns - Column configuration array
 * @param {string} [props.basePath=''] - Base URL path for row navigation
 * @param {{ key: string; direction: SortDirection }} [props.defaultSort] - Initial sort configuration
 * @param {string} [props.locale='en'] - Current locale for URL construction
 * @param {number} [props.pageSize=50] - Number of rows per page
 * @param {(row: MetadataRow) => string} [props.getRowSlug] - Function to extract slug from row data
 * @param {string[]} [props.searchKeys] - Row properties to search across
 * @returns {JSX.Element} Rendered interactive table with controls
 *
 * @example
 * ```tsx
 * // Basic usage with simple data
 * <MetadataTable
 *   data={[{ id: '1', name: 'Item 1', level: 5 }]}
 *   columns={[
 *     { key: 'name', label: 'Name' },
 *     { key: 'level', label: 'Level', filterType: 'range' }
 *   ]}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Advanced usage with nested data
 * <MetadataTable
 *   data={monsters}
 *   columns={[
 *     {
 *       key: 'ac',
 *       label: 'AC',
 *       getValue: (row) => row.armorClass?.value,
 *       compareValues: (a, b) => (a ?? 0) - (b ?? 0),
 *       filterType: 'range'
 *     }
 *   ]}
 *   getRowSlug={(row) => row.id}
 *   searchKeys={['name', 'description']}
 * />
 * ```
 */
export default function MetadataTable({
  data,
  columns,
  basePath = '',
  defaultSort,
  locale = 'en',
  pageSize = 50,
  getRowSlug = (row) => row.slug,
  searchKeys = ['title'],
}: MetadataTableProps) {
  const t = useTranslations('tables.common');
  const tFilters = useTranslations('tables.filters');
  const router = useRouter();
  const [sortKey, setSortKey] = useState<string | null>(
    defaultSort?.key || null,
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    defaultSort?.direction || null,
  );
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Extracts cell value from row data using column configuration.
   * Allows columns to define custom value extraction for nested objects.
   *
   * @function getCellValue
   * @param {MetadataRow} row - Data row
   * @param {ColumnConfig} column - Column configuration
   * @returns {*} Extracted value for filtering/sorting/display
   *
   * @example
   * ```typescript
   * // Without getValue - direct property access
   * getCellValue({ name: 'Item' }, { key: 'name' }) // Returns: 'Item'
   *
   * // With getValue - nested property extraction
   * getCellValue(
   *   { stats: { ac: { value: 18 } } },
   *   { key: 'ac', getValue: (row) => row.stats.ac.value }
   * ) // Returns: 18
   * ```
   */
  const getCellValue = (row: MetadataRow, column: ColumnConfig) => {
    return column.getValue ? column.getValue(row) : row[column.key];
  };

  /**
   * Applies global search and column-specific filters to dataset.
   * Memoized to prevent unnecessary recalculations on unrelated state changes.
   *
   * @function filteredData
   * @returns {MetadataRow[]} Filtered array of data rows
   *
   * @description Filtering logic:
   * 1. Global search: Checks if any configured searchKey contains the search term
   * 2. Column filters: Applies filter based on column's filterType:
   *    - 'text': Substring match (case-insensitive)
   *    - 'select': Exact value match
   *    - 'range': Numeric comparison (min/max)
   *    - 'multiselect': Array intersection check
   */
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = searchKeys.some((key) => {
          const value = row[key];
          return value && String(value).toLowerCase().includes(searchLower);
        });
        if (!matchesSearch) return false;
      }

      for (const [key, value] of Object.entries(filters)) {
        if (!value || (Array.isArray(value) && value.length === 0)) continue;

        const column = columns.find((c) => c.key === key);
        if (!column) continue;

        const cellValue = getCellValue(row, column);

        if (column.filterType === 'multiselect') {
          if (Array.isArray(cellValue)) {
            const hasMatch = value.some((filterVal: string) =>
              cellValue.some((cv) =>
                String(cv).toLowerCase().includes(filterVal.toLowerCase()),
              ),
            );
            if (!hasMatch) return false;
          }
        } else if (column.filterType === 'select') {
          const cellValueStr = String(cellValue || '').toLowerCase();
          const filterValueStr = String(value).toLowerCase();
          if (cellValueStr !== filterValueStr) return false;
        } else if (column.filterType === 'range') {
          const numValue = parseFloat(cellValue);
          if (isNaN(numValue)) return false;
          if (value.min !== undefined && numValue < value.min) return false;
          if (value.max !== undefined && numValue > value.max) return false;
        } else if (column.filterType === 'text' || !column.filterType) {
          const strValue = String(cellValue || '').toLowerCase();
          const filterStr = String(value).toLowerCase();
          if (!strValue.includes(filterStr)) return false;
        }
      }

      return true;
    });
  }, [data, filters, searchTerm, columns, searchKeys]);

  /**
   * Applies sorting to filtered dataset based on current sort state.
   * Memoized to prevent re-sorting when unrelated state changes.
   *
   * @function sortedData
   * @returns {MetadataRow[]} Sorted array of filtered data rows
   *
   * @description Sorting behavior:
   * - Uses column's compareValues function if provided
   * - Falls back to default comparison (<, >, ===)
   * - Handles null/undefined by pushing to end
   * - Respects sortDirection ('asc' or 'desc')
   */
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return filteredData;

    const sortColumn = columns.find((c) => c.key === sortKey);
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = getCellValue(a, sortColumn);
      const bVal = getCellValue(b, sortColumn);

      if (sortColumn.compareValues) {
        const comparison = sortColumn.compareValues(aVal, bVal);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDirection, columns]);

  /**
   * Pagination calculations.
   * @constant {number} totalPages - Total number of pages based on filtered/sorted data
   * @constant {MetadataRow[]} paginatedData - Current page slice of data
   */
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  /**
   * Handles column header click to cycle through sort states.
   *
   * @function handleSort
   * @param {string} key - Column key to sort by
   *
   * @description Sort cycle:
   * 1. First click: Sort ascending
   * 2. Second click: Sort descending
   * 3. Third click: Clear sort
   * Clicking a different column resets to ascending.
   * Resets pagination to page 1 when sort changes.
   */
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(
        sortDirection === 'asc'
          ? 'desc'
          : sortDirection === 'desc'
            ? null
            : 'asc',
      );
      if (sortDirection === 'desc') setSortKey(null);
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  /**
   * Updates filter state for a specific column.
   * Resets pagination to page 1 when filters change.
   *
   * @function handleFilterChange
   * @param {string} key - Column key being filtered
   * @param {*} value - Filter value (varies by filterType)
   */
  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev: Record<string, any>) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  /**
   * Handles row click to navigate to detail page.
   * Uses the 'link' field if available, otherwise constructs URL from slug.
   * External links (starting with http:// or https://) open in new tab.
   *
   * @function handleRowClick
   * @param {MetadataRow} row - Data row that was clicked
   *
   * @description Priority:
   * 1. If row.link exists and is external (http/https), open in new tab
   * 2. If row.link exists and is internal, navigate to /{locale}{link}
   * 3. Otherwise, construct URL: /{locale}/library{basePath}/{slug}
   *
   * @example
   * // Internal link: { link: "/library/spells/fireball" } → /en/library/spells/fireball
   * // External link: { link: "http://dnd5e.wikidot.com/spell:fireball" } → new tab
   * // Legacy slug: { slug: "fireball" } → /en/library/spells/fireball
   */
  const handleRowClick = (row: MetadataRow) => {
    if (row.link) {
      const isExternalLink =
        row.link.startsWith('http://') || row.link.startsWith('https://');

      if (isExternalLink) {
        window.open(row.link, '_blank', 'noopener,noreferrer');
        return;
      }

      const targetPath = row.link.startsWith('/library')
        ? `/${locale}${row.link}`
        : `/${locale}/library${row.link}`;

      router.push(targetPath);
      return;
    }

    const slug = getRowSlug(row);
    const [slugPath, hash] = slug.includes('#')
      ? slug.split('#')
      : [slug, null];

    const targetPath = slugPath.startsWith('/')
      ? `/${locale}/library${slugPath}`
      : `/${locale}/library${basePath}/${slugPath}`;

    const finalPath = hash ? `${targetPath}#${hash}` : targetPath;

    router.push(finalPath);
  };

  /**
   * Generates filter dropdown options for a column.
   * Uses column's getFilterOptions if defined, otherwise auto-generates from data.
   *
   * @function getFilterOptions
   * @param {ColumnConfig} column - Column configuration
   * @returns {string[]} Sorted array of unique filter options
   *
   * @description Auto-generation:
   * - Extracts values using getCellValue
   * - Flattens array values
   * - Removes duplicates
   * - Sorts alphabetically
   */
  const getFilterOptions = (column: ColumnConfig): string[] => {
    if (column.getFilterOptions) {
      return column.getFilterOptions(data);
    }

    const uniqueValues = new Set<string>();
    data.forEach((row) => {
      const value = getCellValue(row, column);
      if (Array.isArray(value)) {
        value.forEach((v) => uniqueValues.add(String(v)));
      } else if (value !== undefined && value !== null) {
        uniqueValues.add(String(value));
      }
    });
    return Array.from(uniqueValues).sort();
  };

  /**
   * Converts filter options to FilterSelect-compatible format.
   * Memoized function to avoid recreation on each render.
   */
  const getSelectOptions = useCallback(
    (column: ColumnConfig) => {
      const options = getFilterOptions(column);
      return options.map((opt) => ({ value: opt, label: opt }));
    },
    [getFilterOptions],
  );

  return (
    <div className={styles.metadataTable}>
      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <input
            type='text'
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filters}>
          {columns
            .filter((col) => col.filterable)
            .map((column) => (
              <div key={column.key} className={styles.filterGroup}>
                <label htmlFor={`filter-${column.key}`}>{column.label}</label>
                {column.filterType === 'select' && (
                  <FilterSelect
                    id={`filter-${column.key}`}
                    value={filters[column.key] || ''}
                    onChange={(value) =>
                      handleFilterChange(column.key, value || undefined)
                    }
                    options={getSelectOptions(column)}
                    placeholder={tFilters('allOption')}
                    size='sm'
                  />
                )}
                {column.filterType === 'text' && (
                  <input
                    id={`filter-${column.key}`}
                    type='text'
                    value={filters[column.key] || ''}
                    onChange={(e) =>
                      handleFilterChange(
                        column.key,
                        e.target.value || undefined,
                      )
                    }
                    className={styles.filterInput}
                  />
                )}
                {column.filterType === 'range' && (
                  <div className={styles.rangeFilter}>
                    <NumericInput
                      value={filters[column.key]?.min ?? null}
                      onChange={(val) =>
                        handleFilterChange(column.key, {
                          ...filters[column.key],
                          min: val ?? undefined,
                        })
                      }
                      placeholder={tFilters('minPlaceholder')}
                      size='sm'
                      aria-label={`${column.label} ${tFilters('minPlaceholder')}`}
                    />
                    <span>{tFilters('rangeSeparator')}</span>
                    <NumericInput
                      value={filters[column.key]?.max ?? null}
                      onChange={(val) =>
                        handleFilterChange(column.key, {
                          ...filters[column.key],
                          max: val ?? undefined,
                        })
                      }
                      placeholder={tFilters('maxPlaceholder')}
                      size='sm'
                      aria-label={`${column.label} ${tFilters('maxPlaceholder')}`}
                    />
                  </div>
                )}
              </div>
            ))}
        </div>

        <div className={styles.resultCount}>
          {filteredData.length !== data.length
            ? t('showingResultsFiltered', {
                current: paginatedData.length,
                total: filteredData.length,
                original: data.length,
              })
            : t('showingResults', {
                current: paginatedData.length,
                total: filteredData.length,
              })}
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={column.sortable !== false ? styles.sortable : ''}
                  onClick={() =>
                    column.sortable !== false && handleSort(column.key)
                  }>
                  <div className={styles.headerContent}>
                    <span>{column.label}</span>
                    {column.sortable !== false && sortKey === column.key && (
                      <span className={styles.sortIndicator}>
                        {sortDirection === 'asc'
                          ? t('sortAscending')
                          : t('sortDescending')}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => (
              <tr
                key={getRowSlug(row)}
                onClick={() => handleRowClick(row)}
                className={styles.clickableRow}>
                {columns.map((column) => {
                  const value = getCellValue(row, column);
                  return (
                    <td key={`${getRowSlug(row)}-${column.key}`}>
                      {column.render
                        ? column.render(value, row)
                        : String(value ?? '-')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={styles.paginationButton}>
            {t('previous')}
          </button>
          <span className={styles.pageInfo}>
            {t('pageInfo', { current: currentPage, total: totalPages })}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={styles.paginationButton}>
            {t('next')}
          </button>
        </div>
      )}
    </div>
  );
}
