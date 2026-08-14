/**
 * @fileoverview Specialization Content Shards API Route
 * @description Returns named prose shards for a specialization. Resolves each
 * shard server-side via metadata line anchors or heading-text search.
 *
 * @module src/app/api/content-shards/specializations/[slug]/route
 * @version 1.1.0
 * @author Typeir
 * @since 1.0.0
 *
 * @example
 * ```
 * GET /api/content-shards/specializations/path-of-the-berserker?locale=en
 * → { shardType: 'specialization', shards: { main: '...', 'Frenzy': '...' } }
 * ```
 */

import { getFile } from '@/lib/db/content/fileTreeService';
import { specializationRepository } from '@/lib/db/content/repositories/specializationRepository';
import { logger } from '@/lib/logging/logger';
import { resolveShards } from '@/lib/utils/contentShardResolver';
import { NextResponse } from 'next/server';

const log = logger.child({ module: 'API:ContentShards:Specializations' });

/**
 * GET /api/content-shards/specializations/[slug]
 *
 * Returns resolved prose shards for the requested specialization. Accepts optional
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
    const meta = await specializationRepository.getBySlug(locale, slug);
    if (!meta) {
      return NextResponse.json(
        { error: `Specialization not found: ${slug}` },
        { status: 404 },
      );
    }

    const fileResult = await getFile(locale, meta.file);
    if (!fileResult) {
      log.error('Content file not found for specialization', {
        slug,
        file: meta.file,
      });
      return NextResponse.json(
        { error: `Content file not found for specialization: ${slug}` },
        { status: 404 },
      );
    }

    const shards = resolveShards(fileResult.content, meta.features, keys);
    return NextResponse.json({ shardType: 'specialization', shards });
  } catch (error) {
    log.error('Error resolving specialization shards', {
      error: error instanceof Error ? error.message : String(error),
      slug,
      locale,
    });
    return NextResponse.json(
      { error: 'Failed to resolve specialization shards' },
      { status: 500 },
    );
  }
}
