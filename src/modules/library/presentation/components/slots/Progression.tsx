/**
 * @fileoverview Progression table of a vocation, built from what the page
 * declares
 * @module modules/library/presentation/components/slots/Progression
 * @version 0.2.0
 * @author Typeir
 * @since 2026-09-06
 */

'use client';

import { DataTable, type DataTableColumn } from '@/lib/components/ui/dataTable';
import { CASTING_KINDS, type CastingKind } from '@/modules/library/domain/castingTables';
import {
  buildProgression,
  parseLevels,
  parseSpecialization,
  splitList,
  type ColumnEntry,
  type ColumnSpec,
  type FeatureCell,
} from '@/modules/library/domain/progression';
import { useTranslations } from 'next-intl';
import React, { type ReactNode } from 'react';
import { elementsNamed, type ColumnProps, type RowProps } from './columns';
import { flagOf } from './text';
import { useVocationFeatures } from './vocationFeatures';

export type { ColumnProps, RowProps } from './columns';

/**
 * Props of the table.
 *
 * @property {string} [casting] - Casting kind
 * @property {string} [feats] - Levels that print a feat
 * @property {string} [specialization] - `Label: levels` that print a specialization feature
 * @property {string | number} [levels] - Last level printed
 * @property {ReactNode} [children] - Column elements
 */
export interface ProgressionProps {
  casting?: string;
  feats?: string;
  specialization?: string;
  levels?: string | number;
  children?: ReactNode;
}

/**
 * A column of a declared table; renders nothing itself.
 *
 * @returns {null} Nothing
 */
export const Column: React.FC<ColumnProps> = () => null;
Column.displayName = 'Column';

/**
 * A row of a column; renders nothing itself.
 *
 * @returns {null} Nothing
 */
export const Row: React.FC<RowProps> = () => null;
Row.displayName = 'Row';

/**
 * The column specs the children declare.
 *
 * @param {ReactNode} children - Progression children
 * @returns {ColumnSpec<ReactNode>[]} Columns in order
 */
function columnsOf(children: ReactNode): ColumnSpec<ReactNode>[] {
  return elementsNamed<ColumnProps>(children, 'Column').map((column) => {
    const { label, values } = column.props;
    if (values !== undefined) return { label, values: splitList(values) };
    const entries: ColumnEntry<ReactNode>[] = elementsNamed<RowProps>(column.props.children, 'Row').map((row) => {
      const at = row.props.at === undefined ? undefined : Number(row.props.at);
      return {
        at: at !== undefined && Number.isInteger(at) && at > 0 ? at : undefined,
        value: row.props.children,
        unique: flagOf(row.props.unique) === true,
      };
    });
    return { label, entries };
  });
}

/**
 * A features cell as nodes, names separated by commas.
 *
 * @param {FeatureCell<ReactNode>[]} features - Cell
 * @param {string} none - What an empty cell prints
 * @returns {ReactNode} Cell content
 */
function featuresNodes(features: FeatureCell<ReactNode>[], none: string): ReactNode {
  if (features.length === 0) return none;
  return features.map((feature, index) => (
    <React.Fragment key={index}>
      {index > 0 && ', '}
      {feature.value}
    </React.Fragment>
  ));
}

/**
 * Progression table component.
 *
 * @param {ProgressionProps} props - Props
 * @returns {JSX.Element} The table
 */
const Progression: React.FC<ProgressionProps> = ({ casting, feats, specialization, levels, children }) => {
  const t = useTranslations('library.progression');
  const headings = useVocationFeatures();
  const kind = CASTING_KINDS.find((k) => k === casting?.trim().toLowerCase()) as CastingKind | undefined;
  const last = Number(levels);
  const table = buildProgression<ReactNode>(
    {
      casting: kind,
      feats: parseLevels(feats),
      specialization: parseSpecialization(specialization),
      headings,
      columns: columnsOf(children),
      levels: Number.isInteger(last) && last > 0 ? last : undefined,
    },
    { feat: t('feat'), specialization: (label) => t('specializationFeature', { label }) },
  );
  const none = t('none');
  const columns: DataTableColumn[] = [
    { key: 'level', header: t('level') },
    { key: 'tierBonus', header: t('tierBonus') },
    { key: 'features', header: t('features') },
    ...table.columns.map((label, index) => ({ key: `c${index}`, header: label })),
  ];
  const rows = table.rows.map((row) => ({
    key: String(row.level),
    cells: [
      row.level,
      `+${row.tierBonus}`,
      featuresNodes(row.features, none),
      ...row.cells.map((cell) => (cell === undefined || cell === '' ? none : cell)),
    ],
  }));
  return <DataTable columns={columns} rows={rows} dataAttributes={{ progression: kind ?? 'none' }} />;
};

Progression.displayName = 'Progression';

export default Progression;
