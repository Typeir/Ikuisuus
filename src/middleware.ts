/**
 * @fileoverview Locale-enforcing middleware for Library of Ikuisuus
 * @description Forces all non-API/non-asset requests into locale-prefixed URLs using next-intl.
 * Handles three cases:
 * 1) Root path `/` redirects to `/{defaultLocale}`
 * 2) Unsupported locale-like prefixes (e.g. `/fr/...`) are replaced: `/{defaultLocale}/...`
 * 3) Missing locale prefixes (e.g. `/library/...`) are prepended: `/{defaultLocale}/library/...`
 *
 * This middleware intentionally uses redirects (not rewrites) to keep the visible URL canonical.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const intlMiddleware = createMiddleware(routing);

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
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
  const rest = parts.slice(1).join("/");
  return rest ? `/${replacement}/${rest}` : `/${replacement}`;
};

/**
 * Next.js middleware entry point.
 *
 * @param {NextRequest} req - Incoming request
 * @returns {Response} Redirect response or next-intl middleware response
 */
export default function middleware(req: NextRequest): Response {
  const { pathname } = req.nextUrl;
  const parts = pathname.split("/").filter(Boolean);

  const first = parts[0] ?? "";
  const defaultLocale = routing.defaultLocale;

  /**
   * Whitelist checked ONLY for the first path segment.
   * Extend this set to allow additional top-level routes.
   */
  const topLevelWhitelist = new Set<string>([...routing.locales]);

  /** Root path "/" redirects to default locale */
  if (!first) {
    const url = req.nextUrl.clone();
    url.pathname = `/${defaultLocale}`;
    return NextResponse.redirect(url, 308);
  }

  /** If first segment not whitelisted, replace it with default locale (keep rest intact) */
  if (!topLevelWhitelist.has(first)) {
    const url = req.nextUrl.clone();
    url.pathname = replaceFirstSegment(parts, defaultLocale);
    return NextResponse.redirect(url, 308);
  }

  /** Whitelisted locale or reserved segment: delegate to next-intl */
  return intlMiddleware(req);
}







