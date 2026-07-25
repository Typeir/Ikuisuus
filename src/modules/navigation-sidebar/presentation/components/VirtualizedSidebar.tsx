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
import { useMemo, useState } from 'react';
import { SidebarItem } from './SidebarItem';

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
 * Must match `BASE_HEIGHT` in `sidebar.tsx` (20 px).
 *
 * @constant
 * @type {number}
 */
const ITEM_ROW_HEIGHT = 20;

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
