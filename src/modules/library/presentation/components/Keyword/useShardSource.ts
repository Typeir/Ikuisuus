/**
 * @fileoverview Shard Source Resolution
 * @description Answers a card's one question: what prose defines this keyword.
 *
 * A page bakes the references it writes, so those cards open from context with
 * no request. A reference living inside one of those shards is not baked —
 * following them at compile would pull each shard's dependencies onto the page,
 * and theirs after that, until every page carried the whole corpus. Those are
 * fetched here instead, on the open that needs one.
 *
 * A fetch asks for the shard's own keywords too, so the card after it opens
 * from what this request already returned rather than a second connection.
 *
 * @module modules/library/presentation/components/Keyword/useShardSource
 * @version 2.0.0
 * @author Typeir
 * @since 8.0.0
 */

'use client';

import { fetcher } from '@/lib/fetch/fetcher';
import { urlForKeywordShard } from '@/lib/fetch/swrKeys';
import type { ContentShardResponse, ResolvedShard } from '@/lib/types/api';
import { useEffect, useState } from 'react';
import { useKeywordShard } from './KeywordShardContext';

/**
 * Shards already in hand, keyed by `locale:id`. Filled by a card's own request
 * and by the keywords that request carried, so a shard is fetched once per
 * session however many cards open on it.
 */
const resolved = new Map<string, ResolvedShard>();

/** In-flight requests, keyed by `locale:reference`, so two cards share one. */
const pending = new Map<string, Promise<ResolvedShard | null>>();

/**
 * Requests one shard, and the shards its prose will need next.
 *
 * @param {string} reference - Normalised reference, `namespace;value` or a bare value
 * @param {string} locale - Content locale
 * @returns {Promise<ResolvedShard | null>} The shard, or null when it resolves to nothing
 */
async function fetchShard(
  reference: string,
  locale: string,
): Promise<ResolvedShard | null> {
  const key = `${locale}:${reference}`;
  const inFlight = pending.get(key);
  if (inFlight) return inFlight;

  const url = urlForKeywordShard(reference, locale);

  /* A reference that resolves to nothing is a 404, which the fetcher throws on.
     That is an answer, not a failure: the card stays closed either way. */
  const request = fetcher<ContentShardResponse>(url)
    .then((body) => {
      const shard = body.shards[0];
      if (!shard) return null;

      for (const nested of body.keywordShards) {
        resolved.set(`${locale}:${nested.id}`, nested);
      }
      resolved.set(`${locale}:${shard.id}`, shard);

      return shard;
    })
    .catch(() => null);

  pending.set(key, request);
  return request;
}

/**
 * Resolves a card's shard from the page, then from what an earlier card already
 * fetched, then from the endpoint.
 *
 * @param {string | undefined} id - Shard id stamped at compile, when the page baked one
 * @param {string} reference - Normalised reference, used when the page did not
 * @param {string} locale - Content locale
 * @returns {ResolvedShard | null} The shard, or null until one arrives
 *
 * @example
 * const shard = useShardSource(templateId, 'condition;blinded', 'en');
 */
export function useShardSource(
  id: string | undefined,
  reference: string,
  locale: string,
): ResolvedShard | null {
  const baked = useKeywordShard(id);
  const carried = id ? (resolved.get(`${locale}:${id}`) ?? null) : null;
  const [fetched, setFetched] = useState<ResolvedShard | null>(null);

  const known = baked ?? carried;

  useEffect(() => {
    if (known || !reference) return;

    let active = true;
    void fetchShard(reference, locale).then((shard) => {
      if (active) setFetched(shard);
    });

    return () => {
      active = false;
    };
  }, [known, reference, locale]);

  return known ?? fetched;
}
