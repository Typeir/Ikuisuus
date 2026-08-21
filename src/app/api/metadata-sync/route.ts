/**
 * @fileoverview Metadata Sync API Endpoint
 * @description Triggers hash-based incremental metadata sync from filesystem
 * to PostgreSQL.
 *
 * Auth: `x-sync-secret` header compared via constant-time equality against
 * the `METADATA_SYNC_SECRET` environment variable.
 *
 * Body (JSON):
 *   - locale: string (optional, defaults to 'en')
 *   - contentTypes: string[] (optional, defaults to all)
 *
 * @module app/api/metadata-sync/route
 * @version 1.0.0
 * @author Typeir
 * @since 7.0.0
 */

import { logger } from '@/lib/logging/logger';
import { isContentType } from '@/lib/metadata/contentTypes';
import { syncMetadata } from '@/lib/metadata/syncService';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const log = logger.child({ module: 'API:MetadataSync' });

/**
 * POST /api/metadata-sync
 *
 * @param {NextRequest} req - Incoming request
 * @returns {Promise<NextResponse>} Sync results or error
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.METADATA_SYNC_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'Metadata sync is not configured' },
      { status: 503 },
    );
  }

  const provided = req.headers.get('x-sync-secret');
  if (
    !provided ||
    provided.length !== secret.length ||
    !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(secret))
  ) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  let body: { locale?: string; contentTypes?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const locale = body.locale ?? 'en';
  if (typeof locale !== 'string' || locale.length > 5) {
    return NextResponse.json({ error: 'Invalid locale' }, { status: 400 });
  }

  const contentTypes = body.contentTypes;
  if (contentTypes !== undefined) {
    if (!Array.isArray(contentTypes) || contentTypes.length === 0) {
      return NextResponse.json(
        { error: 'contentTypes must be a non-empty array' },
        { status: 400 },
      );
    }
    for (const ct of contentTypes) {
      if (typeof ct !== 'string' || !isContentType(ct)) {
        return NextResponse.json(
          { error: `Unknown content type: ${ct}` },
          { status: 400 },
        );
      }
    }
  }

  try {
    log.message('Metadata sync triggered', { locale, contentTypes });

    const results = await syncMetadata({ locale, contentTypes });

    log.message('Metadata sync completed', { locale, results });

    return NextResponse.json({ ok: true, locale, results }, { status: 200 });
  } catch (error) {
    log.error('Metadata sync failed', {
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    return NextResponse.json(
      { error: 'Sync failed', message: (error as Error).message },
      { status: 500 },
    );
  }
}
