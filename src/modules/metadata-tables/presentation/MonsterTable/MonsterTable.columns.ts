/**
 * @fileoverview Column configuration builder for MonsterTable.
 * @module src/modules/metadata-tables/presentation/MonsterTable/MonsterTable.columns
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

import type {
    ColumnConfig,
    MetadataRow,
} from '@/lib/components/mdx/metadataTables/metadataTable';
import {
    compareByOrder,
    compareChallengeRating,
} from '@/modules/metadata-tables/domain/comparators';
import { SIZE_SORT_ORDER } from '@/modules/metadata-tables/domain/constants';
import { capitalize } from '@/modules/metadata-tables/domain/format';

/**
 * Monster metadata row used by monster table columns.
 *
 * @interface MonsterMetadata
 * @property {string} slug - URL-friendly monster identifier.
 * @property {string} [subSlug] - Optional variant identifier for multi-stat-block files.
 * @property {string} title - Display name of the monster.
 * @property {string} size - Creature size.
 * @property {string} creatureType - Creature type.
 * @property {string} cr - Challenge rating.
 * @property {number | { value: number; notes?: string }} ac - Armor class value or object.
 * @property {number | { average: number; formula?: string }} hp - Hit points value or object.
 * @property {string} [alignment] - Creature alignment.
 */
export interface MonsterMetadata {
  slug: string;
  subSlug?: string;
  title: string;
  size: string;
  creatureType: string;
  cr: string;
  ac: number | { value: number; notes?: string };
  hp: number | { average: number; formula?: string };
  alignment?: string;
  [key: string]: unknown;
}

const asMonsterMetadata = (row: MetadataRow): MonsterMetadata =>
  row as MonsterMetadata;

/**
 * Builds localized column config for MonsterTable.
 *
 * @param {(key: string) => string} tColumns - Translation function for monster columns.
 * @returns {ColumnConfig[]} Monster table column config.
 */
export function buildMonsterColumns(
  tColumns: (key: string) => string,
): ColumnConfig[] {
  return [
    {
      key: 'title',
      label: tColumns('name'),
      getValue: (row: MetadataRow) => asMonsterMetadata(row).title,
      sortable: true,
    },
    {
      key: 'size',
      label: tColumns('size'),
      getValue: (row: MetadataRow) => asMonsterMetadata(row).size,
      render: (value: unknown) => {
        if (!value) return '—';
        const str = String(value);
        return capitalize(str);
      },
      compareValues: (a, b) => compareByOrder(a, b, SIZE_SORT_ORDER),
      sortable: true,
      filterable: true,
      filterType: 'select',
    },
    {
      key: 'creatureType',
      label: tColumns('type'),
      getValue: (row: MetadataRow) => asMonsterMetadata(row).creatureType,
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
      key: 'cr',
      label: tColumns('cr'),
      getValue: (row: MetadataRow) => asMonsterMetadata(row).cr,
      render: (value: unknown) => {
        if (value === null || value === undefined || value === '') return '—';
        return String(value);
      },
      compareValues: (a, b) => compareChallengeRating(a, b),
      sortable: true,
      filterable: true,
      filterType: 'range',
    },
    {
      key: 'ac',
      label: tColumns('ac'),
      getValue: (row: MetadataRow) => {
        const monster = asMonsterMetadata(row);
        return typeof monster.ac === 'number' ? monster.ac : monster.ac?.value;
      },
      sortable: true,
      filterable: true,
      filterType: 'range',
    },
    {
      key: 'hp',
      label: tColumns('hp'),
      getValue: (row: MetadataRow) => {
        const monster = asMonsterMetadata(row);
        return typeof monster.hp === 'number'
          ? monster.hp
          : monster.hp?.average;
      },
      sortable: true,
      filterable: true,
      filterType: 'range',
    },
    {
      key: 'alignment',
      label: tColumns('alignment'),
      getValue: (row: MetadataRow) => asMonsterMetadata(row).alignment,
      render: (value: unknown) => {
        if (!value) return '—';
        const str = String(value);
        return str
          .split(' ')
          .map((word) => capitalize(word))
          .join(' ');
      },
      sortable: true,
      filterable: true,
      filterType: 'select',
    },
  ];
}
