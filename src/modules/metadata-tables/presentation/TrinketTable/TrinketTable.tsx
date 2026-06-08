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
 * @requires @/lib/components/mdx/metadataTables/metadataTable
 *
 * @example
 * ```mdx
 * <!-- In MDX content file -->
 * <TrinketTable />
 *
 * <!-- With locale override -->
 * <TrinketTable locale="en" />
 * ```
 * @module src/modules/metadata-tables/presentation/TrinketTable/TrinketTable
 */
'use client';

import MetadataTable from '@/lib/components/mdx/metadataTables/metadataTable';
import { MetadataTableSkeleton } from '@/lib/components/mdx/metadataTables/metadataTableSkeleton';
import { useMetadataTableData } from '@/modules/metadata-tables/application/hooks/useMetadataTableData';
import { fetchTrinketMetadata } from '@/modules/metadata-tables/infrastructure/api-clients/metadataTableClient';
import { buildTrinketColumns } from '@/modules/metadata-tables/presentation/TrinketTable/TrinketTable.columns';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

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
  inflictsConditions?: string[];
  [key: string]: unknown;
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
export default function TrinketTableWrapper({
  locale: localeProp,
}: TrinketTableWrapperProps = {}) {
  const t = useTranslations('tables.trinkets');
  const tColumns = useTranslations('tables.trinkets.columns');
  const params = useParams();
  const locale = localeProp || (params?.locale as string) || 'en';
  const { data, loading, error } = useMetadataTableData<TrinketMetadata>(
    fetchTrinketMetadata,
    locale,
    'trinkets',
  );

  if (loading) {
    return (
      <MetadataTableSkeleton
        rows={10}
        columns={6}
        filters={[{ label: 'Type', type: 'select' }]}
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
        dangerouslySetInnerHTML={{ __html: t('noTrinkets') }}
      />
    );
  }

  const columns = buildTrinketColumns(tColumns);

  return (
    <MetadataTable
      data={data}
      columns={columns}
      getRowSlug={(row) =>
        `/items/trinkets/${row.slug.replace(/\.mdx$/, '').replace(/\.(sheet|specialization|list|reference|heirloom|trinket|bloodline|lore)$/, '')}`
      }
      searchKeys={['title', 'itemType', 'specialEffects', 'inflictsConditions']}
      defaultSort={{ key: 'title', direction: 'asc' }}
    />
  );
}
