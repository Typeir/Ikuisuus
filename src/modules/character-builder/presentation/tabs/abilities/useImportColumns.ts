/**
 * @fileoverview Import-tab column configs hook
 * @description Builds the per-tab MetadataTable column configurations for the
 * ability import panel (spells, heirlooms, trinkets, feats), reusing the shared
 * library-table column builders. Extracted from AbilityImportPanel to keep that
 * component within the file-length budget.
 *
 * @module modules/character-builder/presentation/tabs/abilities/useImportColumns
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import type { ColumnConfig } from '@/lib/components/mdx/metadataTables/metadataTable';
import { buildHeirloomColumns } from '@/modules/metadata-tables/presentation/HeirloomTable/HeirloomTable.columns';
import { buildTrinketColumns } from '@/modules/metadata-tables/presentation/TrinketTable/TrinketTable.columns';
import { useSpellColumns } from '@/modules/metadata-tables/presentation/useSpellColumns/useSpellColumns';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import type { ImportTab } from './abilityImportTypes';

/**
 * Returns the MetadataTable column configuration for each import tab.
 *
 * @function useImportColumns
 * @returns {Record<ImportTab, ColumnConfig[]>} Per-tab column configs
 */
export function useImportColumns(): Record<ImportTab, ColumnConfig[]> {
  const tCommon = useTranslations('common');
  const tHeirloomColumns = useTranslations('tables.heirlooms.columns');
  const tTrinketColumns = useTranslations('tables.trinkets.columns');
  const tFeatColumns = useTranslations('tables.feats.columns');
  const spells = useSpellColumns();
  const heirlooms = useMemo(
    () => buildHeirloomColumns(tHeirloomColumns, tCommon),
    [tHeirloomColumns, tCommon],
  );
  const trinkets = useMemo(
    () => buildTrinketColumns(tTrinketColumns),
    [tTrinketColumns],
  );
  const feats = useMemo<ColumnConfig[]>(
    () => [
      { key: 'title', label: tFeatColumns('feat'), sortable: true },
      {
        key: 'prerequisite',
        label: tFeatColumns('prerequisite'),
        sortable: true,
        getValue: (row) => (row.hasPrerequisite ? (row.prerequisite ?? '') : ''),
        render: (_value, row) =>
          row.hasPrerequisite ? (row.prerequisite ?? '—') : '—',
      },
      {
        key: 'multiSelect',
        label: tFeatColumns('repeatable'),
        sortable: true,
        filterable: true,
        filterType: 'select',
        getValue: (row) => (row.multiSelect ? tCommon('yes') : tCommon('no')),
        render: (_value, row) => (row.multiSelect ? tCommon('yes') : '—'),
      },
      {
        key: 'description',
        label: tFeatColumns('summary'),
        sortable: false,
        render: (value) => String(value ?? '—'),
      },
    ],
    [tFeatColumns, tCommon],
  );
  return { spells, heirlooms, trinkets, feats };
}
