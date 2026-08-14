/**
 * @fileoverview Specializations API route. Serves specialization metadata as JSON.
 * @description Reads specialization metadata from the content repository. Supports
 * ?locale query parameter (default 'en') and optional ?vocation filter.
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
 * const response = await fetch('/api/specializations?locale=en&vocation=Berserker');
 * const specializations = await response.json();
 * ```
 * @module src/app/api/specializations/route
 */
import { specializationRepository } from '@/lib/db/content/repositories/specializationRepository';
import { logger } from '@/lib/logging/logger';
import { NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Specializations' });

/**
 * GET /api/specializations
 * Returns array of specialization metadata from the content repository.
 * Accepts locale (default 'en') and optional vocation query parameters.
 *
 * @param {Request} req - Next.js request object
 * @returns {NextResponse} JSON array of specialization objects
 *
 * @example
 * fetch('/api/specializations?locale=en')
 * fetch('/api/specializations?locale=en&vocation=Berserker')
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';
  const vocation = searchParams.get('vocation');

  try {
    const specializations = vocation
      ? await specializationRepository.listByVocation(locale, vocation)
      : await specializationRepository.list(locale);
    return NextResponse.json(specializations);
  } catch (error) {
    log.error('Error loading specialization metadata', {
      error: error instanceof Error ? error.message : String(error),
      locale,
      vocation,
    });
    return NextResponse.json(
      { error: 'Failed to load specializations' },
      { status: 500 },
    );
  }
}
