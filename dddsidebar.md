# navigation-sidebar
## index.ts
```ts
/**
 * @fileoverview navigation-sidebar module barrel
 * @module modules/navigation-sidebar
 * @description Recursive library tree navigation. Public API surfaces presentation components,
 * state hooks, server-callable tree utilities, and domain types. Internal composition details,
 * infrastructure utilities, and deep application paths are not exported.
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

export { useSidebarExpansion, useSidebarExpansion as useSidebarExpansionActions } from './application/hooks/useSidebarExpansion';
export { useSidebarMenu } from './application/hooks/useSidebarMenu';
export { useSidebarMenuActions } from './application/hooks/useSidebarMenuActions';
export {
    shallowWalk as repositoryShallowWalk,
    walk as repositoryWalk
} from '@/modules/library/infrastructure/navigation/walk';
export { SidebarShell } from './presentation/components/SidebarShell';

export type {
    Item, LayoutItem, SidebarProps, SidebarItemProps, WalkNode
} from './domain/types';
```
--------------
### SUB: application
### SUB: api-clients
## fetchStubChildren.ts
```ts
/**
 * @fileoverview Pure async function for fetching stub sidebar children from API
 * @module modules/navigation-sidebar/application/api-clients/fetchStubChildren
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

import type { Item } from '@/modules/navigation-sidebar/domain/types';

/**
 * Fetches stub children for a sidebar item from the tree walk API
 *
 * @param {string} itemPath - Path of the item to fetch children for
 * @param {string} locale - Locale code for API call
 * @returns {Promise<Item[]>} Array of items (WalkNode structure from API), or empty array on error
 */
export async function fetchStubChildren(
  itemPath: string,
  locale: string,
): Promise<Item[]> {
  try {
    const response = await fetch(
      `/api/content/walk?locale=${encodeURIComponent(locale)}&path=${encodeURIComponent(itemPath)}`,
    );
    const nodes: Item[] = await response.json();
    return nodes;
  } catch {
    return [];
  }
}
```
--------------
### SUB: hooks
## useFetchStubChildren.ts
```ts
/**
 * @fileoverview Custom hook for fetching and managing stub sidebar children
 * @module modules/navigation-sidebar/application/hooks/useFetchStubChildren
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

'use client';

import { fetchStubChildren } from '@/modules/navigation-sidebar/application/api-clients/fetchStubChildren';
import { BASE_HEIGHT } from '@/modules/navigation-sidebar/domain/constants';
import type { Item } from '@/modules/navigation-sidebar/domain/types';
import { calculateHeights } from '@/modules/navigation-sidebar/infrastructure/tree-walk/calculateHeights';
import { useEffect, useState } from 'react';

/**
 * Return type for useFetchStubChildren hook
 *
 * @interface UseFetchStubChildrenReturn
 * @property {Item[] | null} stubChildren - Fetched children (null = not fetched, [] = empty)
 * @property {boolean} isFetchingChildren - Whether fetch is in progress
 * @property {number | null} localExpandedHeight - Real height after fetch completes
 */
export interface UseFetchStubChildrenReturn {
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
    fetchStubChildren(itemPath, locale)
      .then((nodes: Item[]) => {
        const layoutNodes = calculateHeights(nodes);
        const real =
          BASE_HEIGHT + layoutNodes.reduce((s, n) => s + n.expandedHeight, 0);
        setLocalExpandedHeight(real);
        setStubChildren(nodes);
      })
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
## useSidebarExpansion.ts
```ts
/**
 * @fileoverview Hook to access sidebar expansion state and actions
 * @module modules/navigation-sidebar/application/hooks/useSidebarExpansion
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

'use client';

import { usePersistentUiDispatch } from '@/lib/context/PersistentUiContext';
import { PERSISTED_UI_ACTION_TYPES } from '@/lib/types/persistentUiState';
import { useCallback, useMemo } from 'react';
import { useSidebarMenu } from './useSidebarMenu';

/**
 * Sidebar expansion action helpers
 *
 * @interface SidebarExpansionActions
 * @property {(path: string, expanded: boolean) => void} setExpanded - Set expansion state for a path
 * @property {(path: string) => void} togglePath - Toggle expansion for a path
 * @property {(path: string) => boolean} isExpanded - Check if a path is expanded
 */
