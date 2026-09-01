/**
 * @fileoverview Wraps {@link MetadataTable} for the feat library index.
 * @description Fetches feat metadata from `/api/feats` via `useFeats`.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @example
 * ```mdx
 * <FeatTable />
 * ```
 * @module src/modules/metadata-tables/presentation/FeatTable/FeatTable
 */
'use client';

import MetadataTable, {
    type ColumnConfig,
} from '@/lib/components/mdx/metadataTables/metadataTable';
import { MetadataTableSkeleton } from '@/lib/components/mdx/metadataTables/metadataTableSkeleton';
import type { FeatMetadata } from '@/lib/db/content/schemas/featMetadata';
import { useFeats } from '@/lib/hooks/data/useFeats';
import { toPlainSummary, truncateWords } from '@/lib/utils/plainSummary';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';

/**
 * Props for the FeatTable component.
 *
 * @typedef {Object} FeatTableProps
 * @property {string} [locale] - Optional locale override (defaults to route param or 'en')
 */
type FeatTableProps = {
  locale?: string;
};

/**
 * Client-side feat table. Renders `feats` from `useFeats` in a {@link MetadataTable}.
 *
 * @component
 * @param {FeatTableProps} props - Component props
 * @param {string} [props.locale] - Optional locale override (defaults to route param or 'en')
 * @returns {JSX.Element} The rendered feat table with client-side data fetching
 */
export default function FeatTable({ locale: localeProp }: FeatTableProps = {}) {
  const t = useTranslations('tables.feats');
  const tColumns = useTranslations('tables.feats.columns');
  const tCommon = useTranslations('common');
  const params = useParams();
  const locale = localeProp || (params?.locale as string) || 'en';
  const { feats, isLoading, error } = useFeats({ locale });

  const columns = useMemo<ColumnConfig[]>(
    () => [
      { key: 'title', label: tColumns('feat'), sortable: true },
      {
        key: 'prerequisite',
        label: tColumns('prerequisite'),
        sortable: true,
        getValue: (row) =>
          (row as FeatMetadata).hasPrerequisite
            ? toPlainSummary((row as FeatMetadata).prerequisite ?? '')
            : '',
        render: (value) => truncateWords(String(value ?? ''), 100) || '—',
      },
      {
        key: 'multiSelect',
        label: tColumns('repeatable'),
        sortable: true,
        filterable: true,
        filterType: 'select',
        getValue: (row) =>
          (row as FeatMetadata).multiSelect ? tCommon('yes') : tCommon('no'),
        render: (_value, row) =>
          (row as FeatMetadata).multiSelect ? tCommon('yes') : '—',
      },
      {
        key: 'description',
        label: tColumns('summary'),
        sortable: false,
        getValue: (row) =>
          toPlainSummary(String((row as FeatMetadata).description ?? '')),
        render: (value) => truncateWords(String(value ?? ''), 100) || '—',
      },
    ],
    [tColumns, tCommon],
  );

  if (isLoading) {
    return (
      <MetadataTableSkeleton
        rows={12}
        columns={4}
        filters={[{ label: tColumns('repeatable'), type: 'select' }]}
      />
    );
  }

  if (error) {
    return (
      <div className='text-center py-8 text-red-500'>
        {tCommon('error')}: {error.message}
      </div>
    );
  }

  if (feats.length === 0) {
    return <div className='text-center py-8'>{t('noFeats')}</div>;
  }

  return (
    <MetadataTable
      searchScope='feats'
      data={feats}
      columns={columns}
      getRowSlug={(row) => (row as FeatMetadata).slug}
      searchKeys={['title', 'prerequisite', 'description']}
      defaultSort={{ key: 'title', direction: 'asc' }}
    />
  );
}
