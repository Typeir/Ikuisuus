/**
 * @fileoverview Dynamic OG image API route.
 *
 * Generates a 1200×630 PNG Open Graph card on demand for any supported
 * content type and slug. The route is intentionally excluded from
 * static generation (`force-static`) so it runs at request time.
 *
 * URL pattern: `/api/og/[type]/[slug]`
 *
 * Supported types: `monsters`, `heirlooms`, `spells`, `trinkets`,
 * `bloodlines`, `vocations`, `specializations`
 *
 * The PNG is aggressively cached (`s-maxage=31536000, immutable`) because
 * content rarely changes between deployments and re-generating a card is
 * expensive (font fetch + satori + resvg).
 *
 * @module src/app/api/og/[type]/[slug]/route
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 *
 * @example
 * ```
 * GET /api/og/monsters/abominable-avian
 * → 200 image/png
 *
 * GET /api/og/heirlooms/unknown-item
 * → 404 { error: "Not found" }
 * ```
 */

import {
    getOgCardData,
    getSupportedOgTypes,
    resolveOgBackgroundImagePath,
    resolveOgImagePath,
} from '@/lib/seo/og/data';
import { convertToPngDataUri } from '@/lib/seo/og/pngConverter';
import { renderOgCard } from '@/lib/seo/og/renderer';
import { resolveMetadataBase } from '@/lib/seo/resolveMetadataBase';

export const dynamic = 'force-dynamic';

/** Cache-Control header value: 1 year immutable. */
const CACHE_CONTROL = 'public, s-maxage=31536000, immutable';

/**
 * Route segment params resolved by Next.js from the URL path.
 *
 * @interface RouteParams
 * @property {string} type - Content type key (e.g. `"monsters"`)
 * @property {string} slug - Entity slug (e.g. `"abominable-avian"`)
 */
interface RouteParams {
  type: string;
  slug: string;
}

/**
 * GET /api/og/[type]/[slug]
 *
 * Validates the type and slug, renders the OG card to a PNG buffer, and
 * returns it with long-lived immutable caching headers.
 *
 * Returns 400 when the type is not in the supported list.
 * Returns 404 when no metadata record exists for the slug.
 * Returns 500 when rendering fails unexpectedly.
 *
 * @param {Request} _req - Incoming request (unused; params carry all info)
 * @param {{ params: Promise<RouteParams> }} context - Next.js route context
 * @returns {Promise<Response>} PNG image response or JSON error response
 */
export async function GET(
  _req: Request,
  context: { params: Promise<RouteParams> },
): Promise<Response> {
  const { type, slug } = await context.params;

  if (!getSupportedOgTypes().includes(type)) {
    return Response.json(
      { error: 'Unsupported content type' },
      { status: 400 },
    );
  }

  const data = await getOgCardData(type, slug);
  if (!data) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const imagePath = resolveOgImagePath(type, slug);
  const imageUrlRemote = imagePath
    ? new URL(imagePath, resolveMetadataBase()).toString()
    : undefined;

  const bgPath = resolveOgBackgroundImagePath(type, slug);
  const bgUrlRemote = bgPath
    ? new URL(bgPath, resolveMetadataBase()).toString()
    : undefined;

  const imageDataUri = imageUrlRemote
    ? await convertToPngDataUri(imageUrlRemote)
    : undefined;
  const backgroundImageUrl = bgUrlRemote
    ? await convertToPngDataUri(bgUrlRemote)
    : undefined;

  try {
    const png = await renderOgCard({
      data,
      imageUrl: imageDataUri,
      backgroundImageUrl,
      description: data.description,
    });
    return new Response(png as any, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': CACHE_CONTROL,
      },
    });
  } catch {
    return Response.json({ error: 'Render failed' }, { status: 500 });
  }
}
