/**
 * @fileoverview Sidebar shell that renders a static navigation tree as the Suspense fallback
 * and lazily loads the interactive client sidebar.
 * @module modules/navigation-sidebar/presentation/components/SidebarShell
 * @author Typeir
 * @version 2.0.0
 * @since 1.0.0
 */

'use client';

import Icon from '@/lib/components/icon/icon';
import { LazyPrefetchLink } from '@/lib/components/lazyPrefetchLink';
import { cn } from '@/lib/utils/classNameMerge';
import type {
    Item,
    LayoutItem,
} from '@/modules/navigation-sidebar/domain/types';
import { calculateHeights } from '@/modules/navigation-sidebar/infrastructure/tree-walk/calculateHeights';
import dynamic from 'next/dynamic';
import { useParams, usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import styles from './sidebar.module.scss';

const SidebarClient = dynamic(
  () => import('./SidebarClient').then((mod) => ({ default: mod.default })),
  { ssr: false },
);

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
          <LazyPrefetchLink
            href={`/${locale}/library/${folderChildren.mainPath}`}
            onClick={() => onNavigate?.()}
            title={item.name}
            className={cn(
              'text-accent hover:underline block',
              styles['link-item'],
            )}>
            {labelEl}
          </LazyPrefetchLink>
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
      <LazyPrefetchLink
        href={`/${locale}/library/${item.path}`}
        onClick={onNavigate}
        title={item.name}
        className={cn(
          'text-accent hover:underline block',
          styles['link-item'],
        )}>
        {item.name}
      </LazyPrefetchLink>
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
