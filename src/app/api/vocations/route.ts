/**
 * @fileoverview GET /api/vocations JSON endpoint.
 * @description Serves vocation metadata from the active content repository.
 * Accepts ?locale query parameter; defaults to 'en'. Returns array of vocation
 * objects with core traits, features, and gameplay tags.
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
 * const response = await fetch('/api/vocations?locale=en');
 * const vocations = await response.json();
 * ```
 * @module src/app/api/vocations/route
 */
import { vocationRepository } from '@/lib/db/content/repositories/vocationRepository';
import { logger } from '@/lib/logging/logger';
import { NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Vocations' });

/**
 * GET /api/vocations
 *
 * Returns array of vocation metadata from the active content repository.
 *
 * @param {Request} req - Next.js request object
 * @returns {NextResponse} 200 with JSON array of vocation objects, or 500 on load failure
 *
 * @example
 * fetch('/api/vocations?locale=en')
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';

  try {
    const vocations = await vocationRepository.list(locale);
    return NextResponse.json(vocations);
  } catch (error) {
    log.error('Error loading vocation metadata', {
      error: error instanceof Error ? error.message : String(error),
      locale,
    });
    return NextResponse.json(
      { error: 'Failed to load vocations' },
      { status: 500 },
    );
  }
}
