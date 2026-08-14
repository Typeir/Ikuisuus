/**
 * @fileoverview Heirlooms API route.
 * @description Next.js route serving heirloom item metadata via the content adapter. Supports locale via ?locale query parameter. Returns array of heirlooms with rarity, item type, weapon properties, and attunement requirements. Consumed by HeirloomTableWrapper.
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
 * // Fetch English heirlooms
 * const response = await fetch('/api/heirlooms?locale=en');
 * const heirlooms = await response.json();
 * ```
 * @module src/app/api/heirlooms/route
 */
import { heirloomRepository } from '@/lib/db/content/repositories/heirloomRepository';
import { logger } from '@/lib/logging/logger';
import { NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Heirlooms' });

/**
 * GET /api/heirlooms.
 *
 * Returns array of heirloom item metadata from the active content repository. Optional locale query parameter, defaults to 'en'.
 *
 * @param {Request} req - Next.js request object
 * @returns {NextResponse} JSON array of heirloom objects
 *
 * @example
 * fetch('/api/heirlooms?locale=es')
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';

  try {
    const heirlooms = await heirloomRepository.list(locale);
    return NextResponse.json(heirlooms);
  } catch (error) {
    log.error('Error loading heirloom metadata', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Failed to load heirlooms' },
      { status: 500 },
    );
  }
}
