/**
 * @fileoverview Wraps {@link MetadataTable} for the feat library index.
 * @description Fetches feat metadata from `/api/feats` via `useFeats`.
 *
 * @version 2.0.0
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
import { truncateMdxSource } from '@/lib/md/truncateMdx';
import { toPlainSummary } from '@/lib/utils/plainSummary';
import { useRowSafeComponents } from '@/lib/components/mdx/metadataTables/useRowSafeComponents';
import { capitalize } from '@/modules/metadata-tables/domain/format';
import { compileRuntimeSync } from '@/modules/library/infrastructure/compile/compileRuntime';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useMemo, type ReactNode } from 'react';

/**
 * Rendered characters a summary cell shows before it is cut.
 */
const SUMMARY_CHARS = 120;

/**
 * Rendered characters a prerequisite cell shows before it is cut.
 */
const PREREQUISITE_CHARS = 90;

/**
 * The label the stored prerequisite repeats, which the column header states.
 */
const PREREQUISITE_LABEL = /^\s*prerequisites?\s*:\s*/i;

/**
 * Prerequisite text without the label the column header already carries.
 *
 * @param {FeatMetadata} feat - Feat record
 * @returns {string} Prerequisite source, or an empty string when there is none
 */
function prerequisiteSource(feat: FeatMetadata): string {
  if (!feat.hasPrerequisite) return '';
  return (feat.prerequisite ?? '').replace(PREREQUISITE_LABEL, '');
}

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
 * Props for {@link ProseCell}.
 *
 * @interface ProseCellProps
 * @property {string} source - Raw MDX source of the field
 * @property {number} maxChars - Rendered character budget before the cut
 * @property {string} locale - Locale the keywords resolve against
 */
interface ProseCellProps {
  source: string;
  maxChars: number;
  locale: string;
}

/**
 * Compiled preview of a prose field.
 *
 * @description The stored text is authored MDX
 *
 * @component
 * @param {ProseCellProps} props - Component props
 * @param {string} props.source - Raw MDX source of the field
 * @param {number} props.maxChars - Rendered character budget before the cut
 * @param {string} props.locale - Locale the keywords resolve against
 * @returns {ReactNode} Compiled preview, or an em dash when the field is empty
 */
function ProseCell({ source, maxChars, locale }: ProseCellProps): ReactNode {
  const components = useRowSafeComponents();

  return useMemo(() => {
    if (!source.trim()) return '—';

    const { source: cut } = truncateMdxSource(source, {
      maxChars,
      ellipsis: true,
    });
    if (!cut) return '—';

    try {
      return compileRuntimeSync({ source: cut, components, locale }).content;
    } catch {
      return toPlainSummary(cut);
    }
  }, [source, maxChars, locale, components]);
}

/**
 * Client-side feat table.
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
      {
        key: 'title',
        label: tColumns('feat'),
        sortable: true,
        width: '15%',
      },
      {
        key: 'category',
        label: tColumns('category'),
        sortable: true,
        width: '11%',
        filterable: true,
        filterType: 'select',
        getValue: (row) => (row as FeatMetadata).category ?? '',
        getFilterOptions: (rows) =>
          Array.from(
            new Set(
              rows
                .map((row) => (row as FeatMetadata).category)
                .filter((value): value is string => Boolean(value)),
            ),
          ).sort(),
        render: (value) => (value ? capitalize(String(value)) : '—'),
      },
      {
        key: 'prerequisite',
        label: tColumns('prerequisite'),
        sortable: true,
        width: '18%',
        getValue: (row) =>
          toPlainSummary(prerequisiteSource(row as FeatMetadata)),
        render: (_value, row) => (
          <ProseCell
            source={prerequisiteSource(row as FeatMetadata)}
            maxChars={PREREQUISITE_CHARS}
            locale={locale}
          />
        ),
      },
      {
        key: 'repeatable',
        label: tColumns('repeatable'),
        sortable: true,
        width: '12%',
        filterable: true,
        filterType: 'select',
        getValue: (row) =>
          (row as FeatMetadata).repeatable ? tCommon('yes') : tCommon('no'),
        render: (_value, row) =>
          (row as FeatMetadata).repeatable ? tCommon('yes') : '—',
      },
      {
        key: 'description',
        label: tColumns('summary'),
        sortable: false,
        width: '30%',
        getValue: (row) =>
          toPlainSummary(String((row as FeatMetadata).description ?? '')),
        render: (_value, row) => (
          <ProseCell
            source={String((row as FeatMetadata).description ?? '')}
            maxChars={SUMMARY_CHARS}
            locale={locale}
          />
        ),
      },
    ],
    [tColumns, tCommon, locale],
  );

  if (isLoading) {
    return (
      <MetadataTableSkeleton
        rows={12}
        columns={5}
        filters={[
          { label: tColumns('category'), type: 'select' },
          { label: tColumns('repeatable'), type: 'select' },
        ]}
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
