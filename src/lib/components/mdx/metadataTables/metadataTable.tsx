/**
 * @fileoverview Filterable, sortable, paginated table component for metadata display.
 * @description Accepts any JSON structure with configurable column definitions and value extraction.
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

import { LazyPrefetchLink } from '@/lib/components/lazyPrefetchLink';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';
import { FilterSelect, NumericInput } from '../../ui';
import styles from './metadataTable.module.scss';
import { useAspectsColumn } from './useAspectsColumn';

import type {
  ColumnConfig,
  FilterState,
  MetadataRow,
  MetadataTableProps,
  SortDirection,
} from './metadataTable.types';

export type { ColumnConfig, MetadataRow } from './metadataTable.types';

/**
 * Filterable, sortable, paginated table for metadata display.
 *
 * @description Client component providing text search, per-column filtering
 * (text/select/range), column sort, pagination, and click-to-navigate rows.
 * Uses config functions (getValue, compareValues, render) for data-specific logic.
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
  columns: ownColumns,
  basePath = '',
  defaultSort,
  locale = 'en',
  pageSize = 50,
  getRowSlug = (row) => row.slug,
  searchKeys = ['title'],
  onRowSelect,
  size = 'md',
  rowAction,
}: MetadataTableProps) {
  const t = useTranslations('tables.common');
  const tFilters = useTranslations('tables.filters');
  const tCommon = useTranslations('common');

  const columns = useAspectsColumn(ownColumns, data, size);
  const [sortKey, setSortKey] = useState<string | null>(
    defaultSort?.key || null,
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    defaultSort?.direction || null,
  );
  const [filters, setFilters] = useState<FilterState>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Returns column.getValue(row) if defined, else row[column.key].
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
  const getCellValue = useCallback((row: MetadataRow, column: ColumnConfig) => {
    return column.getValue ? column.getValue(row) : row[column.key];
  }, []);

  /**
   * Applies global search and column-specific filters to the dataset.
   *
   * @function filteredData
   * @returns {MetadataRow[]} Filtered array of data rows
   *
   * @description Global search: case-insensitive substring match on any searchKey.
   * Column filters by filterType: 'text' substring, 'select' exact, 'range' numeric min/max, 'multiselect' array intersection.
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
          if (Array.isArray(cellValue) && Array.isArray(value)) {
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
          const numValue = parseFloat(String(cellValue));
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
  }, [data, filters, searchTerm, columns, searchKeys, getCellValue]);

  /**
   * Sorts filtered dataset by current sort state.
   *
   * @function sortedData
   * @returns {MetadataRow[]} Sorted array of filtered data rows
   *
   * @description Uses column.compareValues if defined, else default (<, >, ===).
   * null/undefined sort last. Uses sortDirection ('asc' or 'desc').
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
  }, [filteredData, sortKey, sortDirection, columns, getCellValue]);

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
   * Cycles sort state on column header click: asc → desc → clear.
   *
   * @function handleSort
   * @param {string} key - Column key to sort by
   *
   * @description Clicking a different column resets to ascending.
   * Resets pagination to page 1.
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
   * Sets filter value for a column key. Resets pagination to page 1.
   *
   * @function handleFilterChange
   * @param {string} key - Column key being filtered
   * @param {*} value - Filter value (varies by filterType)
   */
  const handleFilterChange = (key: string, value: unknown) => {
    setFilters((prev: FilterState) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  /**
   * Resolves the navigation URL for a row.
   *
   * @function getRowHref
   * @param {MetadataRow} row - Data row to resolve
   * @returns {{ href: string; external: boolean }} Resolved href and whether it is external
   *
   * @description External http/https row.link returns external. Internal link returns
   * /{locale}{link} (prefixes /library if not already). Otherwise builds
   * /{locale}/library/{basePath}/{slug}, preserving any '#hash'.
   *
   * @example
   * // Internal link: { link: "/library/spells/fireball" } → /en/library/spells/fireball
   * // External link: { link: "http://dnd5e.wikidot.com/spell:fireball" } → external
   * // Legacy slug: { slug: "fireball" } → /en/library/spells/fireball
   */
  const getRowHref = useCallback(
    (row: MetadataRow): { href: string; external: boolean } => {
      if (row.link) {
        const isExternalLink =
          row.link.startsWith('http://') || row.link.startsWith('https://');

        if (isExternalLink) {
          return { href: row.link, external: true };
        }

        const targetPath = row.link.startsWith('/library')
          ? `/${locale}${row.link}`
          : `/${locale}/library${row.link}`;

        return { href: targetPath, external: false };
      }

      const slug = getRowSlug(row);
      const [slugPath, hash] = slug.includes('#')
        ? slug.split('#')
        : [slug, null];

      const targetPath = slugPath.startsWith('/')
        ? `/${locale}/library${slugPath}`
        : `/${locale}/library${basePath}/${slugPath}`;

      const finalPath = hash ? `${targetPath}#${hash}` : targetPath;

      return { href: finalPath, external: false };
    },
    [basePath, getRowSlug, locale],
  );

  /**
   * Returns filter dropdown options for a column.
   *
   * @function getFilterOptions
   * @param {ColumnConfig} column - Column configuration
   * @returns {string[]} Sorted array of unique filter options
   *
   * @description Returns column.getFilterOptions(data) if defined. Otherwise derives
   * unique string values from rows (flattening arrays) and sorts by column.filterSortOrder
   * if provided, else alphabetically.
   */
  const getFilterOptions = useCallback(
    (column: ColumnConfig): string[] => {
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
      const options = Array.from(uniqueValues);

      if (column.filterSortOrder) {
        return options.sort(
          (a, b) =>
            (column.filterSortOrder![a] ?? 999) -
            (column.filterSortOrder![b] ?? 999),
        );
      }
      return options.sort();
    },
    [data, getCellValue],
  );

  /**
   * Maps filter options to { value, label } pairs for FilterSelect.
   */
  const getSelectOptions = useCallback(
    (column: ColumnConfig) => {
      const options = getFilterOptions(column);
      return options.map((opt) => ({ value: opt, label: opt }));
    },
    [getFilterOptions],
  );

  return (
    <div
      className={`${styles.metadataTable} ${size === 's' ? styles.sizeS : ''}`}>
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
                {column.filterType === 'text' ? (
                  <label htmlFor={`filter-${column.key}`}>{column.label}</label>
                ) : (
                  <span
                    id={`filter-label-${column.key}`}
                    className={styles.filterLabel}>
                    {column.label}
                  </span>
                )}
                {column.filterType === 'select' && (
                  <FilterSelect
                    id={`filter-${column.key}`}
                    value={filters[column.key] || ''}
                    onChange={(value) =>
                      handleFilterChange(column.key, value || undefined)
                    }
                    options={getSelectOptions(column)}
                    placeholder={tCommon('all')}
                    ariaLabel={column.label}
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
                  <div
                    className={styles.rangeFilter}
                    role='group'
                    aria-labelledby={`filter-label-${column.key}`}>
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
              {rowAction && (
                <th className={styles.rowActionHead} aria-label={rowAction.label} />
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => {
              const { href, external } = onRowSelect
                ? { href: '', external: false }
                : getRowHref(row);
              const rowKey = getRowSlug(row);
              return (
                <tr key={rowKey} className={styles.clickableRow}>
                  {columns.map((column) => {
                    const value = getCellValue(row, column);
                    const content = column.render
                      ? column.render(value, row)
                      : String(value ?? '-');
                    return (
                      <td key={`${rowKey}-${column.key}`}>
                        {onRowSelect ? (
                          <button
                            type='button'
                            className={styles.rowButton}
                            onClick={() => onRowSelect(row)}>
                            {content}
                          </button>
                        ) : external ? (
                          <a
                            href={href}
                            target='_blank'
                            rel='noopener noreferrer'
                            className={styles.rowLink}>
                            {content}
                          </a>
                        ) : (
                          <LazyPrefetchLink
                            href={href}
                            className={styles.rowLink}>
                            {content}
                          </LazyPrefetchLink>
                        )}
                      </td>
                    );
                  })}
                  {rowAction && (
                    <td className={styles.rowActionCell}>
                      <button
                        type='button'
                        className={styles.rowActionButton}
                        onClick={() => rowAction.onSelect(row)}
                        aria-label={rowAction.label}
                        title={rowAction.label}>
                        {rowAction.icon ?? '↗'}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
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
