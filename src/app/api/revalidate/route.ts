/**
 * @fileoverview On-Demand ISR Revalidation API
 * @description Accepts POST requests with a shared secret and a list of paths
 * to revalidate. Called by the content repo's auto-merge GitHub Action after
 * a correction PR is merged, ensuring the affected pages are regenerated.
 *
 * @module app/api/revalidate/route
 */

import { contentCacheTag } from '@/lib/db/content/contentCacheTags';
import { logger } from '@/lib/logging/logger';
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Revalidate' });

/**
 * @function extractLocale
 * @description Extracts the locale from a given path. Assumes the locale is the first segment of the path.
 * @param {string} urlPath - The path to extract the locale from (e.g., "/en/library/monsters").
 * @returns {string | null} The extracted locale, or null if no valid locale is found.
 */
const extractLocale = (urlPath: string): string | null => {
  const parts = urlPath.split('/').filter(Boolean);
  if (parts.length > 0) {
    return parts[0];
  }
  return null;
};

/**
 * @function extractSlugPath
 * @description Extracts the content slug from a full URL path by stripping the
 * locale and /library/ prefix. This produces a slug that matches the tag format
 * used by fetchContent (e.g. "items/heirlooms/sacred-heresy").
 * @param {string} urlPath - Full URL path (e.g. "/en/library/items/heirlooms/sacred-heresy")
 * @returns {string} The content slug path without locale or /library/ prefix
 */
const extractSlugPath = (urlPath: string): string => {
  const parts = urlPath.split('/').filter(Boolean);
  const libraryIndex = parts.indexOf('library');
  if (libraryIndex !== -1) {
    return parts.slice(libraryIndex + 1).join('/');
  }
  return parts.slice(1).join('/');
};

/**
 * POST /api/revalidate
 *
 * @description Revalidates one or more library paths via ISR.
 * Requires `REVALIDATION_SECRET` env var and matching `x-revalidation-secret` header.
 *
 * Body: `{ paths: string[] }` — e.g. `["/library/monsters/albedo-the-bleak-bloom"]`
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATION_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: 'Revalidation is not configured' },
      { status: 503 },
    );
  }

  const provided = req.headers.get('x-revalidation-secret');
  if (!provided || provided !== secret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  let body: { paths?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { paths } = body;
  if (!Array.isArray(paths) || paths.length === 0) {
    return NextResponse.json(
      { error: 'Missing or empty: paths' },
      { status: 400 },
    );
  }

  if (paths.length > 50) {
    return NextResponse.json(
      { error: 'Too many paths (max 50)' },
      { status: 400 },
    );
  }

  const results: { path: string; status: 'ok' | 'error'; error?: string }[] =
    [];

  for (const p of paths) {
    if (typeof p !== 'string' || !p.startsWith('/')) {
      results.push({ path: String(p), status: 'error', error: 'Invalid path' });
      continue;
    }

    try {
      // Expand common variants to handle .sheet suffixes and /main fallbacks.
      const variants: string[] = [];
      const pushVariant = (v: string) => {
        const normalized = v.replace(/\/+$|\s+/g, '');
        if (!variants.includes(normalized)) variants.push(normalized);
      };

      pushVariant(p);

      // Toggle .sheet on the last segment: add if missing, remove if present
      const parts = p.split('/').filter(Boolean);
      if (parts.length > 0) {
        const last = parts[parts.length - 1];
        if (!/\.sheet$/.test(last)) {
          const withSheet =
            '/' + parts.slice(0, -1).concat(`${last}.sheet`).join('/');
          pushVariant(withSheet);
        } else {
          const withoutSheet =
            '/' +
            parts
              .slice(0, -1)
              .concat(last.replace(/\.sheet$/, ''))
              .join('/');
          pushVariant(withoutSheet);
        }
        // also try /main variant
        pushVariant(p.endsWith('/main') ? p : `${p}/main`);
      }

      const locale = extractLocale(p);
      const slugPath = extractSlugPath(p);
      const fetchTag = locale ? contentCacheTag(locale, slugPath) : null;

      log.message('Revalidating path variants', {
        path: p,
        variants,
        locale,
        slugPath,
        fetchTag,
      });

      if (fetchTag) {
        revalidateTag(fetchTag);
        log.message('Invalidated fetch cache tag', { tag: fetchTag });
      }

      for (const v of variants) {
        try {
          revalidatePath(v, 'page');
          log.message('Revalidated', { path: v });
        } catch (err) {
          log.warning('Failed to revalidate variant', {
            path: v,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      results.push({ path: p, status: 'ok' });
    } catch (err) {
      results.push({
        path: p,
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  log.message('ISR revalidation completed', {
    total: paths.length,
    ok: results.filter((r) => r.status === 'ok').length,
    errors: results.filter((r) => r.status === 'error').length,
  });

  return NextResponse.json({ results }, { status: 200 });
}
