/**
 * @fileoverview Determines if the current route is a statically generated MDX content route.
 * Static routes derive expansion from URL only; dynamic routes can restore from localStorage.
 *
 * @module modules/library/application/selectors/isStaticContentRoute
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @description
 * Static routes (expansion from URL only):
 * - /[locale]/library/** (MDX content pages)
 *
 * Dynamic routes (persistence allowed):
 * - /[locale]/utils/** (tools like encounter planner)
 * - /[locale] (home page)
 *
 * @example
 * ```typescript
 * import { isStaticContentRoute } from '@/modules/library/application/selectors/isStaticContentRoute';
 *
 * if (isStaticContentRoute()) {
 *   // Use URL-derived expansion only
 * } else {
 *   // Allow localStorage restoration
 * }
 * ```
 */

/**
 * @constant
 * @type {RegExp}
 *
 * @description
 * Matches routes under /[locale]/library/, the statically generated MDX pages.
 */
const STATIC_CONTENT_ROUTE_PATTERN = /^\/[a-z]{2}\/library\//;

/**
 * Determines if the current route is a statically generated content route.
 *
 * @function isStaticContentRoute
 * @param {string} [pathname] - Optional pathname to check. Defaults to window.location.pathname
 * @returns {boolean} True if the route is a static content route, false when window is undefined and no pathname is given
 *
 * @description
 * Tests if the current (or provided) pathname matches the static content route pattern.
 *
 * @example
 * ```typescript
 * // On /en/library/monsters/albedo
 * isStaticContentRoute(); // true
 *
 * // On /en/utils/encounter-planner
 * isStaticContentRoute(); // false
 *
 * // With explicit pathname
 * isStaticContentRoute('/es/library/items/heirlooms'); // true
 * ```
 */
export function isStaticContentRoute(pathname?: string): boolean {
  if (typeof window === 'undefined' && !pathname) {
    return false;
  }

  const path = pathname ?? window.location.pathname;
  return STATIC_CONTENT_ROUTE_PATTERN.test(path);
}

/**
 * Inverse of isStaticContentRoute.
 *
 * @function allowsSidebarPersistence
 * @param {string} [pathname] - Optional pathname to check. Defaults to window.location.pathname
 * @returns {boolean} True if the route allows restoring sidebar state from localStorage
 *
 * @description
 * Returns the negation of isStaticContentRoute(pathname).
 *
 * @example
 * ```typescript
 * // On /en/utils/encounter-planner
 * allowsSidebarPersistence(); // true
 *
 * // On /en/library/monsters/albedo
 * allowsSidebarPersistence(); // false
 * ```
 */
export function allowsSidebarPersistence(pathname?: string): boolean {
  return !isStaticContentRoute(pathname);
}
