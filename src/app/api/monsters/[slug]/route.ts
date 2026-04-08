/**
 * @fileoverview Single Monster API Route - Fetch individual monster metadata by slug
 * @description Returns full monster metadata for a specific creature by slug/subSlug.
 * Uses the monster repository for typed, adapter-agnostic data access.
 *
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires next/server
 * @requires @/lib/db/content/contentService
 *
 * @example
 * ```typescript
 * // Fetch specific monster
 * const response = await fetch('/api/monsters/ancient-red-dragon?locale=en');
 * const monster = await response.json();
 * ```
 * @module src/app/api/monsters/[slug]/route
 */
import { monsterRepository } from '@/lib/db/content/repositories/monsterRepository';
import { logger } from '@/lib/logging/logger';
import { NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Monster:Single' });

/**
 * GET /api/monsters/[slug]
 *
 * Returns full metadata for a single monster by slug or subSlug.
 *
 * @param {Request} req - Next.js request object
 * @param {Object} context - Route context with params
 * @returns {NextResponse} JSON monster object or 404 error
 *
 * @example
 * fetch('/api/monsters/albedo-the-bleak-bloom?locale=en')
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';

  try {
    const monster = await monsterRepository.getBySlug(locale, slug);

    if (monster) {
      return NextResponse.json(monster);
    }

    return NextResponse.json({ error: 'Monster not found' }, { status: 404 });
  } catch (error) {
    log.error('Error loading monster', {
      error: error instanceof Error ? error.message : String(error),
      slug,
      locale,
    });
    return NextResponse.json(
      { error: 'Failed to load monster' },
      { status: 500 },
    );
  }
}
