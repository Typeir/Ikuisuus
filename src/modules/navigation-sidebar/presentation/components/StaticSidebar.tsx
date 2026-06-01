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
