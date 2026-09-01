/**
 * @fileoverview Keyword Shard API Route
 * @description Resolves a keyword reference to the prose that defines it.
 *
 * A page bakes the references it writes, so a card opened from the page costs
 * no request. A reference living *inside* one of those shards is not baked —
 * following them at compile would pull each shard's dependencies onto the page,
 * and theirs after that. Those are requested here instead, when the card that
 * needs one actually opens.
 *
 * Returns source, not HTML. The caller compiles, which keeps `Unit`,
 * `DiceRoll` and further keywords live.
 *
 * Resolution reads the `produces` array on the metadata records rather than
 * scanning content, so a request costs one file read.
 *
 * @module src/app/api/keyword-shards/route
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { logger } from '@/lib/logging/logger';
import {
  resolveDocumentKeywords,
  resolveShardByRef,
} from '@/lib/md/resolveShardByRef';
import { isSupportedLocale } from '@/lib/constants/locales';
import { NextResponse } from 'next/server';

const log = logger.child({ module: 'API:KeywordShards' });

/**
 * GET /api/keyword-shards?ref=condition;blinded&locale=en&keywords=true
 *
 * Resolves one reference. `ref` is the normalised form the extractor produces:
 * `namespace;value`, or a bare value. `keywords=true` also returns the shards
 * for whatever that prose references, so the card that opens next costs no
 * further request.
 *
 * @param {Request} req - Next.js request object
 * @returns {Promise<NextResponse>} JSON `{ id, heading, source, href }`, plus `keywordShards` and `resolutions` when asked, or error
 */
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get('ref');
  const locale = searchParams.get('locale') ?? 'en';
  const withKeywords = searchParams.get('keywords') === 'true';

  if (!reference) {
    return NextResponse.json(
      { error: 'Missing required query parameter: ref' },
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
    const shard = await resolveShardByRef(reference, locale);

    if (!shard) {
      return NextResponse.json(
        { error: `Keyword resolves to nothing: ${reference}` },
        { status: 404 },
      );
    }

    if (!withKeywords) return NextResponse.json(shard);

    /* The card about to render this prose will need its keywords next. Sending
       them now spends the connection already open rather than a second one. */
    const { shards, resolutions } = await resolveDocumentKeywords(
      shard.source,
      locale,
    );

    return NextResponse.json({ ...shard, keywordShards: shards, resolutions });
  } catch (error) {
    log.error('Error resolving keyword shard', {
      error: error instanceof Error ? error.message : String(error),
      reference,
      locale,
    });
    return NextResponse.json(
      { error: 'Failed to resolve keyword shard' },
      { status: 500 },
    );
  }
}
