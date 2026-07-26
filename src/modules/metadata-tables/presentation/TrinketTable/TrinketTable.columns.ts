/**
 * @fileoverview Column configuration builder for TrinketTable.
 * @module src/modules/metadata-tables/presentation/TrinketTable/TrinketTable.columns
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

import type {
    ColumnConfig,
    MetadataRow,
} from '@/lib/components/mdx/metadataTables/metadataTable';
import { toPlainSummary } from '@/lib/utils/plainSummary';

/**
 * Builds localized column config for TrinketTable.
 *
 * @param {(key: string) => string} tColumns - Translation function for trinket columns.
 * @returns {ColumnConfig[]} Trinket table column config.
 */
export function buildTrinketColumns(
  tColumns: (key: string) => string,
): ColumnConfig[] {
  return [
    {
      key: 'title',
      label: tColumns('name'),
      getValue: (row: MetadataRow) => row.title,
      sortable: true,
    },
    {
      key: 'itemType',
      label: tColumns('type'),
      getValue: (row: MetadataRow) => row.itemType,
      render: (value: unknown) => {
        if (!value) return '—';
        const str = String(value);
        return str.charAt(0).toUpperCase() + str.slice(1);
      },
      sortable: true,
      filterable: true,
      filterType: 'select',
    },
    {
      key: 'damage',
      label: tColumns('damage'),
      getValue: (row: MetadataRow) =>
        row.damage ? toPlainSummary(String(row.damage)) : '—',
      render: (value: unknown, row: MetadataRow) => {
        if (!value || value === '—') return '—';
        const damageType = row.damageType ? ` ${row.damageType}` : '';
        return `${toPlainSummary(String(value))}${damageType}`;
      },
      sortable: false,
    },
    {
      key: 'range',
      label: tColumns('range'),
      getValue: (row: MetadataRow) => row.range || '—',
      render: (value: unknown) => {
        if (!value || value === '—') return '—';
        return String(value);
      },
      sortable: false,
    },
    {
      key: 'specialEffects',
      label: tColumns('effects'),
      getValue: (row: MetadataRow) => row.specialEffects?.join(', ') || '—',
      render: (value: unknown) => {
        if (!value || value === '—') return '—';
        const str = String(value);
        return str
          .split(', ')
          .map((effect) => effect.charAt(0).toUpperCase() + effect.slice(1))
          .join(', ');
      },
      sortable: false,
      filterable: true,
      filterType: 'select',
    },
    {
      key: 'inflictsConditions',
      label: tColumns('conditions'),
      getValue: (row: MetadataRow) => row.inflictsConditions?.join(', ') || '—',
      render: (value: unknown) => {
        if (!value || value === '—') return '—';
        const str = String(value);
        return str
          .split(', ')
          .map(
            (condition) =>
              condition.charAt(0).toUpperCase() + condition.slice(1),
          )
          .join(', ');
      },
      sortable: false,
      filterable: true,
      filterType: 'select',
    },
    {
      key: 'weight',
      label: tColumns('weight'),
      getValue: (row: MetadataRow) => row.weight || '—',
      sortable: false,
    },
  ];
}
