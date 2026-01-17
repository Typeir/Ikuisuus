/**
 * Sidebar Navigation Component
 *
 * @fileoverview Collapsible hierarchical content tree for navigation.
 * Renders expandable/collapsible sections with active path highlighting
 * and animated height transitions.
 *
 * @module lib/components/sidebar/sidebar
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires react
 * @requires next/link
 * @requires next/navigation
 * @requires @/lib/context/PersistentUiContext
 * @requires @/lib/components/icon/icon
 * @requires ./store/sidebarActivePath
 *
 * @description
 * Client-side navigation sidebar with:
 * - Recursive nested item rendering
 * - Sibling auto-collapse behavior
 * - Animated max-height transitions
 * - Integration with PersistentUiContext for state persistence
 *
 * @example
 * ```tsx
 * <Sidebar
 *   items={navigationTree}
 *   onNavigate={() => closeSidebar()}
 *   collapseSiblings={true}
 * />
 * ```
 */
'use client';

import { useSidebarExpansionActions } from '@/lib/context/PersistentUiContext';
import { cn } from '@/lib/utils/classNameMerge';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icon from '../icon/icon';
import styles from './sidebar.module.scss';
import { default as SidebarActivePathStore } from './store/sidebarActivePath';

/**
 * Sidebar navigation item
 *
 * @interface Item
 * @property {string} name - Display name of the item
 * @property {string} path - Routing path for the item
 * @property {Item[]} [children] - Optional nested child items
 */
export type Item = {
  name: string;
  path: string;
  children?: Item[];
};

/**
 * Layout-computed sidebar item with height metadata
 *
 * @interface LayoutItem
 * @extends Item
 * @property {number} expandedHeight - Calculated height when expanded (px)
 * @property {(LayoutItem[] | Item[])} [children] - Nested items with heights
 */
export type LayoutItem = Item & {
  expandedHeight: number;
  children?: LayoutItem[] | Item[];
};

/**
 * Base height per sidebar item in pixels
 * @constant
 * @type {number}
 */
const BASE_HEIGHT = 52;

/**
 * Recursively calculates collapsed and expanded heights for each sidebar item.
 *
 * @param {Item[]} items - The sidebar items.
 * @returns {Array<LayoutItem | undefined>} Sidebar items with height metadata.
 */
const calculateHeights = (items: Item[]): Array<LayoutItem> => {
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
  });

  const label = (it: Item) => it.name || it.path;

  const sorted = [...items].sort((a, b) => {
    const aIsFolder = Boolean(a.children && a.children.length > 0);
    const bIsFolder = Boolean(b.children && b.children.length > 0);

    if (aIsFolder !== bIsFolder) return aIsFolder ? 1 : -1;
    const byLabel = collator.compare(label(a), label(b));
    if (byLabel !== 0) return byLabel;

    return collator.compare(a.path, b.path);
  });

  return sorted.map((item) => {
    if (!item.children || item.children.length === 0) {
      return {
        ...item,
        expandedHeight: BASE_HEIGHT,
      };
    }

    const children = calculateHeights(item.children);
    const totalChildrenHeight = children.reduce(
      (sum, child) => sum + child.expandedHeight,
      0
    );

    return {
      ...item,
      children,
      expandedHeight: BASE_HEIGHT + totalChildrenHeight,
    };
  });
};

/**
 * Props for the Sidebar component
 *
 * @interface SidebarProps
 * @property {Item[]} items - The root navigation items
 * @property {() => void} [onNavigate] - Callback when a link is clicked
 * @property {boolean} [collapseSiblings=false] - If true, opening one item collapses siblings
 */
interface SidebarProps {
  items: Item[];
  onNavigate?: () => void;
  collapseSiblings?: boolean;
}

/**
 * Renders a recursive sidebar menu with optional sibling-collapsing behavior.
 *
 * @param {SidebarProps} props - Component props.
 * @returns {JSX.Element} The sidebar navigation tree.
 */
export const Sidebar = ({
  items,
  onNavigate,
  collapseSiblings = false,
}: SidebarProps): JSX.Element => {
  const shouldCollapse = items.length > 1;
  const [localPathStore] = useState(new SidebarActivePathStore());
  const [layoutItems] = useState(calculateHeights(items));

  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('[Sidebar] Rendering with items:', {
      itemCount: items.length,
      layoutItemCount: layoutItems.length,
      firstItems: items.slice(0, 3).map(i => ({ name: i.name, path: i.path, hasChildren: Boolean(i.children?.length) })),
    });
  }

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

