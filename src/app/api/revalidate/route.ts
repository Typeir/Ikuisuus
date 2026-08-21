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
import {
  MAIN_INDEX_SLUG,
  REGEX_CONTENT_SUFFIX,
  stripContentSuffix,
} from '@/lib/enums/constants';
import { logger } from '@/lib/logging/logger';
import { contentTypeFromFrontmatter, type ContentType } from '@/lib/metadata/contentTypes';
import {
  archiveDraftForPath,
  classifyByListing,
  extractLocale,
  extractSlugPath,
  syncMetadataForLocales,
  type RevalidateTarget,
} from './revalidateHelpers';
import crypto from 'crypto';
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { LIBRARY_SEGMENT } from '@/lib/enums/constants';

const log = logger.child({ module: 'API:Revalidate' });

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

  let body: { paths?: (string | RevalidateTarget)[] };
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

  const pendingSync = new Map<string, Set<ContentType>>();

  for (const target of paths) {
    const p = typeof target === 'string' ? target : target?.path;
    const declared =
      typeof target === 'string' ? undefined : target?.contentType;

    if (typeof p !== 'string' || !p.startsWith('/')) {
      results.push({ path: String(p), status: 'error', error: 'Invalid path' });
      continue;
    }

    try {
      const variants: string[] = [];
      const pushVariant = (v: string) => {
        const normalized = v.replace(/\/+$|\s+/g, '');
        if (!variants.includes(normalized)) variants.push(normalized);
      };

      pushVariant(p);

      const parts = p.split('/').filter(Boolean);
      if (parts.length > 0) {
        const last = parts[parts.length - 1];
        if (REGEX_CONTENT_SUFFIX.test(last)) {
          const withoutSuffix =
            '/' + parts.slice(0, -1).concat(stripContentSuffix(last)).join('/');
          pushVariant(withoutSuffix);
        }
        pushVariant(
          p.endsWith(`/${MAIN_INDEX_SLUG}`) ? p : `${p}/${MAIN_INDEX_SLUG}`,
        );
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

      await archiveDraftForPath(locale, slugPath);

      const contentType =
        contentTypeFromFrontmatter(declared) ??
        (locale ? await classifyByListing(locale, slugPath) : null);
      if (locale && contentType) {
        const forLocale = pendingSync.get(locale) ?? new Set<ContentType>();
        forLocale.add(contentType);
        pendingSync.set(locale, forLocale);
      }
    } catch (err) {
      results.push({
        path: p,
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const metadata = await syncMetadataForLocales(pendingSync);

  log.message('ISR revalidation completed', {
    total: paths.length,
    ok: results.filter((r) => r.status === 'ok').length,
    errors: results.filter((r) => r.status === 'error').length,
    metadataSynced: metadata.filter((m) => m.status === 'ok').length,
    metadataErrors: metadata.filter((m) => m.status === 'error').length,
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

  return NextResponse.json({ results, metadata }, { status: 200 });
}
