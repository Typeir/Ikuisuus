/**
 * @fileoverview Heirloom Table Wrapper
 * @description Fetches heirloom metadata from the API and configures MetadataTable
 * with heirloom-specific columns and locale-aware content.
 *
 * @version 2.0.0
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
 * <HeirloomTable />
 *
 * <!-- With locale override -->
 * <HeirloomTable locale="es" />
 * ```
 * @module src/modules/metadata-tables/presentation/HeirloomTable/HeirloomTable
 */
'use client';

import MetadataTable from '@/lib/components/mdx/metadataTables/metadataTable';
import { MetadataTableSkeleton } from '@/lib/components/mdx/metadataTables/metadataTableSkeleton';
import { useMetadataTableData } from '@/modules/metadata-tables/application/hooks/useMetadataTableData';
import { fetchHeirloomMetadata } from '@/modules/metadata-tables/infrastructure/api-clients/metadataTableClient';
import { buildHeirloomColumns } from '@/modules/metadata-tables/presentation/HeirloomTable/HeirloomTable.columns';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

/**
 * Heirloom metadata structure from API
 * @typedef {Object} HeirloomMetadata
 * @property {string} slug - URL-friendly identifier
 * @property {string} title - Display name
 * @property {string} rarity - Item rarity
 * @property {string} itemType - Type of item
 * @property {string} [weaponType] - Specific weapon type if applicable
 * @property {boolean} [requiresAttunement] - Whether the item requires attunement
 * @property {{dice: string; type: string}} [damage] - Weapon damage dice and type
 * @property {string[]} [properties] - Weapon properties
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
  [key: string]: unknown;
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
 * Client-side wrapper for HeirloomTable.
 *
 * @component
 * @param {HeirloomTableWrapperProps} props - Component props
 * @param {string} [props.locale] - Optional locale override (defaults to route param or 'en')
 * @returns {JSX.Element} Rendered heirloom table
 */
export default function HeirloomTableWrapper({
  locale: localeProp,
}: HeirloomTableWrapperProps = {}) {
  const t = useTranslations('tables.heirlooms');
  const tColumns = useTranslations('tables.heirlooms.columns');
  const tCommon = useTranslations('common');
  const params = useParams();
  const locale = localeProp || (params?.locale as string) || 'en';
  const { data, loading, error } = useMetadataTableData<HeirloomMetadata>(
    fetchHeirloomMetadata,
    locale,
    'heirlooms',
  );

  if (loading) {
    return (
      <MetadataTableSkeleton
        rows={12}
        columns={5}
        filters={[
          { label: 'Rarity', type: 'select' },
          { label: 'Type', type: 'select' },
          { label: 'Attunement', type: 'select' },
        ]}
      />
    );
  }

  if (error) {
    return (
      <div className='text-center py-8 text-red-500'>
        {tCommon('error')}: {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div
        className='text-center py-8'
        dangerouslySetInnerHTML={{ __html: t('noHeirlooms') }}
      />
    );
  }

  const columns = buildHeirloomColumns(tColumns, tCommon);

  return (
    <MetadataTable
      data={data}
      columns={columns}
      getRowSlug={(row) =>
        `/items/heirlooms/${row.slug.replace(/\.mdx$/, '').replace(/\.(sheet|specialization|list|reference|heirloom|trinket|bloodline|lore)$/, '')}`
      }
      searchKeys={['title', 'itemType']}
      defaultSort={{ key: 'title', direction: 'asc' }}
    />
  );
}
