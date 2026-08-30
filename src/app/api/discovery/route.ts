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
  bloodlineRepository,
  featRepository,
  heirloomRepository,
  monsterRepository,
  ruleRepository,
  specializationRepository,
  spellRepository,
  trinketRepository,
  vocationRepository,
  worldRepository,
} from '@/lib/db/content/repositories';
import type { BaseMetadata } from '@/lib/db/content/schemas/baseMetadata';
import {
  CONTENT_SUBDIR,
  localizeLink,
  SUPPORTED_LOCALES,
  type SearchContentType,
} from '@/modules/search/domain';
import { NextResponse } from 'next/server';

/**
 * The card fields discovery reads. `image` is optional across the schemas and
 * absent from the shared base, so it is named here rather than assumed.
 *
 * @typedef {object} DiscoverableRecord
 */
type DiscoverableRecord = BaseMetadata & { image?: string };

/**
 * Content type mapped to the repository that serves it. Reading through the
 * ports keeps discovery on whichever backend the deployment runs, rather than
 * assuming the sidecar mirror is on disk.
 */
const REPOSITORIES: Record<
  SearchContentType,
  { list(locale: string): Promise<DiscoverableRecord[]> }
> = {
  bloodlines: bloodlineRepository,
  feats: featRepository,
  heirlooms: heirloomRepository,
  monsters: monsterRepository,
  rules: ruleRepository,
  specializations: specializationRepository,
  spells: spellRepository,
  trinkets: trinketRepository,
  vocations: vocationRepository,
  world: worldRepository,
};

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
      const records = await REPOSITORIES[type].list(locale);

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
              readingTime: records[featuredIdx].readingTime,
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
              readingTime: records[randomIdx].readingTime,
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
