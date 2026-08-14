/**
 * @fileoverview Orchestrator for paginated content file-tree API
 * @module modules/navigation-sidebar/infrastructure/server/treeHandler
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

import { listDirectory } from '@/lib/db/content';
import { logger } from '@/lib/logging/logger';

const log = logger.child({ module: 'TreeHandler' });

/**
 * Query parameters for tree handler
 *
 * @interface TreeQueryParams
 * @property {string} locale - Locale code (default "en")
 * @property {string} path - Relative path (default "")
 * @property {number} [limit] - Page size limit
 * @property {number} [page] - Page number
 * @property {number} [pageSize] - Alternative page size parameter
 * @property {string} [cursor] - Cursor for keyset pagination
 * @property {string} [filter] - Filter pattern
 * @property {'name' | 'type'} [sort] - Sort field
 */
export interface TreeQueryParams {
  locale: string;
  path: string;
  limit?: number;
  page?: number;
  pageSize?: number;
  cursor?: string;
  filter?: string;
  sort?: 'name' | 'type';
}

/**
 * Handles directory tree listing endpoint
 *
 * @param {TreeQueryParams} params - Query parameters from request
 * @returns {Promise<unknown>} Directory listing result or error object
 */
export async function handleTreeRequest(
  params: TreeQueryParams,
): Promise<unknown> {
  try {
    const result = await listDirectory(params.locale, params.path, {
      limit: params.limit,
      page: params.page,
      pageSize: params.pageSize,
      cursor: params.cursor,
      filter: params.filter,
      sort: params.sort,
    });

    return result;
  } catch (err) {
    log.error('Failed to list directory', {
      error: err instanceof Error ? err.message : String(err),
      locale: params.locale,
      path: params.path,
    });
    throw err;
  }
}
