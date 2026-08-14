/**
 * @fileoverview POST endpoint that revalidates ISR paths.
 * @description Authenticates via shared secret and archives active drafts
 * for revalidated locale+slug pairs.
 *
 * @module app/api/revalidate/route
 * @author Typeir
 * @version 1.1.0
 * @since 2.0.0
 */

import { contentCacheTag } from '@/lib/db/content/contentCacheTags';
import { draftRepository } from '@/lib/db/content/repositories/draftRepository';
import { logger } from '@/lib/logging/logger';
import { syncMetadata } from '@/lib/metadata/syncService';
import crypto from 'crypto';
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
 * @function resolveContentType
 * @description Maps a slug path to the metadata content type key used by the sync service.
 * Returns null for paths that do not correspond to a synced content table.
 * @param {string} slugPath - Content slug path (e.g. 'monsters/albedo', 'items/heirlooms/foo')
 * @returns {string | null} Sync service content type key, or null
 */
const resolveContentType = (slugPath: string): string | null => {
  if (slugPath.startsWith('monsters/')) return 'monsters';
  if (slugPath.startsWith('items/heirlooms/')) return 'heirlooms';
  if (slugPath.startsWith('spells/')) return 'spells';
  if (slugPath.startsWith('items/trinkets/')) return 'trinkets';
  return null;
};

/**
 * @function archiveDraftForPath
 * @description Archives the active draft for a locale+slug pair.
 * Failures are logged; never throws.
 * @param {string | null} locale - Content locale, or null if extraction failed
 * @param {string} slugPath - Content slug path
 * @returns {Promise<boolean>} True if a draft was archived
 */
const archiveDraftForPath = async (
  locale: string | null,
  slugPath: string,
): Promise<boolean> => {
  if (!locale || !slugPath) return false;

  try {
    const archived = await draftRepository.archive(locale, slugPath);
    if (archived) {
      log.message('Archived draft after revalidation', {
        locale,
        slug: slugPath,
      });
    }
    return archived;
  } catch (err) {
    log.warning('Failed to archive draft (non-blocking)', {
      locale,
      slug: slugPath,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
};

/**
 * @function syncMetadataForPath
 * @description Runs a hash-based incremental metadata sync for the content type
 * of a slug path. No-op when the slug has no known content type; failures
 * are logged, never thrown.
 * @param {string | null} locale - Content locale
 * @param {string} slugPath - Content slug path
 * @returns {Promise<void>}
 */
const syncMetadataForPath = async (
  locale: string | null,
  slugPath: string,
): Promise<void> => {
  if (!locale || !slugPath) return;
  const contentType = resolveContentType(slugPath);
  if (!contentType) return;

  try {
    await syncMetadata({ locale, contentTypes: [contentType] });
    log.message('Post-publish metadata sync completed', {
      locale,
      contentType,
      slug: slugPath,
    });
  } catch (err) {
    log.warning('Post-publish metadata sync failed (non-blocking)', {
      locale,
      contentType,
      slug: slugPath,
      error: err instanceof Error ? err.message : String(err),
    });
  }
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
  if (
    !provided ||
    provided.length !== secret.length ||
    !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(secret))
  ) {
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
      /** Expand common variants to handle .sheet suffixes and /main fallbacks */
      const variants: string[] = [];
      const pushVariant = (v: string) => {
        const normalized = v.replace(/\/+$|\s+/g, '');
        if (!variants.includes(normalized)) variants.push(normalized);
      };

      pushVariant(p);

      /** Toggle content suffix on the last segment: try both with and without suffix */
      const SUFFIX_RE =
        /\.(sheet|specialization|list|reference|heirloom|trinket|bloodline|lore)$/;
      const parts = p.split('/').filter(Boolean);
      if (parts.length > 0) {
        const last = parts[parts.length - 1];
        if (SUFFIX_RE.test(last)) {
          const withoutSuffix =
            '/' +
            parts.slice(0, -1).concat(last.replace(SUFFIX_RE, '')).join('/');
          pushVariant(withoutSuffix);
        }
        /** Also try /main variant */
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
        revalidateTag(fetchTag, 'max');
        log.message('Invalidated fetch cache tag', { tag: fetchTag });
      }

      for (const v of variants) {
        try {
          revalidatePath(v, 'page');
          revalidatePath(v, 'layout');
          log.message('Revalidated', { path: v });
        } catch (err) {
          log.warning('Failed to revalidate variant', {
            path: v,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      results.push({ path: p, status: 'ok' });

      const wasArchived = await archiveDraftForPath(locale, slugPath);
      if (wasArchived) {
        await syncMetadataForPath(locale, slugPath);
      }
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

  try {
    const mod = await import('@/lib/db/content');
    if (mod && typeof mod.clearCache === 'function') {
      mod.clearCache();
      log.message('Cleared file-tree cache after revalidation');
    }
  } catch (err) {
    log.warning('Failed to clear file-tree cache after revalidation', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return NextResponse.json({ results }, { status: 200 });
}
