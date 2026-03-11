/**
 * @fileoverview On-Demand ISR Revalidation API
 * @description Accepts POST requests with a shared secret and a list of paths
 * to revalidate. Called by the content repo's auto-merge GitHub Action after
 * a correction PR is merged, ensuring the affected pages are regenerated.
 *
 * @module app/api/revalidate/route
 */

import { logger } from '@/lib/logging/logger';
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

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
      revalidatePath(p);
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
