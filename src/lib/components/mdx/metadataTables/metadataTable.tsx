/**
 * @fileoverview Filterable, sortable, paginated table component for metadata display.
 * @description Accepts any JSON structure with configurable column definitions and value extraction.
 *
 * @module lib/components/mdx/metadataTables/metadataTable
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
import { useScopedSearch } from '@/modules/search';
import { FilterSelect, NumericInput } from '../../ui';
import {
  DataTable,
  type DataTableCell,
  type DataTableColumn,
  type DataTableRow,
} from '../../ui/dataTable';
import styles from './metadataTable.module.scss';
import {
  filterOptionsFor,
  getCellValue,
  resolveRowHref,
  rowMatchesAspects,
  rowMatchesColumnFilters,
} from './metadataTableLogic';
import { MetadataTableSearch } from './metadataTableSearch';
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
  searchScope,
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
  const [aspectFilters, setAspectFilters] = useState<string[]>([]);

  /** Narrowing the rows invalidates whatever page the reader was on. */
  const handleSearchChange = useCallback((term: string, aspects: string[]) => {
    setSearchTerm(term);
    setAspectFilters(aspects);
    setCurrentPage(1);
  }, []);

  /**
   * Index-backed search scope
   */
  const slugOf = useCallback(
    (row: MetadataRow) => getRowSlug(row).split('#')[0],
    [getRowSlug],
  );
  const rowSlugs = useMemo(() => new Set(data.map(slugOf)), [data, slugOf]);
  const { ranks, loading: searchLoading } = useScopedSearch(searchTerm, {
    locale,
    types: searchScope ? [searchScope] : undefined,
    slugs: rowSlugs,
  });

  /**
   * Applies global search and column-specific filters to the dataset.
   *
   * @function filteredData
   * @returns {MetadataRow[]} Filtered array of data rows
   *
   * @description Global search
   */
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (!rowMatchesAspects(row, aspectFilters)) return false;

      if (searchTerm) {
        if (ranks && ranks.size > 0) {
          if (!ranks.has(slugOf(row))) return false;
        } else {
          const searchLower = searchTerm.toLowerCase();
          const matchesSearch = searchKeys.some((key) => {
            const value = row[key];
            return value && String(value).toLowerCase().includes(searchLower);
          });
          if (!matchesSearch) return false;
        }
      }

      return rowMatchesColumnFilters(row, filters, columns);
    });
  }, [
    data,
    filters,
    aspectFilters,
    searchTerm,
    ranks,
    slugOf,
    columns,
    searchKeys,
  ]);

  /**
   * Sorts filtered dataset by current sort state.
   *
   * @function sortedData
   * @returns {MetadataRow[]} Sorted array of filtered data rows
   *
   * @description Uses column.compareValues if defined, else default (<, >, ===).
   */
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) {
      if (ranks && ranks.size > 0 && searchTerm) {
        return [...filteredData].sort(
          (a, b) =>
            (ranks.get(slugOf(a)) ?? Number.MAX_SAFE_INTEGER) -
            (ranks.get(slugOf(b)) ?? Number.MAX_SAFE_INTEGER),
        );
      }
      return filteredData;
    }

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
  }, [
    filteredData,
    sortKey,
    sortDirection,
    ranks,
    searchTerm,
    slugOf,
    columns,
  ]);

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
   * Cycles sort state on column header click
   *
   * @function handleSort
   * @param {string} key - Column key to sort by
   *
   * @description Clicking a different column resets to ascending.
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
   * Sets filter value for a column key.
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
   * Resolves the navigation URL for a row via `resolveRowHref`.
   *
   * @function getRowHref
   * @param {MetadataRow} row - Data row to resolve
   * @returns {{ href: string; external: boolean }} Resolved href and whether it is external
   */
  const getRowHref = useCallback(
    (row: MetadataRow): { href: string; external: boolean } =>
      resolveRowHref(row, { locale, basePath, getRowSlug }),
    [basePath, getRowSlug, locale],
  );

  /**
   * Maps a column's filter options to { value, label } pairs for FilterSelect.
   */
  const getSelectOptions = useCallback(
    (column: ColumnConfig) =>
      filterOptionsFor(column, data).map((opt) => ({
        value: opt,
        label: opt,
      })),
    [data],
  );

  const tableColumns: DataTableColumn[] = [
    ...columns.map(
      (column): DataTableColumn => ({
        key: column.key,
        header: (
          <span className={styles.headerContent}>
            <span>{column.label}</span>
            {column.sortable !== false && sortKey === column.key && (
              <span className={styles.sortIndicator}>
                {sortDirection === 'asc'
                  ? t('sortAscending')
                  : t('sortDescending')}
              </span>
            )}
          </span>
        ),
        className: column.sortable !== false ? styles.sortable : undefined,
        width: column.width,
        onHeaderClick:
          column.sortable !== false ? () => handleSort(column.key) : undefined,
        sort:
          sortKey === column.key
            ? sortDirection === 'asc'
              ? 'ascending'
              : 'descending'
            : 'none',
      }),
    ),
    ...(rowAction
      ? [
          {
            key: 'row-action',
            header: '',
            className: styles.rowActionHead,
            ariaLabel: rowAction.label,
          },
        ]
      : []),
  ];

  const tableRows: DataTableRow[] = paginatedData.map((row) => {
    const { href, external } = onRowSelect
      ? { href: '', external: false }
      : getRowHref(row);
    const rowKey = getRowSlug(row);
    const cells: DataTableCell[] = columns.map((column) => {
      const value = getCellValue(row, column);
      const content = column.render
        ? column.render(value, row)
        : String(value ?? '-');
      if (onRowSelect) {
        return (
          <button
            type='button'
            className={styles.rowButton}
            onClick={() => onRowSelect(row)}>
            {content}
          </button>
        );
      }
      if (external) {
        return (
          <a
            href={href}
            target='_blank'
            rel='noopener noreferrer'
            className={styles.rowLink}>
            {content}
          </a>
        );
      }
      return (
        <LazyPrefetchLink href={href} className={styles.rowLink}>
          {content}
        </LazyPrefetchLink>
      );
    });
    if (rowAction) {
      cells.push({
        content: (
          <button
            type='button'
            className={styles.rowActionButton}
            onClick={() => rowAction.onSelect(row)}
            aria-label={rowAction.label}
            title={rowAction.label}>
            {rowAction.icon ?? '↗'}
          </button>
        ),
        className: styles.rowActionCell,
      });
    }
    return { key: rowKey, className: styles.clickableRow, cells };
  });

  return (
    <div
      className={`${styles.metadataTable} ${size === 's' ? styles.sizeS : ''}`}>
      <div className={styles.controls}>
        <MetadataTableSearch
          value={searchTerm}
          aspects={aspectFilters}
          onChange={handleSearchChange}
          locale={locale}
          loading={searchLoading}
        />

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
                    searchable={column.searchableFilter}
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

      <DataTable
        columns={tableColumns}
        rows={tableRows}
        className={
          ownColumns.some((column) => column.width)
            ? `${styles.table} ${styles.fixedLayout}`
            : styles.table
        }
        wrapperClassName={styles.tableWrapper}
      />

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
