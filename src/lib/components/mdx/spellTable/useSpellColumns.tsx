/**
 * @fileoverview Hook providing the standard column configuration for spell tables.
 * @module src/lib/components/mdx/spellTable/useSpellColumns
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import {
    type ColumnConfig,
    type MetadataRow,
} from '../metadataTables/metadataTable';

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
          if (row.verbal) parts.push('V');
          if (row.somatic) parts.push('S');
          if (row.material) parts.push('M');
          return parts.join(', ') || '—';
        },
        sortable: false,
      },
    ],
    [tColumns],
  );
}
