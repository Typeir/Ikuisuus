/**
 * @fileoverview Spell Index API Route - Lightweight spell list for dropdown search
 * @description Returns minimal spell data for efficient dropdown/combobox search.
 * Only includes slug, title, level, and school fields to minimize payload size.
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
 * // Fetch spell index for dropdown
 * const response = await fetch('/api/spells/index?locale=en');
 * const spellIndex = await response.json();
 * ```
 */
import { spellRepository } from '@/lib/db/content/repositories/spellRepository';
import { logger } from '@/lib/logging/logger';
import { NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Spells:Index' });

/**
 * GET /api/spells/index
 *
 * Returns lightweight spell index with minimal fields for dropdown search.
 * Accepts optional locale query parameter (defaults to 'en').
 *
 * @param {Request} req - Next.js request object
 * @returns {NextResponse} JSON array of spell index entries
 *
 * @example
 * fetch('/api/spells/index?locale=en')
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';

  try {
    const spellIndex = await spellRepository.listIndex(locale);
    return NextResponse.json(spellIndex);
  } catch (error) {
    log.error('Error loading spell index', {
      error: error instanceof Error ? error.message : String(error),
      locale,
    });
    return NextResponse.json(
      { error: 'Failed to load spell index' },
      { status: 500 },
    );
  }
}
