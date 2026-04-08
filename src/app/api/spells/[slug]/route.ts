/**
 * @fileoverview Spell Details API Route - Fetch single spell by slug
 * @description Returns full metadata for a specific spell by slug. Uses the spell
 * repository for typed, adapter-agnostic data access. Handles both local and
 * external spells transparently.
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
 * // Fetch specific spell details
 * const response = await fetch('/api/spells/fireball?locale=en');
 * const spell = await response.json();
 * ```
 * @module src/app/api/spells/[slug]/route
 */
import { spellRepository } from '@/lib/db/content/repositories/spellRepository';
import { logger } from '@/lib/logging/logger';
import { NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Spell:Single' });

/**
 * GET /api/spells/[slug]
 *
 * Returns full metadata for a specific spell.
 * Accepts optional locale query parameter (defaults to 'en').
 *
 * @param {Request} req - Next.js request object
 * @param {Object} context - Next.js context
 * @param {Promise<Object>} context.params - Route parameters (async in Next.js 15)
 * @param {string} context.params.slug - Spell slug identifier
 * @returns {NextResponse} JSON spell object or 404
 *
 * @example
 * fetch('/api/spells/fireball?locale=en')
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get('locale') || 'en';
  const { slug } = await params;

  try {
    const spell = await spellRepository.getBySlug(locale, slug);

    if (spell) {
      return NextResponse.json(spell);
    }

    return NextResponse.json({ error: 'Spell not found' }, { status: 404 });
  } catch (error) {
    log.error('Error loading spell details', {
      error: error instanceof Error ? error.message : String(error),
      slug,
      locale,
    });
    return NextResponse.json(
      { error: 'Failed to load spell details' },
      { status: 500 },
    );
  }
}
