# sidebar
## calculateHeights.ts
```ts
/**
 * @fileoverview Height calculation utility for sidebar items
 * @module lib/components/sidebar/calculateHeights
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import { BASE_HEIGHT } from './constants';
import type { Item, LayoutItem } from './types';

/**
 * Recursively calculates collapsed and expanded heights for each sidebar item.
 * Sorts items by folder status (folders first), then alphabetically.
 *
 * @param {Item[]} items - The sidebar items to process
 * @returns {LayoutItem[]} Sidebar items with calculated height metadata
 */
export const calculateHeights = (items: Item[]): LayoutItem[] => {
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
  });

  const label = (it: Item) => it.name || it.path;

  const sorted = [...items].sort((a, b) => {
    const aIsFolder = Boolean(a.children && a.children.length > 0);
    const bIsFolder = Boolean(b.children && b.children.length > 0);

    if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1;
    const byLabel = collator.compare(label(a), label(b));
    if (byLabel !== 0) return byLabel;

    return collator.compare(a.path, b.path);
  });

  return sorted.map((item) => {
    if (item.isStub) {
      return {
        ...item,
        expandedHeight: BASE_HEIGHT + (item.childCount ?? 1) * BASE_HEIGHT,
      };
    }

    if (!item.children || item.children.length === 0) {
      return {
        ...item,
        expandedHeight: BASE_HEIGHT,
      };
    }

    const children = calculateHeights(item.children);
    const totalChildrenHeight = children.reduce(
      (sum, child) => sum + child.expandedHeight,
      0,
    );

    return {
      ...item,
      children,
      expandedHeight: BASE_HEIGHT + totalChildrenHeight,
    };
  });
};
```
--------------
## constants.ts
```ts
/**
 * @fileoverview Constants for sidebar layout and animation
 * @module lib/components/sidebar/constants
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

/**
 * Base height per sidebar item in pixels
 * @constant
 * @type {number}
 */
export const BASE_HEIGHT = 52;

/**
 * Duration in milliseconds that matches the `max-height` CSS closing
 * transition defined in `sidebar.module.scss`. Children stay mounted for
 * this window so the collapse animation fully plays before the subtree
 * is unmounted.
 *
 * @constant
 * @type {number}
 */
export const SIDEBAR_CLOSE_ANIMATION_MS = 500;
```
--------------
## sidebar.module.scss
```scss
<!-- Error reading file: 'charmap' codec can't encode character '\u25b9' in position 218: character maps to <undefined> -->
```
--------------
## sidebar.tsx
```tsx
/**
 * @fileoverview Collapsible hierarchical content tree orchestrator
 *
 * @module lib/components/sidebar/sidebar
 * @author Typeir
 * @version 2.0.0
 * @since 2.0.0
 */
'use client';

import { useMemo, useState } from 'react';
import { SidebarItem } from './SidebarItem';
import { calculateHeights } from './calculateHeights';
import { default as SidebarActivePathStore } from './store/sidebarActivePath';
import type { Item, SidebarProps } from './types';

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
```
--------------
## SidebarClient.tsx
```tsx
/**
 * @fileoverview Interactive sidebar client entry. Exports the Sidebar component
 * as the default export so it can be lazily loaded via next/dynamic from SidebarShell.
 *
 * @module lib/components/sidebar/SidebarClient
 * @author Typeir
 * @version 1.0.0
 * @since 2.1.0
 */

'use client';

import { Sidebar } from './sidebar';
import type { Item, LayoutItem, SidebarProps } from './types';

export default Sidebar;
export type { Item, LayoutItem, SidebarProps };
```
--------------
## SidebarItem.tsx
```tsx
/**
 * @fileoverview Recursive sidebar item component
 * @module lib/components/sidebar/SidebarItem
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */
'use client';

import { useSidebarExpansionActions } from '@/lib/context/PersistentUiContext';
import { cn } from '@/lib/utils/classNameMerge';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../icon/icon';
import { SkeletonSidebarItems } from './SkeletonSidebarItems';
import { VIRTUALIZE_THRESHOLD } from './VirtualizedSidebar';
import { SIDEBAR_CLOSE_ANIMATION_MS } from './constants';
import styles from './sidebar.module.scss';
import type { LayoutItem, SidebarItemProps } from './types';
import { useFetchStubChildren } from './useFetchStubChildren';

const VirtualizedSidebar = dynamic(() => import('./VirtualizedSidebar'), {
  ssr: false,
});

const Sidebar = dynamic(
  () => import('./sidebar').then((mod) => ({ default: mod.Sidebar })),
  {
    ssr: false,
  },
);

/**
 * Recursive SidebarItem that renders a link or a collapsible folder.
 * Children are lazily mounted on first open and kept mounted through the
 * closing animation (driven by `isClosing`) before unmounting.
 *
 * @param {SidebarItemProps} props - Component props.
 * @param {LayoutItem} props.item - The item to render.
 * @param {() => void=} props.onNavigate - Optional navigation callback.
 * @param {boolean} props.collapseSiblings - Whether to collapse other items.
 * @param {any} props.pathStore - the open/closed path store.
 * @returns {JSX.Element | null} Sidebar entry element or null if no valid data.
 */
export const SidebarItem = ({
  item,
  onNavigate,
  collapseSiblings,
  pathStore,
}: SidebarItemProps): JSX.Element | null => {
  const { isExpanded, setExpanded } = useSidebarExpansionActions();
  const [open, setOpen] = useState<boolean>(() => isExpanded(item.path));
  const [isHydrated, setIsHydrated] = useState(false);
  const [mounted, setMounted] = useState<boolean>(() => isExpanded(item.path));
  const [isClosing, setIsClosing] = useState(false);
  const openRef = useRef(false);
  const params = useParams();
  const locale = params?.locale as string;
  const [localExpandedHeight, setLocalExpandedHeight] = useState<number | null>(
    null,
  );

  const {
    stubChildren,
    isFetchingChildren,
    localExpandedHeight: hookHeight,
  } = useFetchStubChildren(open, !!item.isStub, item.path, locale);

  const effectiveChildren = useMemo(() => {
    if (item.isStub) return stubChildren ?? [];
    return item.children ?? [];
  }, [item.isStub, item.children, stubChildren]);

  const index = effectiveChildren.findIndex(
    (child) => child.name.toLowerCase() === 'main',
  );

  useEffect(() => {
    openRef.current = open;
    setIsHydrated(true);
  }, [open]);

  useEffect(() => {
    if (!isHydrated) return;
    const expanded = isExpanded(item.path);
    if (expanded !== open) {
      openRef.current = expanded;
      setOpen(expanded);
      if (expanded) {
        setMounted(true);
        setIsClosing(false);
      } else {
        setIsClosing(true);
      }
    }
  }, [isExpanded, item.path, open, isHydrated]);

  useEffect(() => {
    return pathStore.subscribe((path: string | null) => {
      if (collapseSiblings && path !== item.path) {
        if (openRef.current) setIsClosing(true);
        openRef.current = false;
        setOpen(false);
      }
    });
  }, [collapseSiblings, item.path, pathStore]);

  const toggle = (e?: React.MouseEvent): void => {
    const nextState = !open;
    openRef.current = nextState;
    if (nextState) {
      setMounted(true);
      setIsClosing(false);
    } else {
      setIsClosing(true);
    }
    setOpen(nextState);
    setExpanded(item.path, nextState);
    e?.preventDefault();
  };

  useEffect(() => {
    if (!isClosing) return;
    const timerId = setTimeout(() => {
      if (!openRef.current) {
        setIsClosing(false);
        setMounted(false);
      }
    }, SIDEBAR_CLOSE_ANIMATION_MS);
    return () => clearTimeout(timerId);
  }, [isClosing]);

  useEffect(() => {
    if (hookHeight !== null) {
      setLocalExpandedHeight(hookHeight);
    }
  }, [hookHeight]);

  const hasIndex =
    (index !== undefined && index !== -1) ||
    (item.isStub && stubChildren === null && !!item.mainPath);

  const folderChildren = useMemo(() => {
    if (item.isStub && stubChildren === null) {
      return { items: [] as LayoutItem[], mainPath: item.mainPath ?? null };
    }
    if (!effectiveChildren.length && !item.isStub)
      return { items: [] as LayoutItem[], mainPath: null };
    if (!hasIndex || index === -1)
      return { items: effectiveChildren as LayoutItem[], mainPath: null };
    const c = [...(effectiveChildren as LayoutItem[])];
    const main = c.splice(index, 1)[0];
    return { items: c, mainPath: main.path };
  }, [
    effectiveChildren,
    hasIndex,
    index,
    item.isStub,
    item.mainPath,
    stubChildren,
  ]);

  if (item.children !== undefined || item.isStub) {
    const labelEl = (
      <div
        className={cn(
          'text-lg cursor-pointer font-bold',
          styles.label,
          open && styles.open,
        )}
        onClick={hasIndex ? () => !open && toggle() : toggle}>
        <p>{item.name}</p>
        <Icon
          {...(hasIndex ? { onClick: toggle } : {})}
          type='arrow'
          className={cn(styles.arrow, open && styles.open)}
        />
      </div>
    );

    return (
      <li className={cn('ml-2', styles.accordion, open && styles.open)}>
        {hasIndex ? (
          <Link
            href={`/${locale}/library/${folderChildren.mainPath}`}
            onClick={() => open && onNavigate?.()}
            title={item.name}
            className={cn(
              'text-accent hover:underline block',
              styles['link-item'],
            )}>
            {labelEl}
          </Link>
        ) : (
          labelEl
        )}
        <div
          className={cn(styles.content, open && styles.expanded)}
          style={{
            ['--expanded-height' as string]: `${localExpandedHeight ?? item.expandedHeight}px`,
          }}>
          {mounted && isFetchingChildren ? (
            <SkeletonSidebarItems childCount={item.childCount} />
          ) : mounted ? (
            folderChildren.items.length > VIRTUALIZE_THRESHOLD ? (
              <VirtualizedSidebar
                items={folderChildren.items}
                onNavigate={onNavigate}
                collapseSiblings={collapseSiblings}
              />
            ) : (
              <Sidebar
                items={folderChildren.items}
                onNavigate={onNavigate}
                collapseSiblings={collapseSiblings}
              />
            )
          ) : null}
        </div>
      </li>
    );
  }

  return (
    <li className='ml-4'>
      <Link
        href={`/${locale}/library/${item.path}`}
        onClick={onNavigate}
        title={item.name}
        className={cn(
          'text-accent hover:underline block',
          styles['link-item'],
        )}>
        {item.name}
      </Link>
    </li>
  );
};
```
--------------
## SidebarShell.tsx
```tsx
/**
 * @fileoverview Sidebar shell that presents a statically-rendered navigation tree
 * on first paint and lazily loads the interactive client sidebar via Suspense.
 * The static fallback mirrors the full tree structure to prevent layout shift
 * during hydration.
 *
 * @module lib/components/sidebar/SidebarShell
 * @author Typeir
 * @version 1.0.0
 * @since 2.1.0
 */

'use client';

import { cn } from '@/lib/utils/classNameMerge';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Icon from '../icon/icon';
import styles from './sidebar.module.scss';
import SidebarClient from './SidebarClient';
import type { Item } from './types';

/**
 * Sidebar item annotated with computed expanded height.
 *
 * @interface LayoutItem
 * @property {string} name - Display name
 * @property {string} path - Routing path segment
 * @property {LayoutItem[]} [children] - Nested items with heights
 * @property {number} expandedHeight - Pixel height when fully expanded
 */
type LayoutItem = Item & {
  expandedHeight: number;
  children?: LayoutItem[];
};

/**
 * Base pixel height per sidebar row.
 *
 * @constant {number}
 */
const BASE_HEIGHT = 52;

/**
 * Sorts and annotates items with their computed expanded heights.
 *
 * @param {Item[]} items - Raw navigation items to process.
 * @returns {LayoutItem[]} Items sorted alphabetically (folders last) with heights.
 */
const calculateHeights = (items: Item[]): LayoutItem[] => {
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

  return sorted.map((item): LayoutItem => {
    if (!item.children || item.children.length === 0) {
      return { ...item, expandedHeight: BASE_HEIGHT } as LayoutItem;
    }
    const children = calculateHeights(item.children);
    const totalChildrenHeight = children.reduce(
      (sum, child) => sum + child.expandedHeight,
      0,
    );
    return {
      ...item,
      children,
      expandedHeight: BASE_HEIGHT + totalChildrenHeight,
    };
  });
};

/**
 * Props for SidebarShell.
 *
 * @interface SidebarShellProps
 * @property {Item[]} items - Root navigation items to render
 * @property {() => void} [onNavigate] - Callback when a navigation link is clicked
 * @property {boolean} [collapseSiblings=false] - If true, opening one folder collapses siblings
 */
interface SidebarShellProps {
  items: Item[];
  onNavigate?: () => void;
  collapseSiblings?: boolean;
}

/**
 * Props for the internal static tree renderer.
 *
 * @interface StaticTreeProps
 * @property {LayoutItem[]} items - Layout-annotated navigation items
 * @property {() => void} [onNavigate] - Navigation callback
 * @property {boolean} [collapseSiblings=false] - Sibling-collapse flag
 * @property {string} locale - Active locale for href construction
 * @property {(path: string) => boolean} isExpanded - Returns true when a path is in the pre-expanded set
 */
interface StaticTreeProps {
  items: LayoutItem[];
  onNavigate?: () => void;
  collapseSiblings?: boolean;
  locale: string;
  isExpanded: (path: string) => boolean;
}

/**
 * Props for the internal static item renderer.
 *
 * @interface StaticItemProps
 * @property {LayoutItem} item - The navigation item to render
 * @property {() => void} [onNavigate] - Navigation callback
 * @property {boolean} collapseSiblings - Sibling-collapse flag passed down
 * @property {string} locale - Active locale for href construction
 * @property {(path: string) => boolean} isExpanded - Returns true when a path is in the pre-expanded set
 */
interface StaticItemProps {
  item: LayoutItem;
  onNavigate?: () => void;
  collapseSiblings: boolean;
  locale: string;
  isExpanded: (path: string) => boolean;
}

/**
 * Renders a single static sidebar entry without expansion state.
 *
 * @component
 * @param {StaticItemProps} props - Component props.
 * @param {LayoutItem} props.item - The navigation item to render.
 * @param {() => void} [props.onNavigate] - Optional navigation callback.
 * @param {boolean} props.collapseSiblings - Sibling-collapse flag passed down.
 * @param {string} props.locale - Active locale for href construction.
 * @param {(path: string) => boolean} props.isExpanded - Returns true when a path is pre-expanded.
 * @returns {JSX.Element | null} The rendered sidebar item.
 */
function StaticItem({
  item,
  onNavigate,
  collapseSiblings,
  locale,
  isExpanded,
}: StaticItemProps): JSX.Element | null {
  const open = isExpanded(item.path);
  const index = item?.children?.findIndex(
    (child) => child.name.toLowerCase() === 'main',
  );

  if (item.children) {
    const hasIndex = index !== undefined && index !== -1;
    const folderChildren = hasIndex
      ? (() => {
          const c = [...(item.children as LayoutItem[])];
          const main = c.splice(index as number, 1)[0];
          return { items: c, mainPath: main.path };
        })()
      : { items: item.children as LayoutItem[], mainPath: null };

    const labelEl = (
      <div
        className={cn(
          'text-lg cursor-pointer font-bold',
          styles.label,
          open && styles.open,
        )}>
        <p>{item.name}</p>
        <Icon type='arrow' className={cn(styles.arrow, open && styles.open)} />
      </div>
    );

    return (
      <li className={cn('ml-2', styles.accordion, open && styles.open)}>
        {hasIndex ? (
          <Link
            href={`/${locale}/library/${folderChildren.mainPath}`}
            onClick={() => onNavigate?.()}
            title={item.name}
            className={cn(
              'text-accent hover:underline block',
              styles['link-item'],
            )}>
            {labelEl}
          </Link>
        ) : (
          labelEl
        )}
        <div
          className={cn(styles.content, open && styles.expanded)}
          style={{
            ['--expanded-height' as string]: `${item.expandedHeight}px`,
          }}>
          <SidebarStaticTree
            items={folderChildren.items}
            onNavigate={onNavigate}
            collapseSiblings={collapseSiblings}
            locale={locale}
            isExpanded={isExpanded}
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
        title={item.name}
        className={cn(
          'text-accent hover:underline block',
          styles['link-item'],
        )}>
        {item.name}
      </Link>
    </li>
  );
}

/**
 * Renders the navigation tree in static (non-interactive) form.
 * Used as the Suspense fallback while SidebarClient is loading.
 *
 * @component
 * @param {StaticTreeProps} props - Component props.
 * @param {LayoutItem[]} props.items - Layout-annotated navigation items.
 * @param {() => void} [props.onNavigate] - Navigation callback.
 * @param {boolean} [props.collapseSiblings=false] - Sibling-collapse flag.
 * @param {string} props.locale - Active locale for href construction.
 * @param {(path: string) => boolean} props.isExpanded - Returns true when a path is pre-expanded.
 * @returns {JSX.Element} Static navigation list.
 */
function SidebarStaticTree({
  items,
  onNavigate,
  collapseSiblings = false,
  locale,
  isExpanded,
}: StaticTreeProps): JSX.Element {
  return (
    <ul className='space-y-1 text-sm'>
      {items.map((item) => (
        <StaticItem
          key={item.path}
          item={item}
          onNavigate={onNavigate}
          collapseSiblings={collapseSiblings}
          locale={locale}
          isExpanded={isExpanded}
        />
      ))}
    </ul>
  );
}

/**
 * Derives expanded sidebar paths from a pathname string.
 * Extracts the content path from `/[locale]/library/[...path]` and
 * returns all ancestor segments so every parent folder is pre-opened.
 *
 * @param {string} pathname - Current route pathname
 * @returns {Set<string>} Set of path strings that should be expanded
 */
function expandedPathsFromPathname(pathname: string): Set<string> {
  const match = pathname.match(/^\/[^/]+\/library\/(.+)$/);
  if (!match) return new Set();
  const contentPath = match[1].replace(
    /\.(sheet|specialization|list|reference|heirloom|trinket|bloodline|lore)$/,
    '',
  );
  const segments = contentPath.split('/');
  const paths = new Set<string>();
  for (let i = 0; i < segments.length; i++) {
    paths.add(segments.slice(0, i + 1).join('/'));
  }
  return paths;
}

/**
 * Sidebar shell that renders a static navigation tree as the Suspense fallback
 * and lazily loads the interactive client sidebar.
 *
 * @component
 * @param {SidebarShellProps} props - Component props.
 * @param {Item[]} props.items - Root navigation items.
 * @param {() => void} [props.onNavigate] - Callback when a link is clicked.
 * @param {boolean} [props.collapseSiblings=false] - If true, opening one folder collapses siblings.
 * @returns {JSX.Element} The sidebar with deferred interactive layer.
 */
export default function SidebarShell({
  items,
  onNavigate,
  collapseSiblings = false,
}: SidebarShellProps): JSX.Element {
  const params = useParams();
  const locale = (params?.locale as string) ?? 'en';
  const pathname = usePathname() ?? '';
  const layoutItems = calculateHeights(items ?? []);
  const expandedPaths = useMemo(
    () => expandedPathsFromPathname(pathname),
    [pathname],
  );
  const isExpanded = useMemo(
    () => (path: string) => expandedPaths.has(path),
    [expandedPaths],
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <SidebarStaticTree
        items={layoutItems}
        onNavigate={onNavigate}
        collapseSiblings={collapseSiblings}
        locale={locale}
        isExpanded={isExpanded}
      />
    );
  }

  return (
    <SidebarClient
      items={items}
      onNavigate={onNavigate}
      collapseSiblings={collapseSiblings}
    />
  );
}
```
--------------
## SkeletonSidebarItems.tsx
```tsx
/**
 * @fileoverview Skeleton loading component for sidebar items
 * @module lib/components/sidebar/SkeletonSidebarItems
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */
'use client';

import { cn } from '@/lib/utils/classNameMerge';
import sk from '../skeleton/skeleton.module.scss';

/**
 * Props for SkeletonSidebarItems component
 *
 * @interface SkeletonSidebarItemsProps
 * @property {number} [childCount=5] - Number of skeleton rows to render
 */
interface SkeletonSidebarItemsProps {
  childCount?: number;
}

/**
 * Renders skeleton placeholder items for loading state
 *
 * @component
 * @param {SkeletonSidebarItemsProps} props - Component props
 * @param {number} [props.childCount=5] - Number of skeleton rows to display (capped at 20)
 * @returns {JSX.Element} List of skeleton items
 */
export function SkeletonSidebarItems({
  childCount = 5,
}: SkeletonSidebarItemsProps): JSX.Element {
  const count = Math.min(childCount, 20);

  return (
    <ul>
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className='ml-4'>
          <span
            className={cn(sk.skeleton, sk.text)}
            style={{
              width: `${40 + ((i * 17) % 40)}%`,
              marginBottom: 0,
            }}
          />
        </li>
      ))}
    </ul>
  );
}
```
--------------
## types.d.ts
```ts
/**
 * @fileoverview Type definitions for sidebar navigation
 * @module lib/components/sidebar/types
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import type SidebarActivePathStore from './store/sidebarActivePath';

/**
 * Sidebar navigation item
 *
 * @interface Item
 * @property {string} name - Display name of the item
 * @property {string} path - Routing path for the item
 * @property {Item[]} [children] - Optional nested child items
 * @property {boolean} [isStub] - True when children exist but have not yet been loaded
 * @property {number} [childCount] - Total descendant count for height pre-calculation
 * @property {string} [mainPath] - Kebab path to main.mdx if the directory contains one
 */
export type Item = {
  name: string;
  path: string;
  children?: Item[];
  isStub?: boolean;
  childCount?: number;
  mainPath?: string;
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
 * Props for the Sidebar component
 *
 * @interface SidebarProps
 * @property {Item[]} items - The root navigation items
 * @property {() => void} [onNavigate] - Callback when a link is clicked
 * @property {boolean} [collapseSiblings=false] - If true, opening one item collapses siblings
 */
export interface SidebarProps {
  items: Item[];
  onNavigate?: () => void;
  collapseSiblings?: boolean;
}

/**
 * Props for SidebarItem component
 *
 * @interface SidebarItemProps
 * @property {LayoutItem} item - The item to render
 * @property {() => void} [onNavigate] - Navigation callback
 * @property {boolean} collapseSiblings - Whether to collapse other items when opening
 * @property {InstanceType<typeof SidebarActivePathStore>} pathStore - Active path store instance
 */
export interface SidebarItemProps {
  item: LayoutItem;
  onNavigate?: () => void;
  collapseSiblings: boolean;
  pathStore: InstanceType<typeof SidebarActivePathStore>;
}
```
--------------
## useFetchStubChildren.ts
```ts
/**
 * @fileoverview Custom hook for fetching and managing stub sidebar children
 * @module lib/components/sidebar/useFetchStubChildren
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */
'use client';

import { useEffect, useState } from 'react';
import { calculateHeights } from './calculateHeights';
import { BASE_HEIGHT } from './constants';
import type { Item } from './types';

/**
 * Return type for useFetchStubChildren hook
 *
 * @interface UseFetchStubChildrenReturn
 * @property {Item[] | null} stubChildren - Fetched children (null = not fetched, [] = empty)
 * @property {boolean} isFetchingChildren - Whether fetch is in progress
 * @property {number | null} localExpandedHeight - Real height after fetch completes
 */
interface UseFetchStubChildrenReturn {
  stubChildren: Item[] | null;
  isFetchingChildren: boolean;
  localExpandedHeight: number | null;
}

/**
 * Custom hook that manages lazy fetching of stub folder children
 * Fetches from /api/content/walk when stub folder is first opened
 *
 * @param {boolean} shouldFetch - Whether to trigger fetch (typically when open=true)
 * @param {boolean} isStub - Whether this is a stub node
 * @param {string} itemPath - Path of the item to fetch children for
 * @param {string} locale - Locale code for API call
 * @returns {UseFetchStubChildrenReturn} Fetch state and results
 */
export function useFetchStubChildren(
  shouldFetch: boolean,
  isStub: boolean,
  itemPath: string,
  locale: string,
): UseFetchStubChildrenReturn {
  const [stubChildren, setStubChildren] = useState<Item[] | null>(null);
  const [isFetchingChildren, setIsFetchingChildren] = useState(false);
  const [localExpandedHeight, setLocalExpandedHeight] = useState<number | null>(
    null,
  );

  useEffect(() => {
    if (
      !shouldFetch ||
      !isStub ||
      stubChildren !== null ||
      isFetchingChildren
    ) {
      return;
    }

    setIsFetchingChildren(true);
    fetch(
      `/api/content/walk?locale=${encodeURIComponent(locale)}&path=${encodeURIComponent(itemPath)}`,
    )
      .then((r) => r.json())
      .then((nodes: Item[]) => {
        const layoutNodes = calculateHeights(nodes);
        const real =
          BASE_HEIGHT + layoutNodes.reduce((s, n) => s + n.expandedHeight, 0);
        setLocalExpandedHeight(real);
        setStubChildren(nodes);
      })
      .catch(() => setStubChildren([]))
      .finally(() => setIsFetchingChildren(false));
  }, [shouldFetch, isStub, itemPath, locale, stubChildren, isFetchingChildren]);

  return {
    stubChildren,
    isFetchingChildren,
    localExpandedHeight,
  };
}
```
--------------
## VirtualizedSidebar.tsx
```tsx
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
import { Sidebar } from './sidebar';
import type { LayoutItem } from './types';

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
```
--------------
### SUB: store
## sidebarActivePath.ts
```ts
/**
 * A simple reactive store for the currently active sidebar path.
 * Subscribers will be notified whenever the active path changes.
 * @fileoverview Module for src/lib/components/sidebar/store/sidebarActivePath.ts
 * @module src/lib/components/sidebar/store/sidebarActivePath
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

type Callback = (path: string | null) => void;

class SidebarActivePathStore {
  private subscribers: Set<Callback> = new Set();
  private _value: string | null = null;

  /**
   * Subscribe to path changes.
   * @param {Callback} callback - Function to call on path updates.
   * @returns {() => void} Unsubscribe function.
   */
  subscribe(callback: Callback): () => void {
    this.subscribers.add(callback);
    /** Immediately send current value */
    callback(this._value);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Sets the new active path.
   * @param {string | null} path - The new path.
   */
  set(path: string | null): void {
    this._value = path;
    this.subscribers.forEach((cb) => cb(path));
  }
  /**
   * Returns the current subscriber count.
   * @returns {number | null} The current subscriber count.
   */
  getOpenCount(): number {
    return this.subscribers.size;
  }

  /**
   * Returns the current active path.
   * @returns {string | null} The active path.
   */
  get(): string | null {
    return this._value;
  }
}

export default SidebarActivePathStore;
```
--------------
