/**
 * @fileoverview Spells API Route - Spell metadata JSON endpoint for SpellTable
 * @description Next.js API route that serves spell metadata via the content adapter
 * layer. Supports locale-aware content via ?locale query parameter. Returns array of
 * spell objects with level, school, casting time, components, and concentration
 * requirements. Used by SpellTableWrapper for client-side data fetching.
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
 * // Fetch English spells
 * const response = await fetch('/api/spells', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ locale: 'en' })
 * });
 * const spells = await response.json();
 * ```
 */
import { spellRepository } from '@/lib/db/content/repositories/spellRepository';
import { logger } from '@/lib/logging/logger';
import { NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Spells:List' });

/**
 * POST /api/spells
 *
 * Returns array of spell metadata from the active content repository.
 * Accepts optional locale and spells array in request body.
 *
 * @param {Request} req - Next.js request object
 * @returns {NextResponse} JSON array of spell objects
 *
 * @example
 * fetch('/api/spells', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ locale: 'en', spells: ['fireball', 'cone-of-cold'] })
 * })
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const locale = body.locale || 'en';
  const spellSlugs: string[] | undefined = body.spells;

  try {
    const spells =
      spellSlugs && spellSlugs.length > 0
        ? await spellRepository.listBySlugs(locale, spellSlugs)
        : await spellRepository.list(locale);
    return NextResponse.json(spells);
  } catch (error) {
    log.error('Error loading spell metadata', {
      error: error instanceof Error ? error.message : String(error),
      locale,
      spellCount: spellSlugs?.length,
    });
    return NextResponse.json(
      { error: 'Failed to load spells' },
      { status: 500 },
    );
  }
}
