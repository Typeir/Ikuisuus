/**
 * @fileoverview Lethality ladder table.
 * @description Every rung the domain knows, priced by the domain and counted
 * against whatever the bestiary currently holds, so the page never goes stale
 *
 * @module src/modules/metadata-tables/presentation/LethalityTable/LethalityTable
 * @version 1.0.0
 * @author Typeir
 * @since 2026-09-12
 *
 * @example
 * ```mdx
 * <LethalityTable />
 * ```
 */
'use client';

import { DataTable } from '@/lib/components/ui/dataTable';
import { MetadataTableSkeleton } from '@/lib/components/mdx/metadataTables/metadataTableSkeleton';
import { useMetadataTableData } from '@/modules/metadata-tables/application/hooks/useMetadataTableData';
import {
  buildLethalityRungs,
  type LethalityCreature,
} from '@/modules/metadata-tables/domain/lethalityRungs';
import { fetchMonsterMetadata } from '@/modules/metadata-tables/infrastructure/api-clients/metadataTableClient';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

/**
 * Props.
 *
 * @property {string} [locale] - Locale override, otherwise the route's
 */
export type LethalityTableProps = {
  locale?: string;
};

/**
 * The Lethality ladder as a table.
 *
 * @param {LethalityTableProps} props - Component props
 * @returns {JSX.Element} The rendered ladder
 */
export default function LethalityTable({
  locale: localeProp,
}: LethalityTableProps = {}) {
  const t = useTranslations('tables.lethality');
  const tColumns = useTranslations('tables.lethality.columns');
  const tCommon = useTranslations('common');
  const params = useParams();
  const locale = localeProp || (params?.locale as string) || 'en';
  const { data, loading, error } = useMetadataTableData<LethalityCreature>(
    fetchMonsterMetadata,
    locale,
    'monsters',
  );

  if (loading) {
    return <MetadataTableSkeleton rows={20} columns={4} />;
  }

  if (error) {
    return (
      <div role='alert'>
        {tCommon('error')}: {error}
      </div>
    );
  }

  const rungs = buildLethalityRungs(data);
  const format = new Intl.NumberFormat(locale);

  return (
    <DataTable
      caption={t('caption')}
      ariaLabel={tColumns('lethality')}
      columns={[
        { key: 'lethality', header: tColumns('lethality') },
        { key: 'xp', header: tColumns('xp') },
        { key: 'tierBonus', header: tColumns('tierBonus') },
        { key: 'creatures', header: tColumns('creatures') },
      ]}
      rows={rungs.map((rung) => ({
        key: rung.label,
        cells: [
          { content: rung.label, header: true },
          format.format(rung.xp),
          rung.tierBonus === null ? '—' : `+${rung.tierBonus}`,
          rung.creatures === 0 ? '—' : format.format(rung.creatures),
        ],
        className: rung.creatures === 0 ? 'is-empty' : undefined,
      }))}
      dataAttributes={{ table: 'lethality' }}
    />
  );
}
