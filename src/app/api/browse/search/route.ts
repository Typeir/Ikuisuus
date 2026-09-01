/**
 * @fileoverview Browse Search API Route
 * @description Fuzzy search over content metadata as JSON, for agents and
 * external API consumers. Ranks every record's slug and title against the
 * query with the same similarity scoring the 404 recovery uses; substring
 * hits rank above pure edit-distance matches.
 *
 * @module app/api/browse/search/route
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 *
 * @example
 * GET /api/browse/search?q=fireball&locale=en&type=spells&limit=10
 * → { query, locale, total, results: [{ type, slug, title, link, description, score }] }
 */

import { isSupportedLocale } from '@/lib/constants/locales';
import { REPOSITORIES_BY_TYPE } from '@/lib/db/content/repositories/byContentType';
import type { BaseMetadata } from '@/lib/db/content/schemas/baseMetadata';
import { logger } from '@/lib/logging/logger';
import { calculateSimilarity } from '@/modules/library/application/use-cases/findNearestRoute.levenshtein';
import {
  localizeLink,
  SEARCH_CONTENT_TYPES,
  type SearchContentType,
} from '@/modules/search/domain';
import { NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Browse:Search' });

/** Scores below this floor never surface. */
const MIN_SCORE = 0.3;

/** Substring hits rank at least this high. */
const SUBSTRING_FLOOR = 0.9;

/** Default and maximum result counts. */
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** CDN cache policy for browse responses. */
const CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400';

/**
 * Scores one record against a normalized query.
 *
 * @param {string} query - Lower-cased query
 * @param {BaseMetadata} record - Metadata record
 * @returns {number} Score in [0, 1]
 */
function scoreRecord(query: string, record: BaseMetadata): number {
  const slug = String(record.slug ?? '').toLowerCase();
  const title = String(record.title ?? '').toLowerCase();
  const similarity = Math.max(
    calculateSimilarity(query, slug),
    calculateSimilarity(query, title),
  );
  const isSubstring = slug.includes(query) || title.includes(query);
  return isSubstring ? Math.max(similarity, SUBSTRING_FLOOR) : similarity;
}

/**
 * GET /api/browse/search?q=<query>&locale=en&type=<optional>&limit=<optional>
 *
 * Returns fuzzy-ranked metadata results across all content types, or one
 * type when `type` is given.
 *
 * @param {Request} req - Next.js request object
 * @returns {Promise<NextResponse>} JSON payload or error object
 */
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const rawQuery = searchParams.get('q');
  const locale = searchParams.get('locale') ?? 'en';
  const typeFilter = searchParams.get('type');
  const limit = Math.min(
    Number.parseInt(searchParams.get('limit') ?? '', 10) || DEFAULT_LIMIT,
    MAX_LIMIT,
  );

  if (!rawQuery || !rawQuery.trim()) {
    return NextResponse.json(
      { error: 'Missing required query parameter: q' },
      { status: 400 },
    );
  }

  if (!isSupportedLocale(locale)) {
    return NextResponse.json(
      { error: `Unsupported locale: ${locale}` },
      { status: 400 },
    );
  }

  if (typeFilter && !(typeFilter in REPOSITORIES_BY_TYPE)) {
    return NextResponse.json(
      { error: `Invalid type: "${typeFilter}"` },
      { status: 400 },
    );
  }

  const query = rawQuery.trim().toLowerCase();
  const types = typeFilter
    ? [typeFilter as SearchContentType]
    : SEARCH_CONTENT_TYPES;

  try {
    const scored: Array<{
      type: SearchContentType;
      slug: string;
      title: string;
      link: string;
      description?: string;
      score: number;
    }> = [];

    for (const type of types) {
      const records = await REPOSITORIES_BY_TYPE[type].list(locale);
      for (const record of records) {
        const score = scoreRecord(query, record);
        if (score < MIN_SCORE) continue;
        scored.push({
          type,
          slug: record.slug,
          title: record.title,
          link: localizeLink(record.link, locale),
          description: record.description,
          score,
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    const results = scored.slice(0, limit);

    return NextResponse.json(
      { query: rawQuery, locale, total: scored.length, results },
      { headers: { 'Cache-Control': CACHE_CONTROL } },
    );
  } catch (error) {
    log.error('Error running browse search', {
      error: error instanceof Error ? error.message : String(error),
      query: rawQuery,
      locale,
    });
    return NextResponse.json(
      { error: 'Failed to run search' },
      { status: 500 },
    );
  }
}
