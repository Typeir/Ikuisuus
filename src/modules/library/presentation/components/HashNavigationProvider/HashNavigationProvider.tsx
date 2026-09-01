/**
 * @fileoverview React component that calls useHashNavigation for MDX hash navigation.
 * @description Renders null; activates hash navigation for MDX content.
 *
 * @module modules/library/presentation/components/HashNavigationProvider/HashNavigationProvider
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import { useHashNavigation } from '@/modules/library/application/hooks/useHashNavigation';

/**
 * Client component that calls the `useHashNavigation` hook and renders null.
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
