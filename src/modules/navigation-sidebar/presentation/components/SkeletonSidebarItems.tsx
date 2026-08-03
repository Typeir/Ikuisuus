/**
 * @fileoverview Skeleton loading component for sidebar items
 * @module lib/components/sidebar/SkeletonSidebarItems
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */
'use client';

import type { JSX } from 'react';
import sk from '@/lib/components/skeleton/skeleton.module.scss';
import { cn } from '@/lib/utils/classNameMerge';

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

  /**
   * Sidebar skeletons dither in the color of the links they stand in for.
   *
   * The matter is a plain color and the resting strength rides the sheet's
   * own dilution, which resolves to the same 45% the previous form produced.
   * That form pre-diluted the matter and then set the dilution to 100% to stop
   * it compounding, which nested one `color-mix` inside another. This was the
   * only nested case in the codebase and the only skeleton that rendered
   * invisible: the substituted value failed at computed-value time, leaving
   * `background` unset and the bar fully transparent.
   */
  const matterStyle = {
    '--skeleton-matter': 'var(--color-primary)',
    '--skeleton-rest-alpha': '45%',
  } as React.CSSProperties;

  return (
    <ul style={matterStyle}>
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
