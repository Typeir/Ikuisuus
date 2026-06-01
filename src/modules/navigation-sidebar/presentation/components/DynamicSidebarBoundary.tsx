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
