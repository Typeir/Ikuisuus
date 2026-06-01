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