export interface SidebarExpansionActions {
  setExpanded: (path: string, expanded: boolean) => void;
  togglePath: (path: string) => void;
  isExpanded: (path: string) => boolean;
}

export function useSidebarExpansion(): SidebarExpansionActions {
  const dispatch = usePersistentUiDispatch();
  const { expandedPaths } = useSidebarMenu();

  const setExpanded = useCallback(
    (path: string, expanded: boolean) => {
      dispatch({
        type: PERSISTED_UI_ACTION_TYPES.SET_SIDEBAR_EXPANSION,
        payload: { path, expanded },
      });
    },
    [dispatch],
  );

  const togglePath = useCallback(
    (path: string) => {
      dispatch({
        type: PERSISTED_UI_ACTION_TYPES.TOGGLE_SIDEBAR_PATH,
        payload: { path },
      });
    },
    [dispatch],
  );

  const isExpanded = useCallback(
    (path: string) => {
      return expandedPaths.includes(path);
    },
    [expandedPaths],
  );

  return useMemo(
    () => ({ setExpanded, togglePath, isExpanded }),
    [setExpanded, togglePath, isExpanded],
  );
}

export const useSidebarExpansionActions = useSidebarExpansion;
```
--------------
## useSidebarMenu.ts
```ts
/**
 * @fileoverview Hook to access sidebar menu state from Redux store
 * @module modules/navigation-sidebar/application/hooks/useSidebarMenu
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

'use client';

import { usePersistentUiState } from '@/lib/context/PersistentUiContext';
import type { SidebarMenuState } from '@/lib/types/persistentUiState';

/**
 * Hook to access sidebar menu state
 *
 * @function useSidebarMenu
 * @returns {SidebarMenuState & { isHydrated: boolean }} Sidebar state with hydration flag
 */
export function useSidebarMenu(): SidebarMenuState & { isHydrated: boolean } {
  const state = usePersistentUiState();
  return {
    ...state.sidebarMenu,
    isHydrated: state.isHydrated,
  };
}
```
--------------
## useSidebarMenuActions.ts
```ts
/**
 * @fileoverview Hook to access sidebar menu action dispatchers
 * @module modules/navigation-sidebar/application/hooks/useSidebarMenuActions
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

'use client';

import { usePersistentUiDispatch } from '@/lib/context/PersistentUiContext';
import { PERSISTED_UI_ACTION_TYPES } from '@/lib/types/persistentUiState';
import { useCallback, useMemo } from 'react';

/**
 * Sidebar menu action helpers
 *
 * @interface SidebarMenuActions
 * @property {(isOpen: boolean) => void} setOpen - Set sidebar open state
 * @property {() => void} toggle - Toggle sidebar open state
 * @property {() => void} close - Close sidebar
 * @property {() => void} open - Open sidebar
 */
export interface SidebarMenuActions {
  setOpen: (isOpen: boolean) => void;
  toggle: () => void;
  close: () => void;
  open: () => void;
}

/**
 * Hook to access sidebar menu actions
 *
 * @function useSidebarMenuActions
 * @returns {SidebarMenuActions} Action functions for sidebar menu
 */
export function useSidebarMenuActions(): SidebarMenuActions {
  const dispatch = usePersistentUiDispatch();

  const setOpen = useCallback(
    (isOpen: boolean) => {
      dispatch({
        type: PERSISTED_UI_ACTION_TYPES.SET_SIDEBAR_OPEN,
        payload: { isOpen },
      });
    },
    [dispatch],
  );

  const toggle = useCallback(() => {
    dispatch({ type: PERSISTED_UI_ACTION_TYPES.TOGGLE_SIDEBAR });
  }, [dispatch]);

  const close = useCallback(() => {
    dispatch({
      type: PERSISTED_UI_ACTION_TYPES.SET_SIDEBAR_OPEN,
      payload: { isOpen: false },
    });
  }, [dispatch]);

  const open = useCallback(() => {
    dispatch({
      type: PERSISTED_UI_ACTION_TYPES.SET_SIDEBAR_OPEN,
      payload: { isOpen: true },
    });
  }, [dispatch]);

  return useMemo(
    () => ({ setOpen, toggle, close, open }),
    [setOpen, toggle, close, open],
  );
}
```
--------------
### SUB: use-cases
### SUB: domain
## constants.ts
```ts
/**
 * @fileoverview Domain constants for navigation-sidebar module.
 * @module modules/navigation-sidebar/domain/constants
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

/**
 * Base pixel height per sidebar row.
 *
 * @constant {number}
 */
