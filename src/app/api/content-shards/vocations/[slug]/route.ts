/**
 * @fileoverview Vocation Content Shards API Route
 * @description Returns named prose shards for a specific vocation. The server
 * resolves each shard server-side using metadata line anchors or heading-text
 * search so callers never need to know the internal file structure.
 *
 * @module src/app/api/content-shards/vocations/[slug]/route
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 *
 * @example
 * ```
 * GET /api/content-shards/vocations/barbarian?locale=en
 * GET /api/content-shards/vocations/barbarian?locale=en&keys[]=Rage&keys[]=Unarmored+Defense
 * → { shardType: 'vocation', shards: { Rage: '...', 'Unarmored Defense': '...' } }
 * ```
 */

import { getFile } from '@/lib/db/content/fileTreeService';
import { vocationRepository } from '@/lib/db/content/repositories/vocationRepository';
import { logger } from '@/lib/logging/logger';
import { resolveShards } from '@/lib/utils/contentShardResolver';
import { NextResponse } from 'next/server';

const log = logger.child({ module: 'API:ContentShards:Vocations' });

/**
 * GET /api/content-shards/vocations/[slug]
 *
 * Returns resolved prose shards for the requested vocation. Accepts optional
 * `keys[]` query parameters to request a subset of shards. When no keys are
 * provided all known shards (including `main`) are returned.
 *
 * @param {Request} req - Next.js request object
 * @param {{ params: Promise<{ slug: string }> }} context - Route segment params
 * @returns {Promise<NextResponse>} JSON `{ shardType, shards }` or error object
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await context.params;
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') ?? 'en';
  const keys = searchParams.getAll('keys[]');

  try {
    const meta = await vocationRepository.getBySlug(locale, slug);
    if (!meta) {
      return NextResponse.json(
        { error: `Vocation not found: ${slug}` },
        { status: 404 },
      );
    }

    const fileResult = await getFile(locale, meta.file);
    if (!fileResult) {
      log.error('Content file not found for vocation', {
        slug,
        file: meta.file,
      });
      return NextResponse.json(
        { error: `Content file not found for vocation: ${slug}` },
        { status: 404 },
      );
    }

    const shards = resolveShards(fileResult.content, meta.features, keys);
    return NextResponse.json({ shardType: 'vocation', shards });
  } catch (error) {
    log.error('Error resolving vocation shards', {
      error: error instanceof Error ? error.message : String(error),
      slug,
      locale,
    });
    return NextResponse.json(
      { error: 'Failed to resolve vocation shards' },
      { status: 500 },
    );
  }
}
