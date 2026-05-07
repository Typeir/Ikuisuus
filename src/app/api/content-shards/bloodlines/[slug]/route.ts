/**
 * @fileoverview Bloodline Content Shards API Route
 * @description Returns named prose shards for a specific bloodline. The server
 * resolves each shard server-side using metadata line anchors or heading-text
 * search so callers never need to know the internal file structure.
 *
 * @module src/app/api/content-shards/bloodlines/[slug]/route
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 *
 * @example
 * ```
 * GET /api/content-shards/bloodlines/empyrean?locale=en
 * GET /api/content-shards/bloodlines/empyrean?locale=en&keys[]=main&keys[]=Extended+Reach
 * → { shardType: 'bloodline', shards: { main: '...', 'Extended Reach': '...' } }
 * ```
 */

import { getFile } from '@/lib/db/content/fileTreeService';
import { bloodlineRepository } from '@/lib/db/content/repositories/bloodlineRepository';
import { logger } from '@/lib/logging/logger';
import { resolveShards } from '@/lib/utils/contentShardResolver';
import { NextResponse } from 'next/server';

const log = logger.child({ module: 'API:ContentShards:Bloodlines' });

/**
 * GET /api/content-shards/bloodlines/[slug]
 *
 * Returns resolved prose shards for the requested bloodline. Accepts optional
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
    const meta = await bloodlineRepository.getBySlug(locale, slug);
    if (!meta) {
      return NextResponse.json(
        { error: `Bloodline not found: ${slug}` },
        { status: 404 },
      );
    }

    const fileResult = await getFile(locale, meta.file);
    if (!fileResult) {
      log.error('Content file not found for bloodline', { slug, file: meta.file });
      return NextResponse.json(
        { error: `Content file not found for bloodline: ${slug}` },
        { status: 404 },
      );
    }

    const shards = resolveShards(fileResult.content, meta.boons, keys);
    return NextResponse.json({ shardType: 'bloodline', shards });
  } catch (error) {
    log.error('Error resolving bloodline shards', {
      error: error instanceof Error ? error.message : String(error),
      slug,
      locale,
    });
    return NextResponse.json(
      { error: 'Failed to resolve bloodline shards' },
      { status: 500 },
    );
  }
}
