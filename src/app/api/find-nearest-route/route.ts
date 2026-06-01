/**
 * Find Nearest Route API
 *
 * @fileoverview Next.js API route for finding nearest matching route for 404 errors.
 * Uses fuzzy matching to suggest alternative routes when user hits a 404.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * @module src/app/api/find-nearest-route/route
 */

import { logger } from '@/lib/logging/logger';
import { findNearestRoute } from '@/modules/library/application/use-cases/findNearestRoute';
import { NextResponse } from 'next/server';

const log = logger.child({ module: 'API:FindNearestRoute' });

/**
 * POST /api/find-nearest-route
 *
 * Finds the nearest matching route for a 404'd pathname
 *
 * @param {Request} req - Request with { pathname: string }
 * @returns {NextResponse} JSON with { match: RouteMatch | null }
 */
export async function POST(req: Request) {
  try {
    const { pathname } = await req.json();

    if (!pathname || typeof pathname !== 'string') {
      return NextResponse.json({ match: null });
    }

    const match = await findNearestRoute(pathname);

    return NextResponse.json({ match });
  } catch (error) {
    log.error('Error finding nearest route', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ match: null }, { status: 500 });
  }
}