export const BASE_HEIGHT = 52;

/**
 * CSS animation duration for sidebar close transition (ms).
 * Children remain mounted during this window for full collapse animation.
 *
 * @constant {number}
 */
export const SIDEBAR_CLOSE_ANIMATION_MS = 500;

/**
 * Child count threshold triggering virtualization.
 * Below this, recursive Sidebar component renders normally.
 * At or above this, react-window List renders instead.
 *
 * @constant {number}
 */
export const VIRTUALIZATION_THRESHOLD = 100;

/**
 * Maximum directory depth for shallow walk operations.
 * API returns two levels deep; directories at depth 2 are stub nodes
 * for pagination expansion.
 *
 * @constant {number}
 */
export const SHALLOW_WALK_DEPTH = 2;
```
--------------
## filenameDedup.ts
```ts
<!-- Error reading file: 'charmap' codec can't encode character '\u2192' in position 1640: character maps to <undefined> -->
```
--------------
## sortItems.ts
```ts
/**
 * @fileoverview Pure sort logic for sidebar navigation items.
 * Sorts items with folders last, alphabetically within each category.
 * @module modules/navigation-sidebar/domain/sortItems
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import type { Item } from './types';

/**
 * Sorts navigation items alphabetically (numeric-aware) with folders last.
 * Uses Unicode Collation Algorithm for locale-aware comparison.
 *
 * Sort order: [files, then folders] within each group by display name,
 * then by path for stable secondary ordering.
 *
 * @param {Item[]} items - Items to sort
 * @returns {Item[]} Sorted items (folders last)
 */
export function sortItems(items: Item[]): Item[] {
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
  });

  const label = (it: Item): string => it.name || it.path;

  return [...items].sort((a, b) => {
    const aIsFolder = Boolean(a.children && a.children.length > 0);
    const bIsFolder = Boolean(b.children && b.children.length > 0);

    if (aIsFolder !== bIsFolder) {
      return aIsFolder ? 1 : -1;
    }

    const byLabel = collator.compare(label(a), label(b));
    if (byLabel !== 0) return byLabel;

    return collator.compare(a.path, b.path);
  });
}
```
--------------
## types.ts
```ts
/**
 * @fileoverview Type definitions for navigation-sidebar module.
 * @module modules/navigation-sidebar/domain/types
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import type SidebarActivePathStore from '@/lib/components/sidebar/store/sidebarActivePath';

/**
 * Navigation tree node (from walk, same structure as WalkNode from library).
 *
 * @interface Item
 * @property {string} name - Display name
 * @property {string} path - URL-friendly kebab-case path segment
 * @property {Item[]} [children] - Child nodes
 * @property {boolean} [isStub] - True when directory children not yet loaded
 * @property {number} [childCount] - Total descendant count (stub nodes only)
 * @property {string} [mainPath] - Kebab path to main.mdx if present
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
 * Layout-annotated item with computed expanded height.
 * Extension of Item with height metadata for rendering calculations.
 *
 * @interface LayoutItem
 * @extends Item
 * @property {number} expandedHeight - Pixel height when fully expanded
 * @property {(LayoutItem[] | Item[])} [children] - Nested items
 */
export type LayoutItem = Item & {
  expandedHeight: number;
  children?: LayoutItem[] | Item[];
};

/**
 * Props for Sidebar presentation component.
 *
 * @interface SidebarProps
 * @property {Item[]} items - Root navigation items
 * @property {() => void} [onNavigate] - Navigation link click callback
 * @property {boolean} [collapseSiblings=false] - Collapse sibling folders on open
 */
