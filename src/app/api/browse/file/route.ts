/**
 * @fileoverview Browse File API Route
 * @description Fuzzy-matches a slug to a library content file and returns its
 * raw MDX source as JSON. Built for agents and external API consumers: one
 * GET, no session, cacheable.
 *
 * @module app/api/browse/file/route
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @example
 * GET /api/browse/file?slug=gobli&locale=en
 * → { query, locale, match: { route, slugPath, title, similarity }, alternates, source }
 */

import { isSupportedLocale } from '@/lib/constants/locales';
import { logger } from '@/lib/logging/logger';
import { findNearestFiles } from '@/modules/library/application/use-cases/findNearestRoute';
import { fetchContent } from '@/modules/library/infrastructure/content/fetchContent';
import { NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Browse:File' });

/** Candidates ranked per request; the first that loads wins. */
const CANDIDATE_LIMIT = 6;

/** CDN cache policy for browse responses. */
const CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400';

/**
 * GET /api/browse/file?slug=<fuzzy>&locale=en
 *
 * Returns the best-matching content file with its raw MDX source, plus ranked
 * alternates so a caller can disambiguate. `source` keeps frontmatter intact —
 * deliberate for this audience, since the frontmatter is metadata. 404 when
 * nothing matches or no candidate file loads.
 *
 * @param {Request} req - Next.js request object
 * @returns {Promise<NextResponse>} JSON payload or error object
 */
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const locale = searchParams.get('locale') ?? 'en';

  if (!slug || !slug.trim()) {
    return NextResponse.json(
      { error: 'Missing required query parameter: slug' },
      { status: 400 },
    );
  }

  if (!isSupportedLocale(locale)) {
    return NextResponse.json(
      { error: `Unsupported locale: ${locale}` },
      { status: 400 },
    );
  }

  try {
    const matches = findNearestFiles(slug, CANDIDATE_LIMIT);
    if (matches.length === 0) {
      return NextResponse.json(
        { error: `No content matches slug: ${slug}` },
        { status: 404 },
      );
    }

    for (const [index, match] of matches.entries()) {
      const slugPath = match.path.replace(/^\/library\//, '');
      const file = await fetchContent(locale, slugPath);
      if (!file) continue;

      const alternates = matches
        .filter((_, i) => i !== index)
        .map((alternate) => ({
          route: `/${locale}${alternate.path}`,
          title: alternate.title,
          similarity: alternate.similarity,
        }));

      return NextResponse.json(
        {
          query: slug,
          locale,
          match: {
            route: `/${locale}${match.path}`,
            slugPath,
            title: match.title,
            similarity: match.similarity,
          },
          alternates,
          source: file.content,
        },
        { headers: { 'Cache-Control': CACHE_CONTROL } },
      );
    }

    return NextResponse.json(
      { error: `Matched routes exist but no content file loads for: ${slug}` },
      { status: 404 },
    );
  } catch (error) {
    log.error('Error resolving browse file', {
      error: error instanceof Error ? error.message : String(error),
      slug,
      locale,
    });
    return NextResponse.json(
      { error: 'Failed to resolve content file' },
      { status: 500 },
    );
  }
}
