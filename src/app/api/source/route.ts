/**
 * @fileoverview MDX Source API Route
 * @description Returns the raw MDX content of a content file. Used by the
 * character sheet's local sharding system to fetch a full source file once
 * and extract heading blocks client-side, avoiding per-feature `/api/shards`
 * round-trips.
 *
 * Security: file resolution is delegated entirely to `fetchContent`, which
 * uses the environment-appropriate ContentSourceAdapter. Path traversal and
 * access outside the content root are prevented at the adapter layer.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * @module src/app/api/source/route
 *
 * @example
 * ```
 * GET /api/source?file=character-creation/bloodlines/empyrean.bloodline.mdx&locale=en
 * → { content: "# Empyrean\n\n..." }
 * ```
 */

import { fetchContent } from '@/lib/utils/fetchContent';
import { NextResponse } from 'next/server';

/**
 * GET /api/source
 *
 * Returns the raw MDX content for the requested file path.
 * Accepts `file` (required) and `locale` (optional, defaults to `en`).
 *
 * @param {Request} req - Next.js request object
 * @returns {NextResponse} JSON `{ content: string }` or error response
 */
export async function GET(req: Request): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const file = searchParams.get('file');
  const locale = searchParams.get('locale') ?? 'en';

  if (!file) {
    return NextResponse.json(
      { error: 'Missing file parameter' },
      { status: 400 },
    );
  }

  const slugPath = file.replace(/\.mdx$/, '');
  const result = await fetchContent(locale, slugPath);

  if (!result) {
    return NextResponse.json(
      { error: `File not found: ${file}` },
      { status: 404 },
    );
  }

  return NextResponse.json({ content: result.content });
}
