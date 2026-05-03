/**
 * @fileoverview Paginated Content File-Tree API
 * @description Thin API route that forwards directory listing queries to
 * the `fileTreeService.listDirectory` facade. Accepts query params for
 * paging and filtering and returns `{ entries, total, nextCursor }`.
 * @module app/api/content/tree/route
 * @version 1.0.0
 * @author Typeir
 * @since 2026-04-30
 */

import { listDirectory } from '@/lib/db/content';
import { logger } from '@/lib/logging/logger';
import { NextRequest, NextResponse } from 'next/server';

const log = logger.child({ module: 'API:Content:Tree' });

export async function GET(req: NextRequest): Promise<NextResponse> {
  const params = req.nextUrl.searchParams;
  const locale = params.get('locale') || 'en';
  const relativePath = params.get('path') || '';

  const limit = params.get('limit') ? Number(params.get('limit')) : undefined;
  const page = params.get('page') ? Number(params.get('page')) : undefined;
  const pageSize = params.get('pageSize')
    ? Number(params.get('pageSize'))
    : undefined;
  const cursor = params.get('cursor') || undefined;
  const filter = params.get('filter') || undefined;
  const sort = (params.get('sort') as 'name' | 'type') || undefined;

  try {
    const result = await listDirectory(locale, relativePath, {
      limit,
      page,
      pageSize,
      cursor,
      filter,
      sort,
    });

    return NextResponse.json(result);
  } catch (err) {
    log.error('Failed to list directory', {
      error: err instanceof Error ? err.message : String(err),
      locale,
      path: relativePath,
    });
    return NextResponse.json(
      { error: 'Failed to list directory' },
      { status: 500 },
    );
  }
}
