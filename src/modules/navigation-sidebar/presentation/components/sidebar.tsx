/**
 * @fileoverview Collapsible hierarchical content tree orchestrator
 *
 * @module lib/components/sidebar/sidebar
 * @author Typeir
 * @version 2.0.0
 * @since 2.0.0
 */
'use client';

import type {
    Item,
    SidebarProps,
} from '@/modules/navigation-sidebar/domain/types';
import SidebarActivePathStore from '@/modules/navigation-sidebar/infrastructure/store/sidebarActivePath';
import { calculateHeights } from '@/modules/navigation-sidebar/infrastructure/tree-walk/calculateHeights';
import type { JSX } from 'react';
import { useMemo, useState } from 'react';
import { SidebarItem } from './SidebarItem';

/**
 * Renders a recursive sidebar menu with optional sibling-collapsing behavior.
 *
 * @param {SidebarProps} props - Component props.
 * @param {Item[]} props.items - The root navigation items
 * @param {() => void} [props.onNavigate] - Callback when a link is clicked
 * @param {boolean} [props.collapseSiblings=false] - If true, opening one item collapses siblings
 * @returns {JSX.Element} The sidebar navigation tree.
 */
export const Sidebar = ({
  items,
  onNavigate,
  collapseSiblings = false,
}: SidebarProps): JSX.Element => {
  const shouldCollapse = items.length > 1;
  const [localPathStore] = useState(new SidebarActivePathStore());
  const layoutItems = useMemo(() => calculateHeights(items), [items]);

  return (
    <ul className='space-y-1 text-sm'>
      {layoutItems.map((item) => (
        <SidebarItem
          key={item.path}
          item={item}
          onNavigate={onNavigate}
          collapseSiblings={shouldCollapse && collapseSiblings}
          pathStore={localPathStore}
        />
      ))}
    </ul>
  );
};
