/**
 * @fileoverview Virtualized list renderer for sidebar folders with many children.
 * Renders a `List` from `react-window` instead of the full recursive
 * `Sidebar` tree when the child count exceeds `VIRTUALIZE_THRESHOLD`.
 *
 * @module lib/components/sidebar/VirtualizedSidebar
 * @author Typeir
 * @version 2.0.0
 * @since 2.1.0
 */
'use client';

import type { CSSProperties } from 'react';
import { List } from 'react-window';
import type { LayoutItem } from './sidebar';
import { Sidebar } from './sidebar';

/**
 * Number of items in a folder that triggers virtualization.
 * Below this threshold the normal recursive `Sidebar` is used.
 *
 * @constant
 * @type {number}
 */
export const VIRTUALIZE_THRESHOLD = 100;

/**
 * Pixel height of a single row in the virtualized list.
 * Must match `BASE_HEIGHT` in `sidebar.tsx` (52 px).
 *
 * @constant
 * @type {number}
 */
const ITEM_ROW_HEIGHT = 52;

/**
 * Maximum pixel height of the virtualized window before scrolling.
 * Caps the container so the sidebar does not push other content off screen.
 *
 * @constant
 * @type {number}
 */
const MAX_WINDOW_HEIGHT = 600;

/**
 * Props for `VirtualizedSidebar`.
 *
 * @interface VirtualizedSidebarProps
 * @property {LayoutItem[]} items - Folder children to virtualize.
 * @property {() => void} [onNavigate] - Navigation callback forwarded to each row.
 * @property {boolean} [collapseSiblings=false] - Forwarded to each row's `Sidebar`.
 */
export interface VirtualizedSidebarProps {
  items: LayoutItem[];
  onNavigate?: () => void;
  collapseSiblings?: boolean;
}

/**
 * Extra props forwarded to each row component via `rowProps`.
 *
 * @interface VirtualRowProps
 * @property {LayoutItem[]} items - Full item list; the row renders `items[index]`.
 * @property {() => void} [onNavigate] - Navigation callback.
 * @property {boolean} collapseSiblings - Whether sibling folders collapse.
 */
interface VirtualRowProps {
  items: LayoutItem[];
  onNavigate?: () => void;
  collapseSiblings: boolean;
}

/**
 * Row renderer passed to `List` via `rowComponent`.
 * Renders a single `LayoutItem` via the recursive `Sidebar` component so that
 * nested folders remain fully expandable within the virtualized window.
 *
 * @param {object} props - react-window v2 row props combined with `VirtualRowProps`.
 * @returns {JSX.Element} A single sidebar row wrapped in a positioned container.
 */
const VirtualRow = ({
  index,
  style,
  ariaAttributes,
  items,
  onNavigate,
  collapseSiblings,
}: {
  ariaAttributes: {
    'aria-posinset': number;
    'aria-setsize': number;
    role: 'listitem';
  };
  index: number;
  style: CSSProperties;
} & VirtualRowProps): JSX.Element => (
  <div style={style} {...ariaAttributes}>
    <Sidebar
      items={[items[index]]}
      onNavigate={onNavigate}
      collapseSiblings={collapseSiblings}
    />
  </div>
);

/**
 * Renders a folder's children as a virtualized list when the item count is high.
 * Uses a fixed-size row of `ITEM_ROW_HEIGHT` px and caps the visible window at
 * `MAX_WINDOW_HEIGHT` px, showing a scrollable list beyond that.
 *
 * @param {VirtualizedSidebarProps} props - Component props.
 * @param {LayoutItem[]} props.items - Folder children to render virtually.
 * @param {() => void=} props.onNavigate - Optional navigation callback.
 * @param {boolean} [props.collapseSiblings=false] - Whether sibling folders collapse.
 * @returns {JSX.Element} A virtualized sidebar list.
 */
const VirtualizedSidebar = ({
  items,
  onNavigate,
  collapseSiblings = false,
}: VirtualizedSidebarProps): JSX.Element => {
  const windowHeight = Math.min(
    items.length * ITEM_ROW_HEIGHT,
    MAX_WINDOW_HEIGHT,
  );

  return (
    <List
      rowCount={items.length}
      rowHeight={ITEM_ROW_HEIGHT}
      rowComponent={VirtualRow}
      rowProps={{ items, onNavigate, collapseSiblings }}
      style={{ height: windowHeight }}
      defaultHeight={MAX_WINDOW_HEIGHT}
    />
  );
};

export default VirtualizedSidebar;
