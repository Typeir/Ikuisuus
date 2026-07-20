/**
 * @fileoverview VirtualList Atom
 * @description Generic virtualized list using react-window v2. Renders a
 * semantic `<ul>` with virtualized `<li>` rows. Only visible rows rendered.
 *
 * @module lib/components/ui/virtualList
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import type { CSSProperties, JSX } from 'react';
import { List } from 'react-window';

/**
 * Row renderer signature. Receives item and index.
 * Row is already wrapped in a positioned element by the atom.
 *
 * @template T - Item type
 */
export type VirtualRowRenderer<T> = (
  item: T,
  index: number,
) => JSX.Element | null;

/**
 * Props for `<VirtualList>`.
 *
 * @template T - Item type
 */
export interface VirtualListProps<T> {
  /** Items to render. */
  items: T[];
  /** Pixel height per row. */
  rowHeight: number;
  /** Maximum visible height in pixels before scroll. */
  maxHeight: number;
  /** Row content renderer — receives item and index. */
  renderRow: VirtualRowRenderer<T>;
  /** HTML tag for each row. Default `'li'`. Use `'div'` when row content is already `<li>`. */
  rowElement?: 'li' | 'div';
  /** Optional className for the outer `<ul>`. */
  className?: string;
}

/**
 * Row component passed to react-window.
 * Renders a positioned wrapper element with ARIA attributes.
 *
 * @template T - Item type
 */
interface RowComponentProps<T> {
  index: number;
  style: CSSProperties;
  ariaAttributes: {
    'aria-posinset': number;
    'aria-setsize': number;
    role: 'listitem';
  };
  items: T[];
  renderRow: VirtualRowRenderer<T>;
  rowElement: 'li' | 'div';
}

function RowComponent<T>({
  index,
  style,
  ariaAttributes,
  items,
  renderRow,
  rowElement,
}: RowComponentProps<T>) {
  const item = items[index];
  if (!item) return null;
  if (rowElement === 'div') {
    return (
      <div style={style} {...ariaAttributes}>
        {renderRow(item, index)}
      </div>
    );
  }
  return (
    <li style={style} {...ariaAttributes}>
      {renderRow(item, index)}
    </li>
  );
}

/**
 * Generic virtualized list. Renders a `<ul>` with virtualized `<li>` rows.
 * Only rows within the viewport are rendered.
 *
 * @template T - Item type
 */
export function VirtualList<T>({
  items,
  rowHeight,
  maxHeight,
  renderRow,
  rowElement = 'li',
  className,
}: VirtualListProps<T>): JSX.Element | null {
  if (items.length === 0) return null;
  const height = Math.min(items.length * rowHeight, maxHeight);

  return (
    <List
      tagName='ul'
      rowCount={items.length}
      rowHeight={rowHeight}
      rowComponent={RowComponent}
      rowProps={{ items, renderRow, rowElement }}
      style={{ height }}
      defaultHeight={maxHeight}
      className={className}
    />
  );
}
