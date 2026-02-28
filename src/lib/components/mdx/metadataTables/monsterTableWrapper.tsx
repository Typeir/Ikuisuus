/**
 * @fileoverview Monster Table Wrapper - Client-side data fetching for creature stat blocks
 * @description Fetches monster metadata from API and configures MetadataTable with
 * D&D 5e creature statistics (size, type, CR, AC, HP, alignment). Includes inline
 * Challenge Rating parsing for fractional values (e.g., "1/2", "1/4"). Uses SIZE_SORT_ORDER
 * for consistent size-based sorting.
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

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import MetadataTable, { type ColumnConfig } from './metadataTable';
import { MetadataTableSkeleton } from './metadataTableSkeleton';
import { SIZE_SORT_ORDER } from '@/lib/enums/tableConstants';
import { compareByOrder } from '@/lib/utils/tableUtils';

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
  [key: string]: any;
};

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
export default function MonsterTableWrapper({ locale: localeProp }: MonsterTableWrapperProps = {}) {
  const t = useTranslations('tables.monsters');
  const tColumns = useTranslations('tables.monsters.columns');
  const params = useParams();
  const locale = localeProp || (params?.locale as string) || 'en';
  const [data, setData] = useState<MonsterMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/monsters?locale=${locale}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(monsters => {
        console.log('Loaded monsters:', monsters.length, monsters);
        setData(monsters);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load monsters:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [locale]);

  if (loading) {
    return <MetadataTableSkeleton 
      rows={15} 
      columns={7}
      filters={[
        { label: 'Size', type: 'select' },
        { label: 'Type', type: 'select' },
        { label: 'CR', type: 'range' },
        { label: 'AC', type: 'range' },
        { label: 'HP', type: 'range' }
      ]}
    />;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{t('error')}: {error}</div>;
  }

  if (data.length === 0) {
    return <div className="text-center py-8" dangerouslySetInnerHTML={{ __html: t('noMonsters') }} />;
  }

  const columns: ColumnConfig[] = [
    {
      key: 'title',
      label: tColumns('name'),
      getValue: (row: any) => row.title,
      sortable: true,
    },
    {
      key: 'size',
      label: tColumns('size'),
      getValue: (row: any) => row.size,
      render: (value: any) => {
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
      getValue: (row: any) => row.creatureType,
      render: (value: any) => {
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
      getValue: (row: any) => row.cr,
      render: (value: any) => value || '—',
      compareValues: (a, b) => {
        if (!a && !b) return 0;
        if (!a) return 1;
        if (!b) return -1;
        
        const parseC = (cr: unknown): number => {
          if (typeof cr === 'number') return cr;
          const str = String(cr).trim();
          if (str.includes('/')) {
            const [num, denom] = str.split('/').map(s => parseFloat(s.trim()));
            return num / denom;
          }
          return parseFloat(str) || 0;
        };
        
        return parseC(a) - parseC(b);
      },
      sortable: true,
      filterable: true,
      filterType: 'range',
    },
    {
      key: 'ac',
      label: tColumns('ac'),
      getValue: (row: any) => row.ac?.value ?? row.ac,
      sortable: true,
      filterable: true,
      filterType: 'range',
    },
    {
      key: 'hp',
      label: tColumns('hp'),
      getValue: (row: any) => row.hp?.average ?? row.hp,
      sortable: true,
      filterable: true,
      filterType: 'range',
    },
    {
      key: 'alignment',
      label: tColumns('alignment'),
      getValue: (row: any) => row.alignment,
      render: (value: any) => {
        if (!value) return '—';
        const str = String(value);
        return str.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
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
        const result = row.subSlug && row.subSlug !== row.slug ? `${path}#${row.subSlug}` : path;
        console.log('getRowSlug:', { slug: row.slug, subSlug: row.subSlug, result });
        return result;
      }}
      searchKeys={['title', 'creatureType', 'size']}
      defaultSort={{ key: 'title', direction: 'asc' }}
    />
  );
}
