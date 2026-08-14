/**
 * @fileoverview Route handler delegating to walkHandler.
 * @description GET fetches a shallow ({@link WalkNode}) tree for a content
 * path. Fetches two levels (maxDepth = 2); each second-level directory is a
 * stub node (`isStub: true, children: []`).
 *
 * @module app/api/content/walk/route
 * @version 1.0.0
 * @author Typeir
 * @since 3.0.0
 */

import {
    handleWalkRequest,
    type WalkQueryParams,
} from '@/modules/navigation-sidebar/infrastructure/server/walkHandler';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Returns a two-level-deep {@link WalkNode} array for the requested path.
 * Sub-directories beyond the second level are returned as stub nodes.
 * Returns 500 with `{ error }` on failure.
 *
 * @param {NextRequest} req - Incoming request with `locale` and `path` params
 * @returns {Promise<NextResponse>} JSON array of {@link WalkNode} objects
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const params = req.nextUrl.searchParams;

  const queryParams: WalkQueryParams = {
    locale: params.get('locale') || 'en',
    path: params.get('path') || '',
  };

  try {
    const nodes = await handleWalkRequest(queryParams);
    return NextResponse.json(nodes);
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to walk content path' },
      { status: 500 },
    );
  }
}
