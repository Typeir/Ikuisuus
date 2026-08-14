/**
 * @fileoverview Embed Route Vocabulary
 * @description Maps pathnames and URLs between the `/{locale}/embed/...` route
 * tree and the `/{locale}/library/...` route tree.
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
