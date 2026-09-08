/**
 * @fileoverview Pure row logic for MetadataTable
 *
 * @module lib/components/mdx/metadataTables/metadataTableLogic
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { LIBRARY_SEGMENT } from '@/lib/constants/content';

import type {
  ColumnConfig,
  FilterState,
  MetadataRow,
} from './metadataTable.types';

/**
 * Returns `column.getValue(row)` if defined, else `row[column.key]`.
 *
 * @param {MetadataRow} row - Data row
 * @param {ColumnConfig} column - Column configuration
 * @returns {unknown} Extracted value for filtering/sorting/display
 *
 * @example
 * getCellValue({ name: 'Item' }, { key: 'name', label: 'Name' }); // 'Item'
 */
export function getCellValue(row: MetadataRow, column: ColumnConfig): unknown {
  return column.getValue ? column.getValue(row) : row[column.key];
}

/**
 * Whether a row passes every active column filter.
 *
 * @param {MetadataRow} row - Data row
 * @param {FilterState} filters - Active filter values keyed by column key
 * @param {ColumnConfig[]} columns - Column configurations
 * @returns {boolean} True when the row survives all filters
 */
export function rowMatchesColumnFilters(
  row: MetadataRow,
  filters: FilterState,
  columns: ColumnConfig[],
): boolean {
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
      const filterValueStr = String(value).toLowerCase();
      if (Array.isArray(cellValue)) {
        const hasValue = cellValue.some(
          (entry) => String(entry).toLowerCase() === filterValueStr,
        );
        if (!hasValue) return false;
      } else {
        const cellValueStr = String(cellValue || '').toLowerCase();
        if (cellValueStr !== filterValueStr) return false;
      }
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
}

/**
 * Whether a row carries every aspect the table is filtered by.
 *
 * @param {MetadataRow} row - Data row
 * @param {string[]} aspects - Active `group:value` filters
 * @returns {boolean} True when the row's tags cover all of them
 *
 * @example
 * rowMatchesAspects({ tags: ['condition:bleeding'] }, ['condition:bleeding']); // true
 */
export function rowMatchesAspects(
  row: MetadataRow,
  aspects: string[],
): boolean {
  if (aspects.length === 0) return true;
  const tags = Array.isArray(row.tags)
    ? (row.tags as unknown[]).map((tag) => String(tag).toLowerCase())
    : [];
  return aspects.every((aspect) => tags.includes(aspect.toLowerCase()));
}

/**
 * Options for {@link resolveRowHref}.
 *
 * @interface RowHrefOptions
 * @property {string} locale - Locale prefix for internal routes
 * @property {string} basePath - Base library path for slug-built routes
 * @property {(row: MetadataRow) => string} getRowSlug - Slug extractor
 */
export interface RowHrefOptions {
  locale: string;
  basePath: string;
  getRowSlug: (row: MetadataRow) => string;
}

/**
 * Resolves the navigation target for a row.
 *
 * @param {MetadataRow} row - Data row to resolve
 * @param {RowHrefOptions} opts - Locale, base path and slug extractor
 * @returns {{ href: string; external: boolean }} Resolved href and externality
 *
 * @example
 * resolveRowHref({ link: '/library/spells/fireball' }, opts);
 * // { href: '/en/library/spells/fireball', external: false }
 */
export function resolveRowHref(
  row: MetadataRow,
  opts: RowHrefOptions,
): { href: string; external: boolean } {
  const { locale, basePath, getRowSlug } = opts;

  if (row.link) {
    const isExternalLink =
      row.link.startsWith('http://') || row.link.startsWith('https://');

    if (isExternalLink) {
      return { href: row.link, external: true };
    }

    const targetPath = row.link.startsWith(`/${LIBRARY_SEGMENT}`)
      ? `/${locale}${row.link}`
      : `/${locale}/library${row.link}`;

    return { href: targetPath, external: false };
  }

  const slug = getRowSlug(row);
  const [slugPath, hash] = slug.includes('#') ? slug.split('#') : [slug, null];

  const targetPath = slugPath.startsWith('/')
    ? `/${locale}/library${slugPath}`
    : `/${locale}/library${basePath}/${slugPath}`;

  const finalPath = hash ? `${targetPath}#${hash}` : targetPath;

  return { href: finalPath, external: false };
}

/**
 * Filter dropdown options for a column
 *
 * @param {ColumnConfig} column - Column configuration
 * @param {MetadataRow[]} rows - Dataset to derive options from
 * @returns {string[]} Sorted unique filter options
 */
export function filterOptionsFor(
  column: ColumnConfig,
  rows: MetadataRow[],
): string[] {
  if (column.getFilterOptions) {
    return column.getFilterOptions(rows);
  }

  const uniqueValues = new Set<string>();
  rows.forEach((row) => {
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
}
