/**
 * @fileoverview Sidebar walk API handler.
 * @module modules/navigation-sidebar/infrastructure/server/walkHandler
 * @author Typeir
 * @version 1.0.0
 * @since 1.0.0
 */

import { logger } from '@/lib/logging/logger';
import { repositoryShallowWalk } from '@/modules/library/infrastructure/navigation/repositoryWalk';
import type { Item } from '@/modules/navigation-sidebar/domain/types';

const log = logger.child({ module: 'WalkHandler' });

/**
 * Query parameters for walk handler
 *
 * @interface WalkQueryParams
 * @property {string} locale - Locale code (default "en")
 * @property {string} path - Relative path (default "")
 * @property {number} [depth] - Walk depth (default SHALLOW_WALK_DEPTH=2)
 */
export interface WalkQueryParams {
  locale: string;
  path: string;
  depth?: number;
}

/**
 * Runs a shallow repository walk for the request params; logs and rethrows errors.
 *
 * @param {WalkQueryParams} params - Query parameters from request
 * @returns {Promise<Item[]>} Array of WalkNode objects or throws error
 */
export async function handleWalkRequest(
  params: WalkQueryParams,
): Promise<Item[]> {
  try {
    const depth = params.depth ?? 2;
    const nodes = await repositoryShallowWalk(
      params.locale,
      params.path,
      depth,
    );
    return nodes;
  } catch (err) {
    log.error('Failed to walk content path', {
      error: err instanceof Error ? err.message : String(err),
      locale: params.locale,
      path: params.path,
    });
    throw err;
  }
}
