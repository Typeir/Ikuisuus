/**
 * @fileoverview Bloodlines API route.
 * @description Serves bloodline metadata via the content adapter layer.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 *
 * @requires next/server
 * @requires @/lib/db/content
 *
 * @example
 * ```typescript
 * const response = await fetch('/api/bloodlines?locale=en');
 * const bloodlines = await response.json();
 * ```
 * @module src/app/api/bloodlines/route
 */
import { bloodlineRepository } from '@/lib/db/content/repositories/bloodlineRepository';
import { logger } from '@/lib/logging/logger';
import { NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Bloodlines' });

/**
 * GET /api/bloodlines
 *
 * Returns array of bloodline metadata from the active content repository.
 *
 * @param {Request} req - Next.js request object
 * @returns {NextResponse} JSON array of bloodline objects
 *
 * @example
 * fetch('/api/bloodlines?locale=en')
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';

  try {
    const bloodlines = await bloodlineRepository.list(locale);
    return NextResponse.json(bloodlines);
  } catch (error) {
    log.error('Error loading bloodline metadata', {
      error: error instanceof Error ? error.message : String(error),
      locale,
    });
    return NextResponse.json(
      { error: 'Failed to load bloodlines' },
      { status: 500 },
    );
  }
}
