/**
 * @fileoverview Heirlooms API Route - Magical item metadata JSON endpoint for HeirloomTable
 * @description Next.js API route that serves heirloom item metadata via the content
 * adapter layer. Supports locale-aware content via ?locale query parameter. Returns
 * array of heirloom objects with rarity, item type, weapon properties, and attunement
 * requirements. Used by HeirloomTableWrapper for client-side data fetching.
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
 */
import { listHeirlooms } from '@/lib/db/content';
import { logger } from '@/lib/logging/logger';
import { NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Heirlooms' });

/**
 * GET /api/heirlooms
 *
 * Returns array of heirloom item metadata from the active content adapter.
 * Accepts optional locale query parameter (defaults to 'en').
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
    const heirlooms = await listHeirlooms(locale);
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
