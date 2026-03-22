/**
 * @fileoverview Monster Table Wrapper - Client-side data fetching for creature stat blocks
 * @description Fetches monster metadata from API and configures MetadataTable with
 * D&D 5e creature statistics (size, type, CR, AC, HP, alignment). Uses shared
 * compareChallengeRating utility for fractional values (e.g., "1/2", "1/4") and
 * SIZE_SORT_ORDER for consistent size-based sorting.
 *
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react
 * @requires next/navigation
 * @requires next-intl
 * @requires ./metadataTable
 * @requires @/lib/utils/tableUtils
 * @requires @/lib/enums/tableConstants
 *
 * @example
 * ```mdx
 * <!-- In MDX content file -->
 * <MonsterTable />
 *
 * <!-- With locale override -->
 * <MonsterTable locale="fi" />
 * ```
 */
'use client';

import { SIZE_SORT_ORDER } from '@/lib/enums/tableConstants';
import { useMetadataTableData } from '@/lib/hooks/data/useMetadataTableData';
import { logger } from '@/lib/logging/logger';
import { fetchMonsterMetadata } from '@/lib/services/api/metadataTableService';
import { compareByOrder, compareChallengeRating } from '@/lib/utils/tableUtils';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import MetadataTable, {
  type ColumnConfig,
  type MetadataRow,
} from './metadataTable';
import { MetadataTableSkeleton } from './metadataTableSkeleton';

/**
 * Monster metadata structure from API
 * @typedef {Object} MonsterMetadata
 * @property {string} slug - URL-friendly monster identifier
 * @property {string} [subSlug] - Optional variant identifier for multi-stat-block files
 * @property {string} title - Display name of the monster
 * @property {string} size - Creature size (e.g., 'tiny', 'small', 'medium', 'large', 'huge', 'gargantuan')
 * @property {string} creatureType - Type of creature (e.g., 'aberration', 'beast', 'dragon', 'humanoid')
 * @property {string} cr - Challenge rating (e.g., '1/4', '5', '23')
 * @property {number|{value: number; notes?: string}} ac - Armor class value or object with notes
 * @property {number|{average: number; formula?: string}} hp - Hit points value or object with dice formula
 * @property {string} [alignment] - Creature alignment (e.g., 'lawful good', 'chaotic evil')
 * @property {*} [key] - Additional metadata properties
 */
type MonsterMetadata = {
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
};

const asMonsterMetadata = (row: MetadataRow): MonsterMetadata =>
  row as MonsterMetadata;

/**
 * Props for MonsterTableWrapper component.
 * @typedef {Object} MonsterTableWrapperProps
 * @property {string} [locale] - Optional locale override (defaults to route param or 'en')
 */
type MonsterTableWrapperProps = {
  locale?: string;
};

/**
 * Client-side wrapper for MonsterTable that fetches locale-aware data via API.
 * Can use locale from props, route params, or defaults to 'en'.
 *
 * @component
 * @param {MonsterTableWrapperProps} props - Component props
 * @param {string} [props.locale] - Optional locale override (defaults to route param or 'en')
 * @returns {JSX.Element} The rendered monster table with client-side data fetching
 */
export default function MonsterTableWrapper({
  locale: localeProp,
}: MonsterTableWrapperProps = {}) {
  const t = useTranslations('tables.monsters');
  const tColumns = useTranslations('tables.monsters.columns');
  const params = useParams();
  const locale = localeProp || (params?.locale as string) || 'en';
  const { data, loading, error } = useMetadataTableData<MonsterMetadata>(
    fetchMonsterMetadata,
    locale,
    'monsters',
  );

  if (loading) {
    return (
      <MetadataTableSkeleton
        rows={15}
        columns={7}
        filters={[
          { label: 'Size', type: 'select' },
          { label: 'Type', type: 'select' },
          { label: 'CR', type: 'range' },
          { label: 'AC', type: 'range' },
          { label: 'HP', type: 'range' },
        ]}
      />
    );
  }

  if (error) {
    return (
      <div className='text-center py-8 text-red-500'>
        {t('error')}: {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className='text-center py-8'
        dangerouslySetInnerHTML={{
          __html: t('noMonsters', {
            code: 'npm run generate-monster-metadata',
          }),
        }}
      />
    );
  }

  const columns: ColumnConfig[] = [
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
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
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
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      },
      sortable: true,
      filterable: true,
      filterType: 'select',
    },
    {
      key: 'cr',
      label: tColumns('cr'),
      getValue: (row: MetadataRow) => asMonsterMetadata(row).cr,
      render: (value: unknown) => value || '—',
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
          .map(
            (word) =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
          )
          .join(' ');
      },
      sortable: true,
      filterable: true,
      filterType: 'select',
    },
  ];

  return (
    <MetadataTable
      data={data}
      columns={columns}
      getRowSlug={(row) => {
        const path = `/monsters/${row.slug}`;
        const result =
          row.subSlug && row.subSlug !== row.slug
            ? `${path}#${row.subSlug}`
            : path;
        logger.debug('getRowSlug', {
          slug: row.slug,
          subSlug: row.subSlug,
          result,
        });
        return result;
      }}
      searchKeys={['title', 'creatureType', 'size']}
      defaultSort={{ key: 'title', direction: 'asc' }}
    />
  );
}