export interface SidebarProps {
  items: Item[];
  onNavigate?: () => void;
  collapseSiblings?: boolean;
}

/**
 * Props for SidebarItem recursive component.
 *
 * @interface SidebarItemProps
 * @property {LayoutItem} item - Item to render
 * @property {() => void} [onNavigate] - Navigation callback
 * @property {boolean} collapseSiblings - Sibling collapse flag
 * @property {InstanceType<typeof SidebarActivePathStore>} pathStore - Active path store
 */
export interface SidebarItemProps {
  item: LayoutItem;
  onNavigate?: () => void;
  collapseSiblings: boolean;
  pathStore: InstanceType<typeof SidebarActivePathStore>;
}

/**
 * Tree walk node (server-returned structure for shallow pagination).
 * Semantically equivalent to Item but returned directly from API.
 *
 * @interface WalkNode
 * @property {string} name - Human-readable display name
 * @property {string} path - URL-friendly path segment
 * @property {WalkNode[]} [children] - Child nodes
 * @property {boolean} [isStub] - Lazy-loadable placeholder flag
 * @property {number} [childCount] - Descendant count (stub nodes only)
 * @property {string} [mainPath] - Path to main.mdx (stub nodes only)
 */
export interface WalkNode {
  name: string;
  path: string;
  children?: WalkNode[];
  isStub?: boolean;
  childCount?: number;
  mainPath?: string;
}
```
--------------
### SUB: infrastructure
### SUB: server
## treeHandler.ts
```ts
/**
 * @fileoverview Orchestrator for paginated content file-tree API
 * @module modules/navigation-sidebar/infrastructure/server/treeHandler
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

import { listDirectory } from '@/lib/db/content';
import { logger } from '@/lib/logging/logger';

const log = logger.child({ module: 'TreeHandler' });

/**
 * Query parameters for tree handler
 *
 * @interface TreeQueryParams
 * @property {string} locale - Locale code (default "en")
 * @property {string} path - Relative path (default "")
 * @property {number} [limit] - Page size limit
 * @property {number} [page] - Page number
 * @property {number} [pageSize] - Alternative page size parameter
 * @property {string} [cursor] - Cursor for keyset pagination
 * @property {string} [filter] - Filter pattern
 * @property {'name' | 'type'} [sort] - Sort field
 */
export interface TreeQueryParams {
  locale: string;
  path: string;
  limit?: number;
  page?: number;
  pageSize?: number;
  cursor?: string;
  filter?: string;
  sort?: 'name' | 'type';
}

/**
 * Orchestrator for directory tree listing endpoint
 * Coordinates parameter parsing, service invocation, and error handling
 *
 * @param {TreeQueryParams} params - Query parameters from request
 * @returns {Promise<unknown>} Directory listing result or error object
 */
export async function handleTreeRequest(
  params: TreeQueryParams,
): Promise<unknown> {
  try {
    const result = await listDirectory(params.locale, params.path, {
      limit: params.limit,
      page: params.page,
      pageSize: params.pageSize,
      cursor: params.cursor,
      filter: params.filter,
      sort: params.sort,
    });

    return result;
  } catch (err) {
    log.error('Failed to list directory', {
      error: err instanceof Error ? err.message : String(err),
      locale: params.locale,
      path: params.path,
    });
    throw err;
  }
}
```
--------------
## walkHandler.ts
```ts
/**
 * @fileoverview Orchestrator for lazy sidebar walk API
 * @module modules/navigation-sidebar/infrastructure/server/walkHandler
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

import { logger } from '@/lib/logging/logger';
import { repositoryShallowWalk } from '@/modules/library/infrastructure/navigation/repositoryWalk';
import type { Item } from '@/modules/navigation-sidebar/domain/types';

const log = logger.child({ module: 'WalkHandler' });

/**
 * Query parameters for walk handler
 *
 * @interface WalkQueryParams
 * @property {string} locale - Locale code (default "en")
 * @property {string} path - Relative path (default "")
 * @property {number} [depth] - Walk depth (default SHALLOW_WALK_DEPTH=2)
 */
export interface WalkQueryParams {
  locale: string;
  path: string;
  depth?: number;
}

