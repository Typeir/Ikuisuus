/**
 * @fileoverview Metadata Preview API Endpoint
 * @description Parses metadata records from a raw MDX buffer without touching
 * disk. The MDX editor posts its unsaved buffer and renders the records the
 * build-time generators would produce on save.
 *
 * Body (JSON):
 *   - path: string — repo-relative content path under `src/content/`; may be
 *     omitted or empty, in which case kind is inferred from frontmatter
 *   - content: string — complete MDX source including frontmatter
 *
 * @module app/api/metadata/preview/route
 * @version 1.0.0
 * @author Typeir
 * @since 8.0.0
 */

import { logger } from '@/lib/logging/logger';
import { loadSharedData } from '@scripts/metadata/sharedData';
import { parseMetadataFromSource } from '@scripts/metadata/sourceParser';
import { NextRequest, NextResponse } from 'next/server';

const log = logger.child({ module: 'API:MetadataPreview' });

/**
 * Maximum accepted buffer size in bytes.
 */
const MAX_CONTENT_BYTES = 2 * 1024 * 1024;

/**
 * Validates the posted content path. Absent or empty paths are valid — the
 * parser infers kind from frontmatter — and normalize to ''.
 *
 * @param {unknown} path - Posted path value
 * @returns {string | null} Normalized path ('' when absent), or null when invalid
 */
function validPath(path: unknown): string | null {
  if (path === undefined || path === null || path === '') return '';
  if (typeof path !== 'string') return null;
  const normalized = path.replace(/\\/g, '/');
  if (!normalized.startsWith('src/content/')) return null;
  if (normalized.includes('..')) return null;
  if (!normalized.endsWith('.mdx') && !normalized.endsWith('.md')) return null;
  return normalized;
}

/**
 * POST /api/metadata/preview
 *
 * @param {NextRequest} req - Incoming request
 * @returns {Promise<NextResponse>} Parsed records or error
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { path?: unknown; content?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const path = validPath(body.path);
  if (path === null) {
    return NextResponse.json(
      { error: 'path must be a repo-relative src/content/ mdx path' },
      { status: 400 },
    );
  }

  const content = body.content;
  if (typeof content !== 'string' || content.length === 0) {
    return NextResponse.json(
      { error: 'content must be a non-empty string' },
      { status: 400 },
    );
  }
  if (Buffer.byteLength(content, 'utf8') > MAX_CONTENT_BYTES) {
    return NextResponse.json({ error: 'content too large' }, { status: 413 });
  }

  try {
    const result = parseMetadataFromSource(
      content,
      path,
      await loadSharedData(),
    );
    return NextResponse.json({ ok: true, ...result }, { status: 200 });
  } catch (error) {
    log.error('Metadata preview parse failed', {
      path,
      error: (error as Error).message,
    });
    return NextResponse.json(
      { error: 'Parse failed', message: (error as Error).message },
      { status: 500 },
    );
  }
}
