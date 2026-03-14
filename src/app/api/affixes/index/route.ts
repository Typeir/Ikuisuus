/**
 * @fileoverview Affixes Index API Route
 * @description Returns a lightweight index of all heroic awakening affixes with their wiki links.
 * Maps HeroicAffix enum values to wiki routes based on locale.
 * 
 * @module /api/affixes/index
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @route GET /api/affixes/index
 * @query locale {string} - Locale code (e.g., 'en'). Defaults to 'en'.
 * @returns {Object[]} Array of affix entries with slug, title, and link
 * 
 * @example
 * // Request: GET /api/affixes/index?locale=en
 * // Response:
 * [
 *   { slug: "bloodthirsty", title: "Bloodthirsty", link: "/library/rules/heroic-awakening/bloodthirsty" },
 *   { slug: "championed", title: "Championed", link: "/library/rules/heroic-awakening/championed" },
 *   ...
 * ]
 */

import { HeroicAffix } from '@/lib/enums/encounterPlanner';
import { logger } from '@/lib/logging/logger';
import { NextRequest, NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Affixes:Index' });

export async function GET(request: NextRequest) {
  try {
    const locale = request.nextUrl.searchParams.get('locale') || 'en';

    const affixes = Object.values(HeroicAffix).map(title => {
      const slug = title.toLowerCase();
      return {
        slug,
        title,
        link: `/library/rules/heroic-awakening/${slug}`,
      };
    });

    return NextResponse.json(affixes);
  } catch (error) {
    log.error('Error loading affix index', {
      error: error instanceof Error ? error.message : String(error),
      locale: request.nextUrl.searchParams.get('locale') || 'en'
    });
    return NextResponse.json({ error: 'Failed to load affix index' }, { status: 500 });
  }
}
