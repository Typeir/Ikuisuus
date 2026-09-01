/**
 * @fileoverview Monster table wrapper that fetches and renders creature stat blocks.
 * @description Fetches monster metadata from the API and configures MetadataTable
 * with d20 creature stat columns (size, type, CR, AC, HP, alignment).
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
 * <MonsterTable />
 *
 * <!-- With locale override -->
 * <MonsterTable locale="fi" />
 * ```
 * @module src/modules/metadata-tables/presentation/MonsterTable/MonsterTable
 */
'use client';

import MetadataTable from '@/lib/components/mdx/metadataTables/metadataTable';
import { MetadataTableSkeleton } from '@/lib/components/mdx/metadataTables/metadataTableSkeleton';
import { logger } from '@/lib/logging/logger';
import { useMetadataTableData } from '@/modules/metadata-tables/application/hooks/useMetadataTableData';
import { fetchMonsterMetadata } from '@/modules/metadata-tables/infrastructure/api-clients/metadataTableClient';
import {
    buildMonsterColumns,
    type MonsterMetadata,
} from '@/modules/metadata-tables/presentation/MonsterTable/MonsterTable.columns';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

/**
 * Props for MonsterTableWrapper component.
 * @typedef {Object} MonsterTableWrapperProps
 * @property {string} [locale] - Optional locale override (defaults to route param or 'en')
 */
type MonsterTableWrapperProps = {
  locale?: string;
};

/**
 * Fetches locale-aware monster data via API and renders MetadataTable.
 * Uses locale from props, route params, or defaults to 'en'.
 *
 * @component
 * @param {MonsterTableWrapperProps} props - Component props
 * @param {string} [props.locale] - Optional locale override (defaults to route param or 'en')
 * @returns {JSX.Element} The rendered monster table
 */
export default function MonsterTableWrapper({
  locale: localeProp,
}: MonsterTableWrapperProps = {}) {
  const t = useTranslations('tables.monsters');
  const tColumns = useTranslations('tables.monsters.columns');
  const tCommon = useTranslations('common');
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
        {tCommon('error')}: {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className='text-center py-8'>
        {t('noMonsters', {
          code: 'npm run generate-monster-metadata',
        })}
      </div>
    );
  }

  const columns = buildMonsterColumns(tColumns);

  return (
    <MetadataTable
      searchScope='monsters'
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
