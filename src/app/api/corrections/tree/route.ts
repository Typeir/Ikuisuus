/**
 * @fileoverview Content Tree API
 * @description Returns the directory tree of the content repository for a given locale.
 * Used by the MDX editor's FileTreeSelect to provide a folder picker for new file paths.
 *
 * @module app/api/corrections/tree/route
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 */

import { listContentTree } from '@/lib/db/content/contentTreeService';
import { logger } from '@/lib/logging/logger';
import { NextRequest, NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Corrections:Tree' });

/**
 * GET handler - returns the content directory tree for a locale.
 *
 * @param {NextRequest} req - Incoming request with `?locale=en` query param
 * @returns {Promise<NextResponse>} JSON response with tree structure
 *
 * @example
 * ```
 * GET /api/corrections/tree?locale=en
 * → { tree: [{ name: "monsters", path: "en/monsters", children: [...] }, ...] }
 * ```
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const locale = req.nextUrl.searchParams.get('locale') || 'en';

  try {
    const tree = await listContentTree(locale);

    return NextResponse.json({ tree });
  } catch (err) {
    log.error('Failed to fetch content tree', {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'Failed to fetch content tree' },
      { status: 500 },
    );
  }
}
