/**
 * @fileoverview Trinkets API Route - Adventuring gear metadata JSON endpoint for TrinketTable
 * @description Next.js API route that serves trinket item metadata via the content
 * adapter layer. Supports locale-aware content via ?locale query parameter. Returns
 * array of trinket objects with item type, damage, properties, range, weight, and
 * special effects. Used by TrinketTableWrapper for client-side data fetching.
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
 * // Fetch English trinkets
 * const response = await fetch('/api/trinkets?locale=en');
 * const trinkets = await response.json();
 * ```
 * @module src/app/api/trinkets/route
 */
import { trinketRepository } from '@/lib/db/content/repositories/trinketRepository';
import { logger } from '@/lib/logging/logger';
import { NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Trinkets' });

/**
 * GET /api/trinkets
 *
 * Returns array of trinket item metadata from the active content repository.
 * Accepts optional locale query parameter (defaults to 'en').
 *
 * @param {Request} req - Next.js request object
 * @returns {NextResponse} JSON array of trinket objects
 *
 * @example
 * fetch('/api/trinkets?locale=en')
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';

  try {
    const trinkets = await trinketRepository.list(locale);
    return NextResponse.json(trinkets);
  } catch (error) {
    log.error('Error loading trinket metadata', {
      error: error instanceof Error ? error.message : String(error),
      locale,
    });
    return NextResponse.json(
      { error: 'Failed to load trinkets' },
      { status: 500 },
    );
  }
}
