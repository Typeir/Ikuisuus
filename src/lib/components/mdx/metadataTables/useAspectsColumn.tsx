/**
 * @fileoverview Aspects column for MetadataTable
 * @description Appends an Aspects column when rows carry `tags`.
 *
 * @module lib/components/mdx/metadataTables/useAspectsColumn
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { AspectGlyphs } from '@/modules/library/presentation/components/Aspects/AspectGlyphs';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import type { ColumnConfig, MetadataRow } from './metadataTable.types';

/**
 * Prefix of the bookkeeping aspects every row carries, which say nothing that
 * would narrow a table.
 */
const META_ASPECT_PREFIX = 'meta:';

/**
 * Tags of a row, when it has any.
 *
 * @param {MetadataRow} row - Table row
 * @returns {string[] | undefined} The row aspects
 */
function tagsOf(row: MetadataRow): string[] | undefined {
  return Array.isArray(row.tags) ? (row.tags as string[]) : undefined;
}

/**
 * Returns the columns with an Aspects column appended when any row carries
 * tags and the caller did not already define a `tags` column.
 *
 * @param {ColumnConfig[]} columns - Caller columns
 * @param {MetadataRow[]} data - Table rows
 * @param {'md' | 's'} size - Table density; caps glyphs at 8 or 5
 * @returns {ColumnConfig[]} Columns to render
 */
export function useAspectsColumn(
  columns: ColumnConfig[],
  data: MetadataRow[],
  size: 'md' | 's',
): ColumnConfig[] {
  const t = useTranslations('tables.common');
  const hasAspects = useMemo(
    () => data.some((row) => (tagsOf(row)?.length ?? 0) > 0),
    [data],
  );
  return useMemo<ColumnConfig[]>(() => {
    if (!hasAspects || columns.some((c) => c.key === 'tags')) return columns;
    return [
      ...columns,
      {
        key: 'tags',
        label: t('aspects'),
        sortable: false,
        filterable: true,
        filterType: 'select',
        searchableFilter: true,
        width: size === 's' ? '10%' : '14%',
        getValue: (row) => tagsOf(row) ?? [],
        getFilterOptions: (rows) =>
          Array.from(
            new Set(
              rows.flatMap((row) =>
                (tagsOf(row) ?? []).filter(
                  (tag) => !tag.startsWith(META_ASPECT_PREFIX),
                ),
              ),
            ),
          ).sort(),
        render: (_value, row) => (
          <AspectGlyphs
            tags={tagsOf(row)}
            inert
            wrap
            max={size === 's' ? 4 : 6}
          />
        ),
      },
    ];
  }, [columns, hasAspects, t, size]);
}
