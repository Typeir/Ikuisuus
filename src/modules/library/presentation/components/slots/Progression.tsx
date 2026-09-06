/**
 * @fileoverview Progression table of a vocation, built from what the page
 * declares: `<Progression>` attributes, its `<Column>` children, and the
 * feature headings of the enclosing card.
 * @module modules/library/presentation/components/slots/Progression
 * @version 0.1.0
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
  type ColumnEntry,
  type ColumnSpec,
  type FeatureCell,
} from '@/modules/library/domain/progression';
import { useTranslations } from 'next-intl';
import React, { type ReactNode } from 'react';
import { cleanChildren } from './slotElements';
import { flagOf } from './text';
import { useVocationFeatures } from './vocationFeatures';

/**
 * Props of a column: a label, and either one value per level or Row children.
 *
 * @property {string} label - Column heading
 * @property {readonly (string | number)[]} [values] - One value per level from level 1
 * @property {ReactNode} [children] - Row elements
 */
export interface ColumnProps {
  label: string;
  values?: readonly (string | number)[];
  children?: ReactNode;
}

/**
 * Props of a row: where it starts, whether it stays there, and its value.
 *
 * @property {string | number} [at] - Level the value starts at
 * @property {unknown} [unique] - Print at this level only
 * @property {ReactNode} [children] - Value
 */
export interface RowProps {
  at?: string | number;
  unique?: unknown;
  children?: ReactNode;
}

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
 * A column of the table; renders nothing itself.
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
 * Elements of one component type among nodes, looking through paragraphs
 * and fragments.
 *
 * @param {ReactNode} nodes - Nodes
 * @param {string} name - Component display name
 * @returns {React.ReactElement<P>[]} Matching elements in order
 */
function elementsNamed<P>(nodes: ReactNode, name: string): React.ReactElement<P>[] {
  const out: React.ReactElement<P>[] = [];
  for (const node of cleanChildren(nodes)) {
    if (!React.isValidElement(node)) continue;
    const type = node.type as { displayName?: string; name?: string } | string;
    const typeName = typeof type === 'string' ? type : type.displayName || type.name || '';
    if (typeName === name) {
      out.push(node as React.ReactElement<P>);
    } else if (typeName === 'p' || typeName === '' || type === React.Fragment) {
      out.push(...elementsNamed<P>((node.props as { children?: ReactNode }).children, name));
    }
  }
  return out;
}

/**
 * The column specs the children declare.
 *
 * @param {ReactNode} children - Progression children
 * @returns {ColumnSpec<ReactNode>[]} Columns in order
 */
function columnsOf(children: ReactNode): ColumnSpec<ReactNode>[] {
  return elementsNamed<ColumnProps>(children, 'Column').map((column) => {
    const { label, values } = column.props;
    if (values) return { label, values: values.map((v) => String(v)) };
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
