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
 * @param {string} slug - Affix slug (e.g., 'bloodthirsty')
 * @query {string} locale - Locale code (e.g., 'en'). Defaults to 'en'.
 * @returns {Object} Affix metadata with slug, title, and link
 *
 * @example
 * // Request: GET /api/affixes/bloodthirsty?locale=en
 * // Response:
 * { slug: "bloodthirsty", title: "Bloodthirsty", link: "/library/rules/heroic-awakening/bloodthirsty" }
 */

import { HeroicAffix } from '@/lib/enums/encounterPlanner';
import { logger } from '@/lib/logging/logger';
import { NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Affix:Single' });

/** Slug→title lookup derived from HeroicAffix enum */
const HEROIC_AFFIXES_MAP: Record<string, { slug: string; title: string }> =
  Object.fromEntries(
    Object.values(HeroicAffix).map((title) => {
      const slug = title.toLowerCase();
      return [slug, { slug, title }];
    }),
  );

export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string }> },
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
      slug: await context.params.then((p) => p.slug),
      locale: new URL(req.url).searchParams.get('locale') || 'en',
    });
    return NextResponse.json(
      { error: 'Failed to load affix' },
      { status: 500 },
    );
  }
}
