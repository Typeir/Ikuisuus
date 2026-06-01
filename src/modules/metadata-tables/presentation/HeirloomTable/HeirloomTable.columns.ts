/**
 * @fileoverview Column configuration builder for HeirloomTable.
 * @module src/modules/metadata-tables/presentation/HeirloomTable/HeirloomTable.columns
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

import type {
    ColumnConfig,
    MetadataRow,
} from '@/lib/components/mdx/metadataTables/metadataTable';
import { compareByOrder } from '@/modules/metadata-tables/domain/comparators';
import { RARITY_SORT_ORDER } from '@/modules/metadata-tables/domain/constants';

/**
 * Builds localized column config for HeirloomTable.
 *
 * @param {(key: string) => string} tColumns - Translation function for heirloom columns.
 * @param {(key: string) => string} tAttunement - Translation function for attunement values.
 * @returns {ColumnConfig[]} Heirloom table column config.
 */
export function buildHeirloomColumns(
  tColumns: (key: string) => string,
  tAttunement: (key: string) => string,
): ColumnConfig[] {
  return [
    {
      key: 'title',
      label: tColumns('name'),
      getValue: (row: MetadataRow) => row.title,
      sortable: true,
    },
    {
      key: 'rarity',
      label: tColumns('rarity'),
      getValue: (row: MetadataRow) => row.rarity,
      render: (value: unknown) => {
        const str = String(value);
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      },
      compareValues: (a, b) => compareByOrder(a, b, RARITY_SORT_ORDER),
      filterSortOrder: RARITY_SORT_ORDER,
      sortable: true,
      filterable: true,
      filterType: 'select',
    },
    {
      key: 'itemType',
      label: tColumns('type'),
      getValue: (row: MetadataRow) => row.itemType,
      render: (value: unknown) => {
        if (!value) return '—';
        const str = String(value);
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      },
      sortable: true,
      filterable: true,
      filterType: 'select',
    },
    {
      key: 'weaponType',
      label: tColumns('subtype'),
      getValue: (row: MetadataRow) => row.weaponType || '—',
      render: (value: unknown) => {
        if (!value || value === '—') return '—';
        const str = String(value);
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      },
      sortable: true,
      filterable: true,
      filterType: 'select',
    },
    {
      key: 'requiresAttunement',
      label: tColumns('attunement'),
      getValue: (row: MetadataRow) =>
        row.requiresAttunement ? tAttunement('yes') : tAttunement('no'),
      sortable: true,
      filterable: true,
      filterType: 'select',
    },
  ];
}
