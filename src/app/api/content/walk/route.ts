/**
 * @fileoverview Lazy Sidebar Walk API
 * @description Returns a shallow {@link WalkNode} tree for a given content
 * path. Called by the sidebar when a stub folder is expanded to fetch its
 * immediate children without a full page reload.
 *
 * Query parameters:
 * - `locale` (string, default "en") — locale code
 * - `path`   (string, default "")   — path relative to the content root
 *
 * Always fetches two levels (maxDepth = 2): each returned directory at the
 * second level is a stub node (`isStub: true, children: []`) that the sidebar
 * can expand again to fetch its own children.
 *
 * @module app/api/content/walk/route
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import { logger } from '@/lib/logging/logger';
import { repositoryShallowWalk } from '@/modules/library/infrastructure/navigation/repositoryWalk';
import { NextRequest, NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Content:Walk' });

/**
 * Returns a two-level-deep {@link WalkNode} array for the requested path.
 * Sub-directories beyond the second level are returned as stub nodes so the
 * sidebar can continue paginating expansion two levels at a time.
 *
 * @param {NextRequest} req - Incoming request with `locale` and `path` params
 * @returns {Promise<NextResponse>} JSON array of {@link WalkNode} objects
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const params = req.nextUrl.searchParams;
  const locale = params.get('locale') || 'en';
  const relativePath = params.get('path') || '';

  try {
    const nodes = await repositoryShallowWalk(locale, relativePath, 2);
    return NextResponse.json(nodes);
  } catch (err) {
    log.error('Failed to walk content path', {
      error: err instanceof Error ? err.message : String(err),
      locale,
      path: relativePath,
    });
    return NextResponse.json(
      { error: 'Failed to walk content path' },
      { status: 500 },
    );
  }
}
