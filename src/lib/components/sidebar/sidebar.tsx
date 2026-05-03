/**
 * @fileoverview Collapsible hierarchical content tree for navigation.
 * Renders expandable/collapsible sections with active path highlighting
 * and animated height transitions.
 *
 * @module lib/components/sidebar/sidebar
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */
'use client';

import { useSidebarExpansionActions } from '@/lib/context/PersistentUiContext';
import { cn } from '@/lib/utils/classNameMerge';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../icon/icon';
import styles from './sidebar.module.scss';
import { default as SidebarActivePathStore } from './store/sidebarActivePath';
import { VIRTUALIZE_THRESHOLD } from './VirtualizedSidebar';

/**
 * Dynamically imported `VirtualizedSidebar` loaded only when a folder's child
 * count exceeds `VIRTUALIZE_THRESHOLD`, keeping the initial JS bundle small.
 */
const VirtualizedSidebar = dynamic(() => import('./VirtualizedSidebar'), {
  ssr: false,
});

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
 * Base height per sidebar item in pixels
 * @constant
 * @type {number}
 */
const BASE_HEIGHT = 52;

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
 * Children are lazily mounted on first open and kept mounted through the
 * closing animation (driven by `isClosing`) before unmounting.
 *
 * @param {SidebarItemProps} props - Component props.
 * @param {LayoutItem} props.item - The item to render.
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
  /**
   * SidebarClient is always client-only (mounted after hydration via SidebarShell),
   * so it is safe to read isExpanded synchronously as the initial state.
   * This prevents a flash/animation where the item opens from closed → open.
   */
  const [open, setOpen] = useState<boolean>(() => isExpanded(item.path));
  const [isHydrated, setIsHydrated] = useState(false);
  /**
   * Whether this folder's children have ever been mounted. Stays true until
   * the closing CSS transition completes, then resets to false so the subtree
   * is unmounted. This avoids rendering the full tree on initial load.
   */
  const [mounted, setMounted] = useState<boolean>(() => isExpanded(item.path));
  /**
   * True from the moment a folder starts closing until the `max-height`
   * CSS transition ends, keeping children in the DOM so the animation plays.
   */
  const [isClosing, setIsClosing] = useState(false);
  /**
   * Mirrors `open` for safe reads inside stale-closure callbacks
   * (pathStore subscriptions) without re-registering the effect.
   */
  const openRef = useRef(false);
  const params = useParams();
  const locale = params?.locale as string;
  /** Lazily-fetched children for stub nodes. Null means "not yet fetched";
   * an empty array means "fetched and empty".
   */
  const [stubChildren, setStubChildren] = useState<Item[] | null>(null);
  /** True while an in-flight fetch is pending for stub children. */
  const [isFetchingChildren, setIsFetchingChildren] = useState(false);
  /**
   * Real expanded height computed after stub children are fetched.
   * Null until the first fetch completes; falls back to the pre-calculated
   * estimate from `item.expandedHeight` until then.
   */
  const [localExpandedHeight, setLocalExpandedHeight] = useState<number | null>(
    null,
  );

  /**
   * The resolved children list. For stub items this uses the lazily-fetched
   * data once available; for normal items it uses the prop directly.
   */
  const effectiveChildren = useMemo(() => {
    if (item.isStub) return stubChildren ?? [];
    return item.children ?? [];
  }, [item.isStub, item.children, stubChildren]);

  const index = effectiveChildren.findIndex(
    (child) => child.name.toLowerCase() === 'main',
  );

  /** Hydration sync — run once after mount to sync with persisted state */
  useEffect(() => {
    openRef.current = open;
    setIsHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Sync local state with context when expansion state changes (after hydration) */
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

  /**
   * Clears `isClosing` and unmounts children once the closing animation
   * window (`SIDEBAR_CLOSE_ANIMATION_MS`) has elapsed.
   */
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

  /**
   * Lazily fetches children for stub nodes when the folder is first expanded.
   * Only fires once per stub: once `stubChildren` is not null, the effect
   * becomes a no-op so subsequent open/close cycles never re-fetch.
   */
  useEffect(() => {
    if (!open || !item.isStub || stubChildren !== null || isFetchingChildren)
      return;
    setIsFetchingChildren(true);
    fetch(
      `/api/content/walk?locale=${encodeURIComponent(locale)}&path=${encodeURIComponent(item.path)}`,
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
  }, [open, item.isStub, item.path, locale, stubChildren, isFetchingChildren]);

  const hasIndex =
    (index !== undefined && index !== -1) ||
    (item.isStub && stubChildren === null && !!item.mainPath);

  /**
   * Derived folder children split from the `main` index entry.
   * Memoized to avoid re-computing on every render.
   */
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
          {mounted &&
            (folderChildren.items.length > VIRTUALIZE_THRESHOLD ? (
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
            ))}
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
