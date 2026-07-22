/**
 * @fileoverview Discovery API Route
 * @description Returns deterministic daily-featured + random entries per
 * content type. Query params: `locale` (default 'en'), `type` (optional,
 * returns all types when omitted).
 *
 * @module app/api/discovery/route
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import {
  CONTENT_SUBDIR,
  localizeLink,
  SUPPORTED_LOCALES,
  type SearchContentType,
} from '@/modules/search/domain';
import { NextResponse } from 'next/server';

/** Allowlisted locale codes. */
const VALID_LOCALES = new Set<string>(SUPPORTED_LOCALES);

/** All valid content type keys. */
const VALID_TYPES = Object.keys(CONTENT_SUBDIR);

/** Simple FNV-1a-like hash for deterministic daily seed. */
function dailySeed(dateIso: string, type: string, locale: string): number {
  const str = `${dateIso}:${type}:${locale}`;
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Deterministic index from a daily seed into a candidate list.
 *
 * @param {string} dateIso - YYYY-MM-DD UTC date
 * @param {string} type - Content type key
 * @param {string} locale - Locale code
 * @param {number} count - Candidate count
 * @returns {number} Stable index (0..count-1)
 */
function dailyIndex(
  dateIso: string,
  type: string,
  locale: string,
  count: number,
): number {
  if (count === 0) return 0;
  return dailySeed(dateIso, type, locale) % count;
}

/**
 * GET /api/discovery
 *
 * Returns daily-featured + random entries per content type. Backed by
 * filesystem metadata sidecar reads.
 *
 * @param {Request} req - Next.js request
 * @returns {NextResponse} JSON discovery set
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const rawLocale = searchParams.get('locale') || 'en';
    const typeFilter = searchParams.get('type');
    const today = new Date().toISOString().slice(0, 10);

    /** Block path traversal via locale param. */
    if (!VALID_LOCALES.has(rawLocale)) {
      return NextResponse.json(
        { error: `Invalid locale: "${rawLocale}"` },
        { status: 400 },
      );
    }

    const locale = rawLocale;

    /** Block unknown types — no raw fallback. */
    const types = typeFilter
      ? VALID_TYPES.includes(typeFilter)
        ? [typeFilter]
        : (() => {
            return [];
          })()
      : VALID_TYPES;

    if (typeFilter && types.length === 0) {
      return NextResponse.json(
        { error: `Invalid type: "${typeFilter}"` },
        { status: 400 },
      );
    }

    const result: Record<string, { featured: unknown; random: unknown }> = {};

    for (const type of types as SearchContentType[]) {
      const { readMetadataFiles } =
        await import('@/lib/db/content/adapters/fs/readMetadataFiles');

      const subdir = CONTENT_SUBDIR[type];

      const records = await readMetadataFiles<{
        slug: string;
        title: string;
        link: string;
        description?: string;
        image?: string;
      }>(locale, subdir);

      if (records.length === 0) {
        result[type] = { featured: null, random: null };
        continue;
      }

      const featuredIdx = dailyIndex(today, type, locale, records.length);
      const randomIdx = Math.floor(Math.random() * records.length);

      result[type] = {
        featured: records[featuredIdx]
          ? {
              slug: records[featuredIdx].slug,
              title: records[featuredIdx].title,
              link: localizeLink(records[featuredIdx].link, locale),
              description: records[featuredIdx].description,
              image: records[featuredIdx].image,
              type,
            }
          : null,
        random: records[randomIdx]
          ? {
              slug: records[randomIdx].slug,
              title: records[randomIdx].title,
              link: localizeLink(records[randomIdx].link, locale),
              description: records[randomIdx].description,
              image: records[randomIdx].image,
              type,
            }
          : null,
      };
    }

    return NextResponse.json({ date: today, locale, entries: result });
  } catch (err) {
    console.error('[discovery]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
