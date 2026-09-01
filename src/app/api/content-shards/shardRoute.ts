/**
 * @fileoverview Content Shard Route Factory
 * @description Builds the GET handler the per-type content-shard routes share:
 * parse locale and `keys[]`, load metadata by slug, read the content file,
 * resolve shards, attach keyword shards.
 *
 * @module src/app/api/content-shards/shardRoute
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { isSupportedLocale } from '@/lib/constants/locales';
import { getFile } from '@/lib/db/content/fileTreeService';
import { logger } from '@/lib/logging/logger';
import {
  resolveShards,
  type ShardableEntry,
} from '@/lib/utils/contentShardResolver';
import { NextResponse } from 'next/server';
import { keywordShardsFor } from './keywordShards';

/**
 * Configuration for one content-shard route.
 *
 * @interface ShardRouteConfig
 * @template M - Metadata record the lookup returns
 * @property {string} label - Capitalized kind for error strings and the log child, e.g. `Vocation`
 * @property {string} shardType - Singular kind echoed in the response, e.g. `vocation`
 * @property {(locale: string, slug: string) => Promise<M | null>} getMeta - Metadata lookup by slug
 * @property {(meta: M) => ShardableEntry[] | undefined} entriesOf - Shardable entries of a record; undefined resolves as empty
 */
export interface ShardRouteConfig<M extends { file: string }> {
  label: string;
  shardType: string;
  getMeta: (locale: string, slug: string) => Promise<M | null>;
  entriesOf: (meta: M) => ShardableEntry[] | undefined;
}

/**
 * Route segment context Next.js hands the per-type handlers.
 *
 * @interface ShardRouteContext
 * @property {Promise<{ slug: string }>} params - Route segment params
 */
export interface ShardRouteContext {
  params: Promise<{ slug: string }>;
}

/**
 * Builds the shared GET handler for a content-shard route.
 *
 * `keys[]` query parameters request a subset of shards; absence returns all
 * known shards including `main`. Responds 404 when the slug or its content
 * file is unknown, 500 on resolution failure.
 *
 * @template M - Metadata record the lookup returns
 * @param {ShardRouteConfig<M>} config - Route configuration
 * @returns {(req: Request, context: ShardRouteContext) => Promise<NextResponse>} Route handler
 *
 * @example
 * export const GET = shardRouteFor({
 *   label: 'Vocation',
 *   shardType: 'vocation',
 *   getMeta: (locale, slug) => vocationRepository.getBySlug(locale, slug),
 *   entriesOf: (meta) => meta.features,
 * });
 */
export function shardRouteFor<M extends { file: string }>(
  config: ShardRouteConfig<M>,
): (req: Request, context: ShardRouteContext) => Promise<NextResponse> {
  const { label, shardType, getMeta, entriesOf } = config;
  const log = logger.child({ module: `API:ContentShards:${label}s` });
  const lower = label.toLowerCase();

  return async function GET(
    req: Request,
    context: ShardRouteContext,
  ): Promise<NextResponse> {
    const { slug } = await context.params;
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') ?? 'en';
    const keys = searchParams.getAll('keys[]');

    if (!isSupportedLocale(locale)) {
      return NextResponse.json(
        { error: `Unsupported locale: ${locale}` },
        { status: 400 },
      );
    }

    try {
      const meta = await getMeta(locale, slug);
      if (!meta) {
        return NextResponse.json(
          { error: `${label} not found: ${slug}` },
          { status: 404 },
        );
      }

      const fileResult = await getFile(locale, meta.file);
      if (!fileResult) {
        log.error(`Content file not found for ${lower}`, {
          slug,
          file: meta.file,
        });
        return NextResponse.json(
          { error: `Content file not found for ${lower}: ${slug}` },
          { status: 404 },
        );
      }

      const shards = resolveShards(
        fileResult.content,
        entriesOf(meta) ?? [],
        keys,
      );
      const keywordShards = await keywordShardsFor(shards, locale);
      return NextResponse.json({ shardType, shards, keywordShards });
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
  };
}
