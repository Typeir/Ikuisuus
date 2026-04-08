/**
 * @fileoverview Monster Index API Route - Lightweight monster index for combobox
 * @description Returns minimal monster metadata (slug, title, cr, size, creatureType)
 * for efficient dropdown population. Full metadata is fetched separately on selection.
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
 * // Fetch monster index
 * const response = await fetch('/api/monsters/index?locale=en');
 * const monsters = await response.json();
 * ```
 * @module src/app/api/monsters/index/route
 */
import { monsterRepository } from '@/lib/db/content/repositories/monsterRepository';
import { logger } from '@/lib/logging/logger';
import { NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Monsters:Index' });

/**
 * GET /api/monsters/index
 *
 * Returns lightweight array of monster index entries for combobox.
 * Only includes fields needed for search/display: slug, title, cr, size, creatureType.
 *
 * @param {Request} req - Next.js request object
 * @returns {NextResponse} JSON array of minimal monster objects
 *
 * @example
 * fetch('/api/monsters/index?locale=en')
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';

  try {
    const monsters = await monsterRepository.listIndex(locale);
    return NextResponse.json(monsters);
  } catch (error) {
    log.error('Error loading monster index', {
      error: error instanceof Error ? error.message : String(error),
      locale,
    });
    return NextResponse.json(
      { error: 'Failed to load monster index' },
      { status: 500 },
    );
  }
}
