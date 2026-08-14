/**
 * @fileoverview Draft API route handlers for mdx-editor.
 * @module modules/mdx-editor/infrastructure/routes/draftsRoute
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { draftRepository } from '@/lib/db/content/repositories/draftRepository';
import { logger } from '@/lib/logging/logger';
import { authenticateWithSecret } from '@/modules/mdx-editor/application/use-cases/authenticateEditor';
import { persistDraft } from '@/modules/mdx-editor/application/use-cases/persistDraft';
import { NextRequest, NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Drafts' });

/**
 * Whether drafts are available: true when METADATA_BACKEND is 'pg'.
 *
 * @returns {boolean} True when METADATA_BACKEND is 'pg'
 */
function draftsAvailable(): boolean {
  return (process.env.METADATA_BACKEND || 'fs') === 'pg';
}

/**
 * The response for a backend with no draft store: no draft, and no error.
 *
 * @returns {NextResponse} A 200 carrying a null draft
 */
function noDraftStore(): NextResponse {
  return NextResponse.json({ draft: null, available: false }, { status: 200 });
}

/**
 * Returns active draft for locale and slug.
 *
 * @param {NextRequest} req - Incoming request.
 * @returns {Promise<NextResponse>} Draft payload or error.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const locale = req.nextUrl.searchParams.get('locale') || 'en';
  const slug = req.nextUrl.searchParams.get('slug');

  if (!slug) {
    return NextResponse.json(
      { error: 'Missing required query parameter: slug' },
      { status: 400 },
    );
  }

  if (!draftsAvailable()) return noDraftStore();

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
 * Upserts a draft using secret-protected route auth.
 *
 * @param {NextRequest} req - Incoming request.
 * @returns {Promise<NextResponse>} Persisted draft payload or error.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = authenticateWithSecret(req);
  if (!auth.ok) {
    return auth.errorResponse as NextResponse;
  }

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

  if (!draftsAvailable()) {
    return NextResponse.json(
      { error: 'Drafts require the pg metadata backend' },
      { status: 501 },
    );
  }

  try {
    const draft = await persistDraft({ locale, slug, content });

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
