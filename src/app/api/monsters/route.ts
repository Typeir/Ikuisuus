/**
 * @fileoverview Monsters API Route - Monster metadata JSON endpoint for MonsterTable
 * @description Next.js API route that serves monster stat block metadata via the
 * content adapter layer. Supports locale-aware content via ?locale query parameter.
 * Flattens multi-stat-block arrays (e.g., dragon variants in single file) into
 * unified response. Used by MonsterTableWrapper for client-side data fetching.
 *
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires next/server
 * @requires @/lib/db/content
 *
 * @example
 * ```typescript
 * // Fetch English monsters
 * const response = await fetch('/api/monsters?locale=en');
 * const monsters = await response.json();
 *
 * // Fetch Spanish monsters
 * const response = await fetch('/api/monsters?locale=es');
 * ```
 */
import { monsterRepository } from '@/lib/db/content/repositories/monsterRepository';
import { logger } from '@/lib/logging/logger';
import { NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Monsters' });

/**
 * GET /api/monsters
 *
 * Returns array of monster metadata from the active content repository.
 * Accepts optional locale query parameter (defaults to 'en').
 *
 * @param {Request} req - Next.js request object
 * @returns {NextResponse} JSON array of monster objects
 *
 * @example
 * fetch('/api/monsters?locale=en')
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';

  try {
    const monsters = await monsterRepository.list(locale);
    return NextResponse.json(monsters);
  } catch (error) {
    log.error('Error loading monster metadata', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Failed to load monsters' },
      { status: 500 },
    );
  }
}