/**
 * Orchestrator for shallow sidebar walk endpoint
 * Coordinates parameter parsing, repository walk, and error handling
 *
 * @param {WalkQueryParams} params - Query parameters from request
 * @returns {Promise<Item[]>} Array of WalkNode objects or throws error
 */
export async function handleWalkRequest(
  params: WalkQueryParams,
): Promise<Item[]> {
  try {
    const depth = params.depth ?? 2;
    const nodes = await repositoryShallowWalk(
      params.locale,
      params.path,
      depth,
    );
    return nodes;
  } catch (err) {
    log.error('Failed to walk content path', {
      error: err instanceof Error ? err.message : String(err),
      locale: params.locale,
      path: params.path,
    });
    throw err;
  }
}
```
--------------
### SUB: tree-walk
## calculateHeights.ts
```ts
/**
 * @fileoverview Calculate expanded heights for sidebar items.
 * Sorts items (folders last, alphabetically) and computes heights recursively.
 * Handles stub nodes (lazy-loaded) with pre-calculated childCount.
 * @module modules/navigation-sidebar/infrastructure/tree-walk/calculateHeights
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import { BASE_HEIGHT } from '@/modules/navigation-sidebar/domain/constants';
import { sortItems } from '@/modules/navigation-sidebar/domain/sortItems';
import type {
    Item,
    LayoutItem,
} from '@/modules/navigation-sidebar/domain/types';

/**
 * Sorts items and annotates with computed expanded heights.
 * Recursively calculates height as: BASE_HEIGHT + sum of children's heights.
 * Stub nodes use pre-calculated childCount for height estimation before fetch.
 *
 * @param {Item[]} items - Navigation items to annotate
 * @returns {LayoutItem[]} Items sorted (folders last) with heights
 */
