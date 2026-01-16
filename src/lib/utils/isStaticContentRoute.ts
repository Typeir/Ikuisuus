/**
 * Static Route Detection Utility
 *
 * @fileoverview Determines if the current route is a statically generated MDX content route.
 * Used to control persistence behavior: static routes derive expansion from URL only,
 * while dynamic routes can restore from localStorage.
 *
 * @module lib/utils/isStaticContentRoute
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @description
 * The distinction between static and dynamic routes is critical for:
 * - Build-time generation: Static routes must not depend on per-request state
 * - Deterministic expansion: Static pages expand ancestors based on URL pathname
 * - Persistence: Only dynamic routes should restore sidebar state from localStorage
 *
 * Static routes (expansion from URL only):
 * - /[locale]/library/** (MDX content pages)
 *
 * Dynamic routes (persistence allowed):
 * - /[locale]/utils/** (tools like encounter planner)
 * - /[locale] (home page)
 *
 * @example
 * ```typescript
 * import { isStaticContentRoute } from '@/lib/utils/isStaticContentRoute';
 *
 * if (isStaticContentRoute()) {
 *   // Use URL-derived expansion only
 * } else {
 *   // Allow localStorage restoration
 * }
 * ```
 */

/**
 * Pattern matching static content routes
 *
 * @constant
 * @type {RegExp}
 *
 * @description
 * Matches routes under /[locale]/library/ which are statically generated MDX pages.
 * These routes use `export const dynamic = 'force-static'` and must not depend
 * on per-request state like localStorage values.
 */
const STATIC_CONTENT_ROUTE_PATTERN = /^\/[a-z]{2}\/library\//;

/**
 * Determines if the current route is a statically generated content route
 *
 * @function isStaticContentRoute
 * @param {string} [pathname] - Optional pathname to check. Defaults to window.location.pathname
 * @returns {boolean} True if the route is a static content route
 *
 * @description
 * Checks if the current (or provided) pathname matches the pattern for static
 * content routes. Static routes derive sidebar expansion deterministically from
 * the URL pathname rather than restoring from localStorage.
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
 * Determines if the current route allows sidebar persistence
 *
 * @function allowsSidebarPersistence
 * @param {string} [pathname] - Optional pathname to check. Defaults to window.location.pathname
 * @returns {boolean} True if the route allows restoring sidebar state from localStorage
 *
 * @description
 * Inverse of isStaticContentRoute. Dynamic routes can restore sidebar state
 * from localStorage for a consistent user experience across page loads.
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
