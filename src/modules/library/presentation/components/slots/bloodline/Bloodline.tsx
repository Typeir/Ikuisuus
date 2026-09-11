/**
 * @fileoverview Bloodline card.
 * @description Prints the two Core Features rows as tables, the way a monster
 * prints its defences and its ability scores
 *
 * @module modules/library/presentation/components/slots/bloodline/Bloodline
 * @version 0.2.0
 * @author Typeir
 * @since 2026-09-07
 */

'use client';

import {
  DataTable,
  type DataTableColumn,
  type DataTableRow,
} from '@/lib/components/ui/dataTable';
import {
  BLOODLINE_SLOT_NAMES,
  BLOODLINE_TABLES,
  slotLabelKey,
  type BloodlineSlotName,
  type SlotProps,
} from '@/modules/library/domain/slots';
import { useTranslations } from 'next-intl';
import React, { type ReactNode } from 'react';
import { readSlots, slotElementOf } from '../utils/slotElements';
import styles from '../feature/slots.module.scss';

/**
 * Props for the card
 *
 * @property {ReactNode} [children] - The page's own content
 */
export type BloodlineProps = SlotProps<BloodlineSlotName> & {
  children?: ReactNode;
};

/**
 * Bloodline card component.
 *
 * @description Reads its slots in the standalone form, because each Core
 * Features value is written on its own line and MDX hands those over as
 * elements standing alone rather than as one paragraph.
 *
 * @param {BloodlineProps} props - Card props
 * @returns {JSX.Element} The bloodline section
 */
const Bloodline: React.FC<BloodlineProps> = ({ children, ...slots }) => {
  const t = useTranslations('library');
  const { values, kept } = readSlots(children, BLOODLINE_SLOT_NAMES, slots, true);

  const tables = BLOODLINE_TABLES.map((names) =>
    names.filter((name) => values[name] !== undefined),
  ).filter((names) => names.length > 0);

  return (
    <section data-bloodline='true'>
      {tables.map((names, index) => {
        const columns: DataTableColumn[] = names.map((name) => ({
          key: name,
          header: t(slotLabelKey(name, 'Bloodline')),
        }));
        const rows: DataTableRow[] = [
          {
            key: 'values',
            cells: names.map((name) => ({
              content: values[name] as ReactNode,
              dataAttributes: { slot: name },
            })),
          },
        ];
        return (
          <DataTable
            key={names.join('-')}
            columns={columns}
            rows={rows}
            className={styles.statTable}
            dataAttributes={{ 'bloodline-core': String(index + 1) }}
          />
        );
      })}
      {kept}
    </section>
  );
};

Bloodline.displayName = 'Bloodline';

export default Bloodline;
