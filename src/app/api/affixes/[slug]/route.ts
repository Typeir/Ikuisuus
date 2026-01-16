/**
 * @fileoverview Single Affix API Route
 * @description Returns metadata for a single heroic awakening affix by slug.
 * Maps HeroicAffix enum values to wiki routes based on locale.
 *
 * @module /api/affixes/[slug]
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @route GET /api/affixes/[slug]
 * @param slug {string} - Affix slug (e.g., 'bloodthirsty')
 * @query locale {string} - Locale code (e.g., 'en'). Defaults to 'en'.
 * @returns {Object} Affix metadata with slug, title, and link
 *
 * @example
 * // Request: GET /api/affixes/bloodthirsty?locale=en
 * // Response:
 * { slug: "bloodthirsty", title: "Bloodthirsty", link: "/library/rules/heroic-awakening/bloodthirsty" }
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logging/logger';

const log = logger.child({ module: 'API:Affix:Single' });

/**
 * Heroic Awakening Affixes mapped to wiki slugs
 * Each affix maps to its kebab-case filename in the wiki
 */
const HEROIC_AFFIXES_MAP: Record<string, { slug: string; title: string }> = {
  bloodthirsty: { slug: 'bloodthirsty', title: 'Bloodthirsty' },
  championed: { slug: 'championed', title: 'Championed' },
  crusading: { slug: 'crusading', title: 'Crusading' },
  flametongued: { slug: 'flametongued', title: 'Flametongued' },
  frostveined: { slug: 'frostveined', title: 'Frostveined' },
  psionic: { slug: 'psionic', title: 'Psionic' },
  rakish: { slug: 'rakish', title: 'Rakish' },
  stormbound: { slug: 'stormbound', title: 'Stormbound' },
  sulphurous: { slug: 'sulphurous', title: 'Sulphurous' },
};

export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'en';

    const affix = HEROIC_AFFIXES_MAP[slug];

    if (!affix) {
      return NextResponse.json({ error: 'Affix not found' }, { status: 404 });
    }

    return NextResponse.json({
      slug: affix.slug,
      title: affix.title,
      link: `/library/rules/heroic-awakening/${affix.slug}`,
    });
  } catch (error) {
    log.error('Error loading affix', {
      error: error instanceof Error ? error.message : String(error),
      slug: await context.params.then(p => p.slug),
      locale: new URL(req.url).searchParams.get('locale') || 'en'
    });
    return NextResponse.json(
      { error: 'Failed to load affix' },
      { status: 500 }
    );
  }
}
