/**
 * @fileoverview Recursive sidebar item component
 * @module modules/navigation-sidebar/presentation/components/SidebarItem
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */
'use client';

import Icon from '@/lib/components/icon/icon';
import { LazyPrefetchLink } from '@/lib/components/lazyPrefetchLink';
import { cn } from '@/lib/utils/classNameMerge';
import { useFetchStubChildren } from '@/modules/navigation-sidebar/application/hooks/useFetchStubChildren';
import { useIsPathExpanded } from '@/modules/navigation-sidebar/application/hooks/useIsPathExpanded';
import { useSidebarExpansionDispatch } from '@/modules/navigation-sidebar/application/hooks/useSidebarExpansion';
import { isIndexRoute } from '@/lib/constants/content';
import { SIDEBAR_CLOSE_ANIMATION_MS } from '@/modules/navigation-sidebar/domain/constants';
import type {
    LayoutItem,
    SidebarItemProps,
} from '@/modules/navigation-sidebar/domain/types';
import { useParams } from 'next/navigation';
import type { JSX } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Sidebar } from './sidebar';
import styles from './sidebar.module.scss';
import { SkeletonSidebarItems } from './SkeletonSidebarItems';
import VirtualizedSidebar, { VIRTUALIZE_THRESHOLD } from './VirtualizedSidebar';

/**
 * Renders an item as a link or a collapsible folder. Children mount on
 * first open and unmount after the closing animation.
 *
 * @param {SidebarItemProps} props - Component props.
 * @param {LayoutItem} props.item - The item to render.
 * @param {() => void=} props.onNavigate - Navigation callback.
 * @param {boolean} props.collapseSiblings - Whether to collapse sibling items.
 * @param {any} props.pathStore - Open/closed path store.
 * @returns {JSX.Element | null} The rendered element, or null if no valid data.
 */
export const SidebarItem = ({
  item,
  onNavigate,
  collapseSiblings,
  pathStore,
}: SidebarItemProps): JSX.Element | null => {
  const { setExpanded } = useSidebarExpansionDispatch();
  const expanded = useIsPathExpanded(item.path);
  const [open, setOpen] = useState<boolean>(expanded);
  const [mounted, setMounted] = useState<boolean>(expanded);
  const [isClosing, setIsClosing] = useState(false);
  const openRef = useRef(expanded);
  const params = useParams();
  const locale = params?.locale as string;

  const { stubChildren, localExpandedHeight } = useFetchStubChildren(
    open,
    !!item.isStub,
    item.path,
    locale,
  );
  const expandedHeight = localExpandedHeight ?? item.expandedHeight;

  const effectiveChildren = useMemo(() => {
    if (item.isStub) return stubChildren ?? [];
    return item.children ?? [];
  }, [item.isStub, item.children, stubChildren]);

  /* A folder's index is `main` or a child named after the folder; either way
     the folder itself is the route that serves it. */
  const index = effectiveChildren.findIndex((child) =>
    isIndexRoute(item.path, child.path),
  );

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    if (expanded === open) return;
    openRef.current = expanded;
    setOpen(expanded);
    if (expanded) {
      setMounted(true);
      setIsClosing(false);
    } else {
      setIsClosing(true);
    }
  }, [expanded, open]);

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
    c.splice(index, 1);
    return { items: c, mainPath: item.path };
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
          <LazyPrefetchLink
            href={`/${locale}/library/${folderChildren.mainPath}`}
            onClick={() => open && onNavigate?.()}
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
            ['--expanded-height' as string]: `${expandedHeight}px`,
          }}>
          {mounted && item.isStub && stubChildren === null ? (
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
};
