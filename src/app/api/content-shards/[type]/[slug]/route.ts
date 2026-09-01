/**
 * @fileoverview Content Shard API Route
 * @description Resolves shards for any registered type — repository-backed
 * content and keyword references through one pipeline. The address differs per
 * type; the extraction does not.
 *
 * Returns source, not HTML. The caller compiles, which keeps `Unit`,
 * `DiceRoll` and nested keywords live. Keyword resolution happens here because
 * the browser compile has no index: every response carries the definitions and
 * stamp targets for the references its prose writes, so the card that opens
 * next costs no further request. References living deeper are fetched when
 * their own card opens — following them here would pull each shard's
 * dependencies onto the page, and theirs after that.
 *
 * @module src/app/api/content-shards/[type]/[slug]/route
 * @version 3.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { isSupportedLocale } from '@/lib/constants/locales';
import { logger } from '@/lib/logging/logger';
import {
  resolveDocumentKeywords,
  resolveTargetShards,
  type DocumentKeywords,
} from '@/lib/md/resolveShardByRef';
import type { ContentShardResponse, ResolvedShard } from '@/lib/types/api';
import { NextResponse } from 'next/server';
import { shardTypeRegistry } from '../../shardTypes';

const log = logger.child({ module: 'API:ContentShards' });

/**
 * Keywords for a shard payload. Failure returns an empty result rather than
 * throwing: a missing definition costs a card, and must not cost the prose it
 * was written in.
 *
 * @param {ResolvedShard[]} shards - Resolved prose
 * @param {string} locale - Content locale
 * @returns {Promise<DocumentKeywords>} Definitions and stamp targets, empty on failure
 */
async function keywordsFor(
  shards: ResolvedShard[],
  locale: string,
): Promise<DocumentKeywords> {
  const prose = shards.map((shard) => shard.source).join('\n\n');
  if (!prose) return { shards: [], resolutions: {} };

  try {
    return await resolveDocumentKeywords(prose, locale);
  } catch (error) {
    log.warning('Keyword resolution failed for shard payload', {
      locale,
      error: error instanceof Error ? error.message : String(error),
    });
    return { shards: [], resolutions: {} };
  }
}

/**
 * GET /api/content-shards/[type]/[slug]
 *
 * `type` is a registry key; `slug` is that type's address — a content slug, or
 * a URL-encoded keyword reference for `keyword`. `keys[]` query parameters
 * request a subset of shards; absence returns all known shards including
 * `main`. Responds 404 when the type, address, or content file is unknown, 500
 * on resolution failure.
 *
 * @param {Request} req - Next.js request object
 * @param {{ params: Promise<{ type: string; slug: string }> }} context - Route segment params
 * @returns {Promise<NextResponse>} JSON {@link ContentShardResponse}, or error
 *
 * @example
 * GET /api/content-shards/vocations/Berserker?locale=en&keys[]=Rage
 * GET /api/content-shards/keyword/condition%3Bblinded?locale=en
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ type: string; slug: string }> },
): Promise<NextResponse> {
  const { type, slug } = await context.params;
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') ?? 'en';
  const keys = searchParams.getAll('keys[]');

  if (!isSupportedLocale(locale)) {
    return NextResponse.json(
      { error: `Unsupported locale: ${locale}` },
      { status: 400 },
    );
  }

  const config = shardTypeRegistry[type];
  if (!config) {
    return NextResponse.json(
      { error: `Unknown shard type: ${type}` },
      { status: 404 },
    );
  }
  const lower = config.label.toLowerCase();

  try {
    const target = await config.locate(locale, slug);
    if (!target) {
      return NextResponse.json(
        { error: `${config.label} not found: ${slug}` },
        { status: 404 },
      );
    }

    const shards = await resolveTargetShards(target, locale, keys);
    if (!shards) {
      log.error(`Content file not found for ${lower}`, {
        slug,
        file: target.file,
      });
      return NextResponse.json(
        { error: `Content file not found for ${lower}: ${slug}` },
        { status: 404 },
      );
    }

    if (shards.length === 0) {
      return NextResponse.json(
        { error: `${config.label} resolves to nothing: ${slug}` },
        { status: 404 },
      );
    }

    const keywords = await keywordsFor(shards, locale);
    const body: ContentShardResponse = {
      shardType: config.shardType,
      shards,
      keywordShards: keywords.shards,
      resolutions: keywords.resolutions,
    };
    return NextResponse.json(body);
  } catch (error) {
    log.error(`Error resolving ${lower} shards`, {
      error: error instanceof Error ? error.message : String(error),
      slug,
      locale,
    });
    return NextResponse.json(
      { error: `Failed to resolve ${lower} shards` },
      { status: 500 },
    );
  }
}
