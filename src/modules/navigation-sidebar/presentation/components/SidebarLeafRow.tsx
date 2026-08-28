/**
 * @fileoverview Leaf row for virtualized sidebar lists
 * @description Renders the link-only markup of a leaf item with none of the
 * folder machinery in `SidebarItem` — no context subscription, no fetch hook,
 * no effects. Structure matches `SidebarItem`'s leaf branch so the stylesheet
 * selectors match both; `leafFade` is the one addition, fading each row in as
 * it scrolls into the virtual window.
 *
 * @module lib/components/sidebar/SidebarLeafRow
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */
'use client';

import { LazyPrefetchLink } from '@/lib/components/lazyPrefetchLink';
import { cn } from '@/lib/utils/classNameMerge';
import type { LayoutItem } from '@/modules/navigation-sidebar/domain/types';
import type { JSX } from 'react';
import { memo } from 'react';
import styles from './sidebar.module.scss';

/**
 * Props for SidebarLeafRow.
 *
 * @interface SidebarLeafRowProps
 * @property {LayoutItem} item - Leaf item to render.
 * @property {string} locale - Active locale segment for the link href.
 * @property {() => void} [onNavigate] - Navigation callback.
 */
export interface SidebarLeafRowProps {
  item: LayoutItem;
  locale: string;
  onNavigate?: () => void;
}

/**
 * Memoized leaf row. Rendered per virtualized row in place of the full
 * `SidebarItem` when the item has no children and is not a stub.
 *
 * @param {SidebarLeafRowProps} props - Component props.
 * @returns {JSX.Element} A list item wrapping a prefetch-on-hover link.
 */
export const SidebarLeafRow = memo(function SidebarLeafRow({
  item,
  locale,
  onNavigate,
}: SidebarLeafRowProps): JSX.Element {
  return (
    <li className={cn('ml-4', styles.leafFade)}>
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
});
