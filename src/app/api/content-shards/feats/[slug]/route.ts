/**
 * @fileoverview Feat Content Shards API Route
 * @description Returns named prose shards for a specific feat. The server
 * resolves each shard server-side using metadata or heading-text search so
 * callers never need to know the internal file structure.
 *
 * Feats currently expose only the `main` shard (full page body).
 *
 * @module src/app/api/content-shards/feats/[slug]/route
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { getFile } from '@/lib/db/content/fileTreeService';
import { featRepository } from '@/lib/db/content/repositories/featRepository';
import { logger } from '@/lib/logging/logger';
import { resolveShards } from '@/lib/utils/contentShardResolver';
import { NextResponse } from 'next/server';

const log = logger.child({ module: 'API:ContentShards:Feats' });

/**
 * GET /api/content-shards/feats/[slug]
 *
 * Returns resolved prose shards for the requested feat.
 *
 * @param {Request} req - Next.js request object
 * @param {{ params: Promise<{ slug: string }> }} context - Route segment params
 * @returns {Promise<NextResponse>} JSON `{ shardType, shards }` or error
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
    const meta = await featRepository.getBySlug(locale, slug);
    if (!meta) {
      return NextResponse.json(
        { error: `Feat not found: ${slug}` },
        { status: 404 },
      );
    }

    const fileResult = await getFile(locale, meta.file);
    if (!fileResult) {
      log.error('Content file not found for feat', { slug, file: meta.file });
      return NextResponse.json(
        { error: `Content file not found for feat: ${slug}` },
        { status: 404 },
      );
    }

    const shards = resolveShards(fileResult.content, meta.features ?? [], keys);
    return NextResponse.json({ shardType: 'feat', shards });
  } catch (error) {
    log.error('Error resolving feat shards', {
      error: error instanceof Error ? error.message : String(error),
      slug,
      locale,
    });
    return NextResponse.json(
      { error: 'Failed to resolve feat shards' },
      { status: 500 },
    );
  }
}
