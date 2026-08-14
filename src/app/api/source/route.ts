/**
 * @fileoverview MDX Source API Route
 * @description Returns the raw MDX content of a content file by path.
 * Path traversal outside the content root is prevented at the adapter layer.
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

import { fetchContent } from '@/modules/library/infrastructure/content/fetchContent';
import { NextResponse } from 'next/server';

/**
 * GET /api/source
 *
 * Returns the raw MDX content for the requested file path.
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
