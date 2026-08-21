/**
 * @fileoverview Locale-enforcing middleware.
 * @description Forces all non-API/non-asset requests into locale-prefixed URLs using next-intl.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * @module src/middleware
 */

import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { LIBRARY_SEGMENT, MAIN_INDEX_SLUG } from './lib/enums/constants';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};

/**
 * Determine whether a path segment looks like a locale code.
 *
 * @param {string} segment - First URL segment (e.g. "en", "es", "pt-BR")
 * @returns {boolean} True if the segment matches a locale-like format
 */

/**
 * Build a new pathname by replacing the first segment with the provided value.
 *
 * @param {string[]} parts - Path segments excluding empty segments (e.g. ["fr","whatever"])
 * @param {string} replacement - Replacement first segment (e.g. "en")
 * @returns {string} Canonical pathname starting with "/"
 */
const replaceFirstSegment = (parts: string[], replacement: string): string => {
  if (parts.length === 0) return `/${replacement}`;
  const rest = parts.slice(1).join('/');
  return rest ? `/${replacement}/${rest}` : `/${replacement}`;
};

/**
 * Strips a trailing `main` segment from library paths.
 *
 * @param {string[]} parts - Path segments, empty segments excluded
 * @returns {string | null} Canonical pathname, or null when already canonical
 */
const canonicalIndexPath = (parts: string[]): string | null => {
  if (parts.length < 3) return null;
  if (parts[parts.length - 1] !== MAIN_INDEX_SLUG) return null;
  if (parts[1] !== LIBRARY_SEGMENT) return null;
  return `/${parts.slice(0, -1).join('/')}`;
};

/**
 * Next.js middleware entry point.
 *
 * @param {NextRequest} req - Incoming request
 * @returns {Response} Redirect response or next-intl middleware response
 */
export default function middleware(req: NextRequest): Response {
  const { pathname } = req.nextUrl;
  const parts = pathname.split('/').filter(Boolean);

  const first = parts[0] ?? '';
  const defaultLocale = routing.defaultLocale;

  /**
   * Whitelist checked only for the first path segment.
   */
  const topLevelWhitelist = new Set<string>([...routing.locales]);

  if (!first) {
    const url = req.nextUrl.clone();
    url.pathname = `/${defaultLocale}`;
    return NextResponse.redirect(url, 308);
  }

  if (!topLevelWhitelist.has(first)) {
    const url = req.nextUrl.clone();
    url.pathname = replaceFirstSegment(parts, defaultLocale);
    return NextResponse.redirect(url, 308);
  }

  const canonical = canonicalIndexPath(parts);
  if (canonical) {
    const url = req.nextUrl.clone();
    url.pathname = canonical;
    return NextResponse.redirect(url, 308);
  }

  return intlMiddleware(req);
}
