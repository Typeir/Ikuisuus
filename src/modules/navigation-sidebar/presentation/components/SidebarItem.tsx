/**
 * @fileoverview Recursive sidebar item component
 * @module lib/components/sidebar/SidebarItem
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */
'use client';

import Icon from '@/lib/components/icon/icon';
import { LazyPrefetchLink } from '@/lib/components/lazyPrefetchLink';
import { useSidebarExpansionActions } from '@/lib/context/PersistentUiContext';
import { cn } from '@/lib/utils/classNameMerge';
import { useFetchStubChildren } from '@/modules/navigation-sidebar/application/hooks/useFetchStubChildren';
import { SIDEBAR_CLOSE_ANIMATION_MS } from '@/modules/navigation-sidebar/domain/constants';
import type {
    LayoutItem,
    SidebarItemProps,
} from '@/modules/navigation-sidebar/domain/types';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './sidebar.module.scss';
import { SkeletonSidebarItems } from './SkeletonSidebarItems';
import { VIRTUALIZE_THRESHOLD } from './VirtualizedSidebar';

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
