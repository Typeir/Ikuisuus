/**
 * @fileoverview Paginated Content File-Tree API
 * @description Route handler that delegates to treeHandler orchestrator.
 * Accepts query params for paging and filtering and returns `{ entries, total, nextCursor }`.
 * @module app/api/content/tree/route
 * @version 1.0.0
 * @author Typeir
 * @since 2026-04-30
 */

import {
    handleTreeRequest,
    type TreeQueryParams,
} from '@/modules/navigation-sidebar/infrastructure/server/treeHandler';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const params = req.nextUrl.searchParams;

  const queryParams: TreeQueryParams = {
    locale: params.get('locale') || 'en',
    path: params.get('path') || '',
    limit: params.get('limit') ? Number(params.get('limit')) : undefined,
    page: params.get('page') ? Number(params.get('page')) : undefined,
    pageSize: params.get('pageSize')
      ? Number(params.get('pageSize'))
      : undefined,
    cursor: params.get('cursor') || undefined,
    filter: params.get('filter') || undefined,
    sort: (params.get('sort') as 'name' | 'type') || undefined,
  };

  try {
    const result = await handleTreeRequest(queryParams);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to list directory' },
      { status: 500 },
    );
  }
}
