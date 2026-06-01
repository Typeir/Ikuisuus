/**
 * @fileoverview SWR hook for nearest-route suggestions on 404 flows.
 * @module modules/library/application/hooks/useNearestRoute
 * @author Typeir
 * @version 1.0.0
 * @since 6.0.0
 */

'use client';

import { nearestRouteKey } from '@/lib/fetch/swrKeys';
import { logger } from '@/lib/logging/logger';
import {
    fetchNearestRoute,
    type RouteMatch,
} from '@/lib/services/api/searchService';
import useSWR from 'swr';

const log = logger.child({ module: 'library/useNearestRoute' });

/**
 * Hook state for nearest-route lookups.
 *
 * @interface NearestRouteState
 * @property {RouteMatch | null} nearestRoute - Suggested route or null when no match exists.
 * @property {boolean} loading - Whether the lookup is currently in flight.
 */
export interface NearestRouteState {
  nearestRoute: RouteMatch | null;
  loading: boolean;
}

/**
 * Resolves the nearest existing route for a potentially invalid pathname.
 *
 * @param {string | null} pathname - Pathname to resolve.
 * @returns {NearestRouteState} Hook state with nearest route and loading flag.
 */
export function useNearestRoute(pathname: string | null): NearestRouteState {
  const { data, isLoading } = useSWR<RouteMatch | null>(
    nearestRouteKey(pathname),
    () => fetchNearestRoute(pathname!),
    {
      onError: (error) => {
        log.error('Failed to find nearest route', {
          error: error instanceof Error ? error.message : String(error),
        });
      },
    },
  );

  return { nearestRoute: data ?? null, loading: isLoading };
}
