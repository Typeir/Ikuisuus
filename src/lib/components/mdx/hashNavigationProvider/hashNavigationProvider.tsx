/**
 * @fileoverview Hash Navigation Provider Component
 * @description Client-side wrapper to enable hash navigation for MDX headings
 *
 * @module HashNavigationProvider
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useHashNavigation } from '@/lib/hooks/useHashNavigation';

/**
 * Client-side wrapper component that enables hash navigation for MDX headings.
 *
 * Provides hash navigation functionality to server-rendered MDX content by
 * wrapping the `useHashNavigation` hook in a client component that renders nothing.
 * This allows async server components to enable hash navigation without violating
 * React's rules about hooks in server components.
 *
 * @remarks
 * - Must be rendered in the component tree (typically near the MDX content)
 * - Renders `null` - has no visual output
 * - Works with any elements that have `data-anchor` attributes
 * - Enables smooth scrolling to anchors via URL hash changes
 *
 * @example
 * // In a server component:
 * export default async function Page() {
 *   const content = await getContent();
 *   return (
 *     <div>
 *       <HashNavigationProvider />
 *       <article>{content}</article>
 *     </div>
 *   );
 * }
 *
 * @returns {null} - This component has no visual output
 */
export function HashNavigationProvider(): null {
  useHashNavigation();
  return null;
}
