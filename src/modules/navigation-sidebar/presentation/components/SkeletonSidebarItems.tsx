/**
 * @fileoverview Skeleton loading component for sidebar items
 * @module lib/components/sidebar/SkeletonSidebarItems
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */
'use client';

import { cn } from '@/lib/utils/classNameMerge';
import sk from '@/lib/components/skeleton/skeleton.module.scss';

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
