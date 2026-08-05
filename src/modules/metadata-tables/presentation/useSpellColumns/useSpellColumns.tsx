/**
 * @fileoverview Hook providing the standard column configuration for spell tables.
 * @module src/modules/metadata-tables/presentation/useSpellColumns/useSpellColumns
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { Measure } from '@/modules/library/presentation/components/Measure';
import {
  type ColumnConfig,
  type MetadataRow,
} from '@/lib/components/mdx/metadataTables/metadataTable';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

/**
 * Returns the six standard spell table columns: Name, School, Casting Time,
 * Range, Duration, and Components. Memoised against the translation function.
 *
 * @returns {ColumnConfig[]} Column configuration array ready for MetadataTable
 */
export function useSpellColumns(): ColumnConfig[] {
  const tColumns = useTranslations('tables.spells.columns');

  return useMemo(
    () => [
      {
        key: 'title',
        label: tColumns('spellName'),
        getValue: (row: MetadataRow) => row.title,
        sortable: true,
      },
      {
        key: 'school',
        label: tColumns('school'),
        getValue: (row: MetadataRow) => row.school ?? '—',
        render: (value: unknown) => <em>{String(value ?? '—')}</em>,
        sortable: true,
      },
      {
        key: 'castingTime',
        label: tColumns('castingTime'),
        getValue: (row: MetadataRow) => row.castingTime ?? [],
        render: (value: unknown) => {
          const castingTime = Array.isArray(value)
            ? value.map((item) => String(item))
            : [];
          const isRitual = castingTime.includes('ritual');
          const displayTimes = castingTime
            .filter((time: string) => time !== 'ritual')
            .map((time: string) =>
              time
                .replace(/-/g, ' ')
                .replace(/\b\w/g, (l: string) => l.toUpperCase()),
            )
            .join(', ');
          return isRitual ? `${displayTimes} (R)` : displayTimes;
        },
        sortable: true,
      },
      {
        key: 'range',
        label: tColumns('range'),
        getValue: (row: MetadataRow) => row.range ?? '—',
        /* Sorting and filtering still see the native string; only the drawn
           cell converts, so a reader on metres does not get a column sorted by
           the text of a unit they never see. */
        render: (value: unknown) => <Measure text={String(value ?? '')} />,
        sortable: true,
      },
      {
        key: 'duration',
        label: tColumns('duration'),
        getValue: (row: MetadataRow) => {
          const duration = row.duration ?? '—';
          return row.concentration ? `Concentration, ${duration}` : duration;
        },
        sortable: true,
      },
      {
        key: 'components',
        label: tColumns('components'),
        getValue: (row: MetadataRow) => {
          const parts: string[] = [];
          if (row.components.verbal) parts.push('V');
          if (row.components.somatic) parts.push('S');
          if (row.components.material) parts.push('M');
          return parts.join(', ') || '—';
        },
        sortable: false,
      },
    ],
    [tColumns],
  );
}
