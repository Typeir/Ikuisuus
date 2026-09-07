/**
 * @fileoverview Presentational table: columns and rows in, a scrollable
 * `<table>` out.
 * @module lib/components/ui/dataTable/dataTable
 * @version 0.2.0
 * @author Typeir
 * @since 2026-09-06
 */

'use client';

import { cn } from '@/lib/utils/classNameMerge';
import React, { type ReactNode } from 'react';
import styles from './dataTable.module.scss';

/**
 * A cell with attributes of its own.
 *
 * @property {ReactNode} content - Cell content
 * @property {string} [className] - Class on the cell
 * @property {number} [colSpan] - Columns spanned
 * @property {boolean} [header] - Render as a row header (`<th scope="row">`)
 * @property {Record<string, string>} [dataAttributes] - `data-*` attributes, keyed without the prefix
 */
export interface DataTableCellSpec {
  content: ReactNode;
  className?: string;
  colSpan?: number;
  header?: boolean;
  dataAttributes?: Record<string, string>;
}

/**
 * A cell: content alone, or content with attributes.
 */
export type DataTableCell = ReactNode | DataTableCellSpec;

/**
 * One column.
 *
 * @property {string} key - Stable key
 * @property {ReactNode} header - Header content
 * @property {string} [className] - Class on the header cell
 * @property {() => void} [onHeaderClick] - Makes the header a button that calls this
 * @property {'ascending' | 'descending' | 'none'} [sort] - Current sort of the column, for `aria-sort`
 * @property {string} [ariaLabel] - Accessible name for a header without text
 */
export interface DataTableColumn {
  key: string;
  header: ReactNode;
  className?: string;
  onHeaderClick?: () => void;
  sort?: 'ascending' | 'descending' | 'none';
  ariaLabel?: string;
}

/**
 * One row.
 *
 * @property {string} key - Stable key
 * @property {DataTableCell[]} cells - Cells in column order; a row covering fewer columns than the header is padded with empty cells
 * @property {string} [className] - Class on the row
 */
export interface DataTableRow {
  key: string;
  cells: DataTableCell[];
  className?: string;
}

/**
 * Props.
 *
 * @property {DataTableColumn[]} columns - Columns in order
 * @property {DataTableRow[]} rows - Body rows in order
 * @property {DataTableRow[]} [footer] - Footer rows
 * @property {ReactNode} [caption] - Table caption; nothing renders for an empty one
 * @property {string} [className] - Class merged onto the table
 * @property {string} [wrapperClassName] - Class merged onto the scroll wrapper
 * @property {boolean} [fixed] - Equal column widths
 * @property {string} [id] - Table id
 * @property {string} [ariaLabel] - Accessible name
 * @property {string} [ariaLabelledBy] - Id of the element naming the table
 * @property {Record<string, string>} [dataAttributes] - `data-*` attributes on the table, keyed without the prefix
 */
export interface DataTableProps {
  columns: DataTableColumn[];
  rows: DataTableRow[];
  footer?: DataTableRow[];
  caption?: ReactNode;
  className?: string;
  wrapperClassName?: string;
  fixed?: boolean;
  id?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  dataAttributes?: Record<string, string>;
}

/**
 * `data-*` attributes from a record, keys kebab-cased, empty keys dropped.
 *
 * @param {Record<string, string>} [record] - Attributes keyed without the prefix
 * @returns {Record<string, string>} Attributes ready to spread
 */
function dataProps(record?: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(record ?? {})) {
    const name = key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`).replace(/^-/, '');
    if (name) out[`data-${name}`] = value;
  }
  return out;
}

/**
 * Whether a cell carries attributes.
 *
 * @param {DataTableCell} cell - Cell
 * @returns {boolean} True for a spec
 */
function isSpec(cell: DataTableCell): cell is DataTableCellSpec {
  return (
    typeof cell === 'object' &&
    cell !== null &&
    !Array.isArray(cell) &&
    !React.isValidElement(cell) &&
    'content' in cell
  );
}

/**
 * One rendered row, padded to the column count.
 *
 * @param {DataTableRow} row - Row
 * @param {DataTableColumn[]} columns - Columns
 * @returns {JSX.Element} The row
 */
function renderRow(row: DataTableRow, columns: DataTableColumn[]): React.JSX.Element {
  const cells: DataTableCell[] = [...row.cells];
  const covered = (): number =>
    cells.reduce<number>((n, cell) => n + (isSpec(cell) ? (cell.colSpan ?? 1) : 1), 0);
  while (covered() < columns.length) cells.push('');
  return (
    <tr key={row.key} className={row.className}>
      {cells.map((cell, index) => {
        const key = `${row.key}-${columns[index]?.key ?? index}`;
        if (!isSpec(cell)) return <td key={key}>{cell}</td>;
        const attributes = { className: cell.className, colSpan: cell.colSpan, ...dataProps(cell.dataAttributes) };
        return cell.header ? (
          <th key={key} scope='row' {...attributes}>
            {cell.content}
          </th>
        ) : (
          <td key={key} {...attributes}>
            {cell.content}
          </td>
        );
      })}
    </tr>
  );
}

/**
 * Data table.
 *
 * @param {DataTableProps} props - Props
 * @returns {JSX.Element} The table in its scroll wrapper
 */
export const DataTable: React.FC<DataTableProps> = ({
  columns,
  rows,
  footer,
  caption,
  className,
  wrapperClassName,
  fixed = false,
  id,
  ariaLabel,
  ariaLabelledBy,
  dataAttributes,
}) => {
  const hasCaption = caption !== undefined && caption !== null && caption !== '';
  return (
    <div className={cn(styles.wrapper, wrapperClassName)}>
      <table
        id={id}
        className={cn(fixed && styles.fixed, className) || undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        {...dataProps(dataAttributes)}>
        {hasCaption && <caption>{caption}</caption>}
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope='col'
                className={column.className}
                aria-label={column.ariaLabel}
                aria-sort={column.sort}>
                {column.onHeaderClick ? (
                  <button type='button' className={styles.headerButton} onClick={column.onHeaderClick}>
                    {column.header}
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{rows.map((row) => renderRow(row, columns))}</tbody>
        {footer && footer.length > 0 && <tfoot>{footer.map((row) => renderRow(row, columns))}</tfoot>}
      </table>
    </div>
  );
};

DataTable.displayName = 'DataTable';
