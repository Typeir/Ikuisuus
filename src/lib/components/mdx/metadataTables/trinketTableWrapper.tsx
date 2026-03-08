/**
 * @fileoverview Trinket Table Wrapper - Client-side data fetching for adventuring gear table
 * @description Fetches trinket metadata from API and configures MetadataTable with
 * equipment-specific columns (item type, damage, damage type, properties, range, weight).
 * Supports locale-aware content via route params or props override. Handles thrown weapons,
 * special items, and saving throw mechanics.
 * 
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires react
 * @requires next/navigation
 * @requires next-intl
 * @requires ./metadataTable
 * 
 * @example
 * ```mdx
 * <!-- In MDX content file -->
 * <TrinketTable />
 * 
 * <!-- With locale override -->
 * <TrinketTable locale="en" />
 * ```
 */
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { logger } from '@/lib/logging/logger';
import MetadataTable, { type ColumnConfig } from './metadataTable';
import { MetadataTableSkeleton } from './metadataTableSkeleton';

/**
 * Trinket metadata structure from API
 * @typedef {Object} TrinketMetadata
 * @property {string} slug - URL-friendly trinket identifier
 * @property {string} title - Display name of the trinket
 * @property {string} itemType - Type of item (e.g., 'Adventuring Gear')
 * @property {string} [damage] - Damage dice (e.g., '1d6', '3d4')
 * @property {string} [damageType] - Type of damage (e.g., 'piercing', 'fire', 'thunder')
 * @property {string[]} [properties] - Item properties (e.g., 'thrown', 'special')
 * @property {string} [range] - Range in feet (e.g., '30/60', '20')
 * @property {string} [weight] - Weight of the item (e.g., '1 lb.', '½ lb.')
 * @property {number} [savingThrowDC] - DC for saving throws
 * @property {string} [savingThrowAbility] - Ability for saving throw (e.g., 'dexterity', 'constitution')
 * @property {string[]} [specialEffects] - Special effects like 'restrain', 'blind', 'frighten'
 * @property {*} [key] - Additional metadata properties
 */
type TrinketMetadata = {
  slug: string;
  title: string;
  itemType: string;
  damage?: string;
  damageType?: string;
  properties?: string[];
  range?: string;
  weight?: string;
  savingThrowDC?: number;
  savingThrowAbility?: string;
  specialEffects?: string[];
  [key: string]: any;
};

/**
 * Props for TrinketTableWrapper component.
 * @typedef {Object} TrinketTableWrapperProps
 * @property {string} [locale] - Optional locale override (defaults to route param or 'en')
 */
type TrinketTableWrapperProps = {
  locale?: string;
};

/**
 * Client-side wrapper for TrinketTable that fetches locale-aware data via API.
 * Can use locale from props, route params, or defaults to 'en'.
 * 
 * @component
 * @param {TrinketTableWrapperProps} props - Component props
 * @param {string} [props.locale] - Optional locale override (defaults to route param or 'en')
 * @returns {JSX.Element} The rendered trinket table with client-side data fetching
 */
export default function TrinketTableWrapper({ locale: localeProp }: TrinketTableWrapperProps = {}) {
  const t = useTranslations('tables.trinkets');
  const tColumns = useTranslations('tables.trinkets.columns');
  const params = useParams();
  const locale = localeProp || (params?.locale as string) || 'en';
  const [data, setData] = useState<TrinketMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/trinkets?locale=${locale}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(trinkets => {
        logger.debug('Loaded trinkets', { count: trinkets.length });
        setData(trinkets);
        setLoading(false);
      })
      .catch(err => {
        logger.error('Failed to load trinkets', { error: err instanceof Error ? err.message : String(err) });
        setError(err.message);
        setLoading(false);
      });
  }, [locale]);

  if (loading) {
    return <MetadataTableSkeleton 
      rows={10} 
      columns={6}
      filters={[
        { label: 'Type', type: 'select' }
      ]}
    />;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{t('error')}: {error}</div>;
  }

  if (data.length === 0) {
    return <div className="text-center py-8" dangerouslySetInnerHTML={{ __html: t('noTrinkets') }} />;
  }

  const columns: ColumnConfig[] = [
    {
      key: 'title',
      label: tColumns('name'),
      getValue: (row: any) => row.title,
      sortable: true,
    },
    {
      key: 'itemType',
      label: tColumns('type'),
      getValue: (row: any) => row.itemType,
      render: (value: any) => {
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
      getValue: (row: any) => row.damage || '—',
      render: (value: any, row: any) => {
        if (!value || value === '—') return '—';
        const damageType = row.damageType ? ` ${row.damageType}` : '';
        return `${value}${damageType}`;
      },
      sortable: false,
    },
    {
      key: 'range',
      label: tColumns('range'),
      getValue: (row: any) => row.range || '—',
      render: (value: any) => {
        if (!value || value === '—') return '—';
        return value;
      },
      sortable: false,
    },
    {
      key: 'specialEffects',
      label: tColumns('effects'),
      getValue: (row: any) => row.specialEffects?.join(', ') || '—',
      render: (value: any) => {
        if (!value || value === '—') return '—';
        const str = String(value);
        return str.split(', ').map(effect => 
          effect.charAt(0).toUpperCase() + effect.slice(1)
        ).join(', ');
      },
      sortable: false,
      filterable: true,
      filterType: 'select',
    },
    {
      key: 'inflictsConditions',
      label: tColumns('conditions'),
      getValue: (row: any) => row.inflictsConditions?.join(', ') || '—',
      render: (value: any) => {
        if (!value || value === '—') return '—';
        const str = String(value);
        return str.split(', ').map(condition => 
          condition.charAt(0).toUpperCase() + condition.slice(1)
        ).join(', ');
      },
      sortable: false,
      filterable: true,
      filterType: 'select',
    },
    {
      key: 'weight',
      label: tColumns('weight'),
      getValue: (row: any) => row.weight || '—',
      sortable: false,
    },
  ];

  return (
    <MetadataTable
      data={data}
      columns={columns}
      getRowSlug={(row) => `/items/trinkets/${row.slug.replace(/\.mdx$/, '')}`}
      searchKeys={['title', 'itemType', 'specialEffects', 'inflictsConditions']}
      defaultSort={{ key: 'title', direction: 'asc' }}
    />
  );
}
