/**
 * @fileoverview Lazy Sidebar Walk API
 * @description Route handler that delegates to walkHandler orchestrator.
 * Returns a shallow {@link WalkNode} tree for a given content path.
 * Called by the sidebar when a stub folder is expanded to fetch its
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

import {
    handleWalkRequest,
    type WalkQueryParams,
} from '@/modules/navigation-sidebar/infrastructure/server/walkHandler';
import { NextRequest, NextResponse } from 'next/server';

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
