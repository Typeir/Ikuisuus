/**
 * @fileoverview Draft and Route Data Hooks
 * @description Hooks for draft retrieval, corrections tree loading, and
 * nearest route lookups. All three hooks use SWR for automatic caching
 * and deduplication.
 *
 * @module lib/hooks/data/useDraftAndRouteData
 * @author Typeir
 * @version 2.0.0
 * @since 2.0.0
 */

import { nearestRouteKey } from '@/lib/fetch/swrKeys';
import { logger } from '@/lib/logging/logger';
import {
    fetchNearestRoute,
    type RouteMatch,
} from '@/lib/services/api/searchService';
import { useActiveDraft as useActiveDraftFromModule } from '@/modules/mdx-editor/application/hooks/useActiveDraft';
import { useCorrectionsTree as useCorrectionsTreeFromModule } from '@/modules/mdx-editor/application/hooks/useCorrectionsTree';
import type {
    CorrectionsTreeState,
    DraftState,
} from '@/modules/mdx-editor/domain/types';
import useSWR from 'swr';

const log = logger.child({ module: 'useDraftAndRouteData' });

/**
 * Draft loading state.
 *
 * @interface DraftState
 * @property {DraftMetadata | null} draft - Active draft when present
 * @property {boolean} loading - Loading flag
 */
/**
 * Loads draft metadata for locale and slug.
 *
 * @param {string} locale - Content locale
 * @param {string} slug - Content slug
 * @returns {DraftState} Draft loading state
 */
export function useActiveDraft(locale: string, slug: string): DraftState {
  return useActiveDraftFromModule(locale, slug);
}

/**
 * Corrections tree loading state.
 *
 * @interface CorrectionsTreeState
 * @property {TreeNode[]} tree - Tree data for file picker
 * @property {boolean} loading - Loading flag
 */
/**
 * Loads corrections tree nodes for the editor.
 *
 * @param {string} locale - Current locale
 * @returns {CorrectionsTreeState} Tree loading state
 */
export function useCorrectionsTreeData(locale: string): CorrectionsTreeState {
  return useCorrectionsTreeFromModule(locale);
}

/**
 * Nearest route hook state.
 *
 * @interface NearestRouteState
 * @property {RouteMatch | null} nearestRoute - Route match result
 * @property {boolean} loading - Loading flag
 */
export interface NearestRouteState {
  nearestRoute: RouteMatch | null;
  loading: boolean;
}

/**
 * Finds nearest route for current path.
 *
 * @param {string | null} pathname - Current pathname
 * @returns {NearestRouteState} Route suggestion state
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