/**
 * Props for SidebarItem component
 *
 * @interface SidebarItemProps
 * @property {LayoutItem} item - The item to render
 * @property {() => void} [onNavigate] - Navigation callback
 * @property {boolean} collapseSiblings - Whether to collapse other items when opening
 * @property {SidebarActivePathStore} pathStore - Active path store instance
 */
interface SidebarItemProps {
  item: LayoutItem;
  onNavigate?: () => void;
  collapseSiblings: boolean;
  pathStore: SidebarActivePathStore;
}

/**
 * Recursive SidebarItem that renders a link or a collapsible folder.
 *
 * @param {SidebarItemProps} props - Component props.
 * @param {Item} props.item - The item to render.
 * @param {() => void=} props.onNavigate - Optional navigation callback.
 * @param {boolean} props.collapseSiblings - Whether to collapse other items.
 * @param {SidebarActivePathStore} props.pathStore - the open/closed path store.
 * @returns {JSX.Element | null} Sidebar entry element or null if no valid data.
 */
const SidebarItem = ({
  item,
  onNavigate,
  collapseSiblings,
  pathStore,
}: SidebarItemProps): JSX.Element | null => {
  const { isExpanded, setExpanded } = useSidebarExpansionActions();
  // Initialize as collapsed to match SSR - useEffect will sync after hydration
  const [open, setOpen] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const params = useParams();
  const locale = params?.locale as string;
  const index = item?.children?.findIndex(
    (child) => child.name.toLowerCase() === 'main'
  );

  // Hydration sync - run once after mount to sync with persisted state
  useEffect(() => {
    const expanded = isExpanded(item.path);
    setOpen(expanded);
    setIsHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync local state with context when expansion state changes (after hydration)
  useEffect(() => {
    if (!isHydrated) return;
    const expanded = isExpanded(item.path);
    if (expanded !== open) {
      setOpen(expanded);
    }
  }, [isExpanded, item.path, open, isHydrated]);

  useEffect(() => {
    return pathStore.subscribe((path: any) => {
      if (collapseSiblings && path !== item.path) {
        setOpen(false);
      }
    });
  }, [collapseSiblings, item.path, pathStore]);

  const toggle = (e?: React.MouseEvent): void => {
    const nextState = !open;
    setOpen(nextState);
    setExpanded(item.path, nextState);
    e?.preventDefault();
    if (collapseSiblings && nextState) {
      pathStore.set(item.path);
    }
  };

  if (index !== undefined && index !== -1) {
    const children = [...(item.children as LayoutItem[])];
    const indexedItem = children?.splice(index, 1)[0];

    return (
      <li className={cn('ml-2', styles.accordion, open && styles.open)}>
        <Link
          href={`/${locale}/library/${indexedItem.path}`}
          onClick={() => open && onNavigate && onNavigate()}
          className={cn(
            'text-accent hover:underline block',
            styles['link-item']
          )}>
          <div
            className={cn(
              'text-lg cursor-pointer font-bold',
              styles.label,
              open && styles.open
            )}
            onClick={() => !open && toggle()}>
            <p>{item.name}</p>
            <Icon
              onClick={toggle}
              type='arrow'
              className={cn(styles.arrow, open && styles.open)}
            />
          </div>
        </Link>
        <div
          className={cn(styles.content, open && styles.expanded)}
          style={{
            maxHeight: open ? `${item.expandedHeight}px` : '0px',
            transition: 'max-height 0.5s var(--springy-bezier)',
            overflow: 'hidden',
          }}>
          <Sidebar
            items={children as LayoutItem[]}
            onNavigate={onNavigate}
            collapseSiblings={collapseSiblings}
          />
        </div>
      </li>
    );
  }

  if (item.children?.length === 0) {
    return null;
  } else if (item.children) {
    return (
      <li className={cn('ml-2', styles.accordion, open && styles.open)}>
        <div
          className={cn(
            'text-lg cursor-pointer font-bold',
            styles.label,
            open && styles.open
          )}
          onClick={toggle}>
          <p>{item.name}</p>
          <Icon
            type='arrow'
            className={cn(styles.arrow, open && styles.open)}
          />
        </div>
        <div
          className={cn(styles.content, open && styles.expanded)}
          style={{
            maxHeight: open ? `${item.expandedHeight}px` : '0px',
            transition: 'max-height 0.5s var(--springy-bezier)',
            overflow: 'hidden',
          }}>
          <Sidebar
            items={item.children}
            onNavigate={onNavigate}
            collapseSiblings={collapseSiblings}
          />
        </div>
      </li>
    );
  }

  return (
    <li className='ml-4'>
      <Link
        href={`/${locale}/library/${item.path}`}
        onClick={onNavigate}
        className={cn(
          'text-accent hover:underline block',
          styles['link-item']
        )}>
        {item.name}
      </Link>
    </li>
  );
};
