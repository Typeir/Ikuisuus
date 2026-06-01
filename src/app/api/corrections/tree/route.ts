/**
 * @fileoverview Corrections tree API route.
 * @module app/api/corrections/tree/route
 * @author Typeir
 * @version 1.0.0
 * @since 2.0.0
 */

import { listContentTree } from '@/lib/db/content/contentTreeService';
import { logger } from '@/lib/logging/logger';
import { NextRequest, NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Corrections:Tree' });

/**
 * Returns content tree for requested locale.
 *
 * @param {NextRequest} req - Incoming request.
 * @returns {Promise<NextResponse>} Tree payload or error.
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
