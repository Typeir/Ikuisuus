/**
 * @fileoverview Draft API — GET & POST
 * @description REST endpoint for draft CRUD. Authenticated via the same
 * shared revalidation secret used by the ISR endpoint.
 *
 * - `GET /api/drafts?locale=en&slug=monsters/albedo` — fetch active draft
 * - `POST /api/drafts` — create or update a draft (upsert)
 *
 * @module app/api/drafts/route
 * @version 1.0.0
 * @author Typeir
 * @since 6.0.0
 */

import { draftRepository } from '@/lib/db/content/repositories/draftRepository';
import { logger } from '@/lib/logging/logger';
import { NextRequest, NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Drafts' });

/**
 * @function authenticateRequest
 * @description Validates the revalidation secret header.
 * @param {NextRequest} req - Incoming request
 * @returns {NextResponse | null} Error response if auth fails, null if ok
 */
const authenticateRequest = (req: NextRequest): NextResponse | null => {
  const secret = process.env.REVALIDATION_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'Draft API is not configured' },
      { status: 503 },
    );
  }

  const provided = req.headers.get('x-revalidation-secret');
  if (!provided || provided !== secret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  return null;
};

/**
 * GET /api/drafts
 *
 * @description Fetches the active draft for a locale+slug pair.
 * No authentication required — draft content is pending-public and
 * must be readable by the client-side DraftOverlay component.
 * Returns 404 if no active draft exists.
 *
 * @param {NextRequest} req - Request with ?locale and ?slug query params
 * @returns {Promise<NextResponse>} Draft JSON or error
 */
export async function GET(req: NextRequest) {
  const locale = req.nextUrl.searchParams.get('locale') || 'en';
  const slug = req.nextUrl.searchParams.get('slug');

  if (!slug) {
    return NextResponse.json(
      { error: 'Missing required query parameter: slug' },
      { status: 400 },
    );
  }

  try {
    const draft = await draftRepository.findActive(locale, slug);

    return NextResponse.json({ draft: draft ?? null }, { status: 200 });
  } catch (err) {
    log.error('Failed to fetch draft', {
      locale,
      slug,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/drafts
 *
 * @description Creates or updates the active draft for a locale+slug pair.
 * Body: `{ locale?: string, slug: string, content: string }`
 *
 * @param {NextRequest} req - Request with JSON body
 * @returns {Promise<NextResponse>} Saved draft JSON or error
 */
export async function POST(req: NextRequest) {
  const authError = authenticateRequest(req);
  if (authError) return authError;

  let body: { locale?: string; slug?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const locale = body.locale || 'en';
  const { slug, content } = body;

  if (!slug || !content) {
    return NextResponse.json(
      { error: 'Missing required fields: slug, content' },
      { status: 400 },
    );
  }

  try {
    const draft = await draftRepository.upsert({ locale, slug, content });

    log.message('Draft saved via API', {
      id: draft.id,
      locale,
      slug,
    });

    return NextResponse.json({ draft }, { status: 200 });
  } catch (err) {
    log.error('Failed to save draft', {
      locale,
      slug,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
