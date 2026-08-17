/**
 * @fileoverview Aspects column for MetadataTable
 * @description Appends an Aspects column to any table whose rows carry
 * `tags`, so no table builder has to know about it. Cells render inert glyphs
 * because the whole cell is already a link or button.
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
 * @param {'md' | 's'} size - Table density; the compact table caps at fewer glyphs
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
        getValue: (row) => tagsOf(row)?.join(' ') ?? '',
        render: (_value, row) => (
          <AspectGlyphs tags={tagsOf(row)} inert max={size === 's' ? 5 : 8} />
        ),
      },
    ];
  }, [columns, hasAspects, t, size]);
}