export function calculateHeights(items: Item[]): LayoutItem[] {
  const sorted = sortItems(items);

  return sorted.map((item): LayoutItem => {
    if (item.isStub) {
      return {
        ...item,
        expandedHeight: BASE_HEIGHT + (item.childCount ?? 1) * BASE_HEIGHT,
      };
    }

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
}
```
--------------
## countDescendants.ts
```ts
/**
 * @fileoverview Counts total descendants in a navigation tree.
 * Used to pre-calculate expanded height for stub nodes before fetching children.
 * @module modules/navigation-sidebar/infrastructure/tree-walk/countDescendants
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import type { Item } from '@/modules/navigation-sidebar/domain/types';

/**
 * Recursively counts all descendants (files + folders) in a tree.
 * Used by API handlers to pre-set childCount on stub nodes.
 *
 * @param {Item[]} items - Navigation items
 * @returns {number} Total descendant count
 */
export function countDescendants(items: Item[]): number {
  let total = 0;

  for (const item of items) {
    total += 1;

    if (item.children && item.children.length > 0) {
      total += countDescendants(item.children);
    }
  }

  return total;
}
```
--------------
## detectMainPath.ts
```ts
<!-- Error reading file: 'charmap' codec can't encode character '\u2192' in position 703: character maps to <undefined> -->
```
--------------
### SUB: presentation
### SUB: components
## DynamicSidebarBoundary.tsx
```tsx
/**
 * @fileoverview Dynamic client sidebar boundary (Suspense fallback wrapper)
 * @module modules/navigation-sidebar/presentation/components/DynamicSidebarBoundary
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

'use client';

import type { Item } from '@/modules/navigation-sidebar/domain/types';

/**
 * Props for DynamicSidebarBoundary
 *
 * @interface DynamicSidebarBoundaryProps
 * @property {Item[]} items - Navigation items
 * @property {() => void} [onNavigate] - Navigation callback
 * @property {boolean} [collapseSiblings] - Sibling collapse flag
 * @property {JSX.Element} fallback - Fallback UI during hydration
 */
export interface DynamicSidebarBoundaryProps {
  items: Item[];
  onNavigate?: () => void;
  collapseSiblings?: boolean;
  fallback: JSX.Element;
}

/**
 * Boundary component that wraps client sidebar
 * Currently renders fallback (static implementation)
 *
 * @component
 */
export function DynamicSidebarBoundary({
  fallback,
}: DynamicSidebarBoundaryProps): JSX.Element {
  return fallback;
}
```
--------------
## SidebarShell.tsx
```tsx
/**
 * @fileoverview Sidebar shell orchestrator (static + dynamic)
 * @module modules/navigation-sidebar/presentation/components/SidebarShell
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

'use client';

import type { Item } from '@/modules/navigation-sidebar/domain/types';
import { calculateHeights } from '@/modules/navigation-sidebar/infrastructure/tree-walk/calculateHeights';
import { useParams, usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { DynamicSidebarBoundary } from './DynamicSidebarBoundary';
import { StaticSidebar } from './StaticSidebar';

/**
 * Props for SidebarShell
 *
 * @interface SidebarShellProps
 * @property {Item[]} items - Navigation items
 * @property {() => void} [onNavigate] - Navigation callback
 * @property {boolean} [collapseSiblings] - Sibling collapse flag
 */
interface SidebarShellProps {
  items: Item[];
  onNavigate?: () => void;
  collapseSiblings?: boolean;
}

/**
 * Derives expanded paths from pathname
 *
 * @internal
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
 * Sidebar shell: static fallback + dynamic client boundary
 *
 * @component
 */
export function SidebarShell({
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

  const fallback = (
    <StaticSidebar
      items={layoutItems}
      onNavigate={onNavigate}
      collapseSiblings={collapseSiblings}
      locale={locale}
      isExpanded={isExpanded}
    />
  );

  if (!mounted) {
    return fallback;
  }

  return (
    <DynamicSidebarBoundary
      items={items}
      onNavigate={onNavigate}
      collapseSiblings={collapseSiblings}
      fallback={fallback}
    />
  );
}
```
--------------
## StaticSidebar.tsx
```tsx
/**
 * @fileoverview Static fallback sidebar renderer (non-interactive)
 * @module modules/navigation-sidebar/presentation/components/StaticSidebar
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

'use client';

import Icon from '@/lib/components/icon/icon';
import styles from '@/lib/components/sidebar/sidebar.module.scss';
import { cn } from '@/lib/utils/classNameMerge';
import type { LayoutItem } from '@/modules/navigation-sidebar/domain/types';
import Link from 'next/link';

/**
 * Props for static sidebar renderer
 *
 * @interface StaticSidebarProps
 * @property {LayoutItem[]} items - Navigation items with layout info
 * @property {() => void} [onNavigate] - Navigation callback
 * @property {boolean} [collapseSiblings] - Sibling collapse flag
 * @property {string} locale - Current locale
 * @property {(path: string) => boolean} isExpanded - Path expansion check
 */
interface StaticSidebarProps {
  items: LayoutItem[];
  onNavigate?: () => void;
  collapseSiblings?: boolean;
  locale: string;
  isExpanded: (path: string) => boolean;
}

/**
 * Static item renderer (pre-expanded based on pathname)
 *
 * @internal
 */
function StaticItem({
  item,
  onNavigate,
  collapseSiblings,
  locale,
  isExpanded,
}: {
  item: LayoutItem;
  onNavigate?: () => void;
  collapseSiblings?: boolean;
  locale: string;
  isExpanded: (path: string) => boolean;
}): JSX.Element | null {
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
          <ul className='space-y-1 text-sm'>
            {folderChildren.items.map((child) => (
              <StaticItem
                key={child.path}
                item={child}
                onNavigate={onNavigate}
                collapseSiblings={collapseSiblings}
                locale={locale}
                isExpanded={isExpanded}
              />
            ))}
          </ul>
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
 * Static sidebar tree renderer (no interactivity, just pre-expanded structure)
 *
 * @component
 */
export function StaticSidebar({
  items,
  onNavigate,
  collapseSiblings,
  locale,
  isExpanded,
}: StaticSidebarProps): JSX.Element {
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
```
--------------
### SUB: Sidebar
### SUB: SidebarClient
### SUB: SidebarItem
### SUB: SidebarShell
### SUB: SkeletonSidebarItems
### SUB: VirtualizedSidebar
