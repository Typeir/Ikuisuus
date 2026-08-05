/**
 * @fileoverview Embed Route Vocabulary
 * @description Single source of truth for the `/{locale}/embed/...` route tree
 * and its relationship to `/{locale}/library/...`.
 *
 * Embed mode is carried by the path rather than a query parameter. The library
 * routes are statically generated, and `useSearchParams()` returns empty values
 * during prerender, so a `?embed=true` flag could only take effect after
 * hydration — every embedded page shipped the full wiki chrome in its HTML and
 * swapped it out later, and any navigation that dropped the parameter left the
 * chrome in place for good. A path segment is known at build time, so each
 * variant prerenders with the shell it actually wants and needs no JavaScript to
 * stay correct.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @module src/lib/embed/embedRoutes
 */

/**
 * Matches the leading `/{locale}/library` of a pathname, capturing the locale.
 * The lookahead keeps `/en/libraryish` from matching.
 */
const LIBRARY_ROUTE = /^\/([^/]+)\/library(?=\/|$)/;

/**
 * Matches the leading `/{locale}/embed` of a pathname, capturing the locale.
 */
const EMBED_ROUTE = /^\/([^/]+)\/embed(?=\/|$)/;

/**
 * Reports whether a pathname belongs to the chrome-less embed route tree.
 *
 * @param {string} pathname - Pathname to test, without origin
 * @returns {boolean} True for `/{locale}/embed` and anything beneath it
 */
export const isEmbedPathname = (pathname: string): boolean =>
  EMBED_ROUTE.test(pathname);

/**
 * Reports whether a pathname belongs to the full-chrome library route tree.
 *
 * @param {string} pathname - Pathname to test, without origin
 * @returns {boolean} True for `/{locale}/library` and anything beneath it
 */
export const isLibraryPathname = (pathname: string): boolean =>
  LIBRARY_ROUTE.test(pathname);

/**
 * Rewrites a library pathname onto the embed route tree, leaving the locale and
 * every following segment untouched. Pathnames that are already embed routes,
 * and pathnames belonging to neither tree, are returned unchanged.
 *
 * @param {string} pathname - Pathname to rewrite, without origin
 * @returns {string} Equivalent pathname inside the embed tree
 */
export const toEmbedPathname = (pathname: string): string =>
  pathname.replace(LIBRARY_ROUTE, '/$1/embed');

/**
 * Rewrites an embed pathname back onto the library route tree.
 *
 * @param {string} pathname - Pathname to rewrite, without origin
 * @returns {string} Equivalent pathname inside the library tree
 */
export const toLibraryPathname = (pathname: string): string =>
  pathname.replace(EMBED_ROUTE, '/$1/library');

/**
 * Builds the URL an iframe should load to render a piece of library content
 * without the wiki chrome.
 *
 * @param {string} contentPath - Library path relative to the locale (e.g. `"world/ordovica"`)
 * @param {string} locale - Current locale code (e.g. `"en"`)
 * @returns {string} Absolute-path URL inside the embed route tree
 */
export const buildEmbedUrl = (contentPath: string, locale: string): string =>
  `/${locale}/embed/${contentPath}`;
