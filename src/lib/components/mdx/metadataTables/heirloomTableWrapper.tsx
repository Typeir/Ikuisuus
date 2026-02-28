/**
 * @fileoverview Heirloom Table Wrapper - Client-side data fetching for magical items table
 * @description Fetches heirloom metadata from API and configures MetadataTable with
 * heirloom-specific columns (rarity, item type, weapon type, attunement). Supports
 * locale-aware content via route params or props override. Uses RARITY_SORT_ORDER
 * for consistent rarity-based sorting.
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
 * <HeirloomTable />
 * 
 * <!-- With locale override -->
 * <HeirloomTable locale="es" />
 * ```
 */
'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logging/logger';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import MetadataTable, { type ColumnConfig } from './metadataTable';
import { MetadataTableSkeleton } from './metadataTableSkeleton';
import { compareByOrder } from '@/lib/utils/tableUtils';
import { RARITY_SORT_ORDER } from '@/lib/enums/tableConstants';

const log = logger.child({ module: 'HeirloomTableWrapper' });

/**
 * Heirloom metadata structure from API
 * @typedef {Object} HeirloomMetadata
 * @property {string} slug - URL-friendly heirloom identifier
 * @property {string} title - Display name of the heirloom
 * @property {string} rarity - Item rarity (e.g., 'common', 'uncommon', 'rare', 'very rare', 'legendary', 'artifact')
 * @property {string} itemType - Type of item (e.g., 'weapon', 'armor', 'wondrous item')
 * @property {string} [weaponType] - Specific weapon type if applicable (e.g., 'longsword', 'greatsword')
 * @property {boolean} [requiresAttunement] - Whether the item requires attunement
 * @property {{dice: string; type: string}} [damage] - Weapon damage dice and type
 * @property {string[]} [properties] - Weapon properties (e.g., 'versatile', 'finesse')
 * @property {*} [key] - Additional metadata properties
 */
type HeirloomMetadata = {
  slug: string;
  title: string;
  rarity: string;
  itemType: string;
  weaponType?: string;
  requiresAttunement?: boolean;
  damage?: { dice: string; type: string };
  properties?: string[];
  [key: string]: any;
};

/**
 * Props for HeirloomTableWrapper component.
 * @typedef {Object} HeirloomTableWrapperProps
 * @property {string} [locale] - Optional locale override (defaults to route param or 'en')
 */
type HeirloomTableWrapperProps = {
  locale?: string;
};

/**
 * Client-side wrapper for HeirloomTable that fetches locale-aware data via API.
 * Can use locale from props, route params, or defaults to 'en'.
 * 
 * @component
 * @param {HeirloomTableWrapperProps} props - Component props
 * @param {string} [props.locale] - Optional locale override (defaults to route param or 'en')
 * @returns {JSX.Element} The rendered heirloom table with client-side data fetching
 */
export default function HeirloomTableWrapper({ locale: localeProp }: HeirloomTableWrapperProps = {}) {
  const t = useTranslations('tables.heirlooms');
  const tColumns = useTranslations('tables.heirlooms.columns');
  const tAttunement = useTranslations('tables.heirlooms.attunementValues');
  const params = useParams();
  const locale = localeProp || (params?.locale as string) || 'en';
  const [data, setData] = useState<HeirloomMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/heirlooms?locale=${locale}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(heirlooms => {
        log.message('Loaded heirlooms', { count: heirlooms.length, locale });
        setData(heirlooms);
        setLoading(false);
      })
      .catch(err => {
        log.error('Failed to load heirlooms', {
          error: err instanceof Error ? err.message : String(err),
          locale
        });
        setError(err.message);
        setLoading(false);
      });
  }, [locale]);

  if (loading) {
    return <MetadataTableSkeleton 
      rows={12} 
      columns={5}
      filters={[
        { label: 'Rarity', type: 'select' },
        { label: 'Type', type: 'select' },
        { label: 'Attunement', type: 'select' }
      ]}
    />;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{t('error')}: {error}</div>;
  }

  if (data.length === 0) {
    return <div className="text-center py-8" dangerouslySetInnerHTML={{ __html: t('noHeirlooms') }} />;
  }

  const columns: ColumnConfig[] = [
    {
      key: 'title',
      label: tColumns('name'),
      getValue: (row: any) => row.title,
      sortable: true,
    },
    {
      key: 'rarity',
      label: tColumns('rarity'),
      getValue: (row: any) => row.rarity,
      render: (value: any) => {
        const str = String(value);
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      },
      compareValues: (a, b) => compareByOrder(a, b, RARITY_SORT_ORDER),
      sortable: true,
      filterable: true,
      filterType: 'select',
    },
    {
      key: 'itemType',
      label: tColumns('type'),
      getValue: (row: any) => row.itemType,
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
      key: 'weaponType',
      label: tColumns('subtype'),
      getValue: (row: any) => row.weaponType || '—',
      render: (value: any) => {
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
      getValue: (row: any) => row.requiresAttunement ? tAttunement('yes') : tAttunement('no'),
      sortable: true,
      filterable: true,
      filterType: 'select',
    },
  ];

  return (
    <MetadataTable
      data={data}
      columns={columns}
      getRowSlug={(row) => `/items/heirlooms/${row.slug.replace(/\.mdx$/, '')}`}
      searchKeys={['title', 'itemType']}
      defaultSort={{ key: 'title', direction: 'asc' }}
    />
  );
}
