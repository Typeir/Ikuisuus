/**
 * @fileoverview Specializations API Route - Specialization metadata JSON endpoint
 * @description Next.js API route that serves specialization metadata via the content
 * adapter layer. Supports locale-aware content via ?locale query parameter and
 * optional ?vocation filter. Returns array of specialization objects with features,
 * spellcasting info, and gameplay tags.
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
 * const response = await fetch('/api/specializations?locale=en&vocation=barbarian');
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
 *
 * Returns array of specialization metadata from the active content repository.
 * Accepts optional locale (defaults to 'en') and vocation query parameters.
 * When vocation is provided, filters to only that vocation's specializations.
 *
 * @param {Request} req - Next.js request object
 * @returns {NextResponse} JSON array of specialization objects
 *
 * @example
 * fetch('/api/specializations?locale=en')
 * fetch('/api/specializations?locale=en&vocation=barbarian')
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
