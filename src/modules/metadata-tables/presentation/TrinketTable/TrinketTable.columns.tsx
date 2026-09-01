/**
 * @fileoverview Column configuration builder for TrinketTable.
 * @module src/modules/metadata-tables/presentation/TrinketTable/TrinketTable.columns
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

import { Measure } from '@/modules/library/presentation/components/Measure';
import type {
    ColumnConfig,
    MetadataRow,
} from '@/lib/components/mdx/metadataTables/metadataTable';
import { toPlainSummary } from '@/lib/utils/plainSummary';
import { capitalize } from '@/modules/metadata-tables/domain/format';

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
        return capitalize(str);
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
      /* Sorting and filtering still see the native string; only the drawn cell
         converts, so a reader on metres does not get a column ordered by the
         text of a unit they never see. */
      render: (value: unknown) => <Measure text={String(value ?? '')} />,
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
          .map((effect) => capitalize(effect))
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
          .map((condition) => capitalize(condition))
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
      render: (value: unknown) => <Measure text={String(value ?? '')} />,
      sortable: false,
    },
  ];
}
