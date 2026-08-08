/**
 * @fileoverview Virtualized list renderer for sidebar folders with many children.
 * Uses the shared `VirtualList` atom instead of the full recursive
 * `Sidebar` tree when the child count exceeds `VIRTUALIZE_THRESHOLD`.
 *
 * @module lib/components/sidebar/VirtualizedSidebar
 * @author Typeir
 * @version 3.0.0
 * @since 2.1.0
 */
'use client';

import { VirtualList } from '@/lib/components/ui/virtualList/virtualList';
import type { LayoutItem } from '@/modules/navigation-sidebar/domain/types';
import SidebarActivePathStore from '@/modules/navigation-sidebar/infrastructure/store/sidebarActivePath';
import { calculateHeights } from '@/modules/navigation-sidebar/infrastructure/tree-walk/calculateHeights';
import type { JSX } from 'react';
import { useMemo, useState } from 'react';
import { SidebarItem } from './SidebarItem';

/**
 * Number of items in a folder that triggers virtualization.
 * Below this threshold the normal recursive `Sidebar` is used.
 *
 * At 50 the mid-sized flat folders — monsters (73) and heirlooms (71) — stop
 * mounting every row.
 *
 * @constant
 * @type {number}
 */
export const VIRTUALIZE_THRESHOLD = 50;

/**
 * Pixel pitch of a single row in the virtualized list.
 *
 * Measured from the non-virtualized list so both paths lay rows out identically:
 * a leaf `li` is 20 px tall and `space-y-1` adds a 4 px gap between siblings.
 * Virtualized rows are absolutely positioned and never receive that margin, so
 * the gap has to live in the row pitch. The previous 20 px was the content height
 * with the gap dropped, which butted every row against the next.
 *
 * Unrelated to `BASE_HEIGHT` (52), which sizes the accordion's `--expanded-height`
 * rather than a rendered row — an earlier comment here conflated the two.
 *
 * @constant
 * @type {number}
 */
const ITEM_ROW_HEIGHT = 24;

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
 * @property {boolean} [collapseSiblings=false] - Whether sibling folders collapse.
 */
export interface VirtualizedSidebarProps {
  items: LayoutItem[];
  onNavigate?: () => void;
  collapseSiblings?: boolean;
}

/**
 * Renders a folder's children as a virtualized list when the item count is high.
 * Each row renders a `SidebarItem` directly — one shared `<ul>` via `VirtualList`,
 * no per-row `<ul>` wrapper.
 *
 * @param {VirtualizedSidebarProps} props - Component props.
 * @param {LayoutItem[]} props.items - Folder children to virtualize.
 * @param {() => void} [props.onNavigate] - Navigation callback forwarded to each row.
 * @param {boolean} [props.collapseSiblings=false] - Whether sibling folders collapse.
 * @returns {JSX.Element} A virtualized sidebar list.
 */
const VirtualizedSidebar = ({
  items,
  onNavigate,
  collapseSiblings = false,
}: VirtualizedSidebarProps): JSX.Element => {
  const [pathStore] = useState(() => new SidebarActivePathStore());
  const layoutItems = useMemo(() => calculateHeights(items), [items]);
  const windowHeight = Math.min(
    items.length * ITEM_ROW_HEIGHT,
    MAX_WINDOW_HEIGHT,
  );

  return (
    <VirtualList
      items={layoutItems}
      rowHeight={ITEM_ROW_HEIGHT}
      maxHeight={windowHeight}
      rowElement='div'
      renderRow={(item) => (
        <SidebarItem
          item={item}
          onNavigate={onNavigate}
          collapseSiblings={collapseSiblings}
          pathStore={pathStore}
        />
      )}
    />
  );
};

export default VirtualizedSidebar;
