/**
 * @fileoverview Virtualized list renderer for sidebar folders with many children.
 * Uses the shared `VirtualList` atom instead of the full recursive
 * `Sidebar` tree when the child count exceeds `VIRTUALIZE_THRESHOLD`.
 *
 * @module modules/navigation-sidebar/presentation/components/VirtualizedSidebar
 * @author Typeir
 * @version 3.0.0
 * @since 2.1.0
 */
'use client';

import { VirtualList } from '@/lib/components/ui/virtualList/virtualList';
import type { LayoutItem } from '@/modules/navigation-sidebar/domain/types';
import SidebarActivePathStore from '@/modules/navigation-sidebar/infrastructure/store/sidebarActivePath';
import { useLeafRowPitch } from '@/modules/navigation-sidebar/application/hooks/useLeafRowPitch';
import { calculateHeights } from '@/modules/navigation-sidebar/infrastructure/tree-walk/calculateHeights';
import { useParams } from 'next/navigation';
import type { JSX } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { SidebarItem } from './SidebarItem';
import { SidebarLeafRow } from './SidebarLeafRow';

/**
 * Number of items in a folder that triggers virtualization.
 * Below this threshold the normal recursive `Sidebar` is used.
 *
 * @constant
 * @type {number}
 */
export const VIRTUALIZE_THRESHOLD = 50;

/**
 * Maximum pixel height of the virtualized window before scrolling.
 *
 * @constant
 * @type {number}
 */
const MAX_WINDOW_HEIGHT = 600;

/**
 * Rows rendered beyond the visible window on each side. react-window defaults
 * to 3, which fast scrolling outruns; 12 rows buys about half a window of
 * runway now that leaf rows are cheap to mount.
 *
 * @constant
 * @type {number}
 */
const OVERSCAN_ROWS = 12;

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
 * Leaf rows render the hook-free `SidebarLeafRow`; folders and stubs render
 * `SidebarItem` — one shared `<ul>` via `VirtualList`, no per-row `<ul>` wrapper.
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
  const params = useParams();
  const locale = params?.locale as string;
  const rowHeight = useLeafRowPitch();
  const windowHeight = Math.min(items.length * rowHeight, MAX_WINDOW_HEIGHT);

  const renderRow = useCallback(
    (item: LayoutItem) =>
      item.children !== undefined || item.isStub ? (
        <SidebarItem
          item={item}
          onNavigate={onNavigate}
          collapseSiblings={collapseSiblings}
          pathStore={pathStore}
        />
      ) : (
        <SidebarLeafRow item={item} locale={locale} onNavigate={onNavigate} />
      ),
    [onNavigate, collapseSiblings, pathStore, locale],
  );

  return (
    <VirtualList
      items={layoutItems}
      rowHeight={rowHeight}
      maxHeight={windowHeight}
      rowElement='div'
      overscanCount={OVERSCAN_ROWS}
      renderRow={renderRow}
    />
  );
};

export default VirtualizedSidebar;
