/**
 * @fileoverview Feats API route serving feat metadata JSON.
 * @description Reads ?locale query parameter; defaults to 'en'.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/feats?locale=en');
 * const feats = await response.json();
 * ```
 * @module src/app/api/feats/route
 */
import { featRepository } from '@/lib/db/content/repositories/featRepository';
import { logger } from '@/lib/logging/logger';
import { NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Feats' });

/**
 * GET /api/feats
 *
 * Returns array of feat metadata. locale defaults to 'en'.
 * Returns 500 on repository error.
 *
 * @param {Request} req - Next.js request object
 * @returns {Promise<NextResponse>} JSON array of feat objects
 */
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';

  try {
    const feats = await featRepository.list(locale);
    return NextResponse.json(feats);
  } catch (error) {
    log.error('Error loading feat metadata', {
      error: error instanceof Error ? error.message : String(error),
      locale,
    });
    return NextResponse.json(
      { error: 'Failed to load feats' },
      { status: 500 },
    );
  }
}
