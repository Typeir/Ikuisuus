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

import type { TreeNode } from '@/lib/components/mdxEditor/fileTreeSelect';
import type { DraftMetadata } from '@/lib/db/content/schemas/draftMetadata';
import { correctionsTreeKey, draftKey, nearestRouteKey } from '@/lib/fetch/swrKeys';
import { logger } from '@/lib/logging/logger';
import {
  fetchActiveDraft,
  fetchCorrectionsTree,
} from '@/lib/services/api/draftEditorService';
import {
  fetchNearestRoute,
  type RouteMatch,
} from '@/lib/services/api/searchService';
import useSWR from 'swr';

const log = logger.child({ module: 'useDraftAndRouteData' });

/**
 * Draft loading state.
 *
 * @interface DraftState
 * @property {DraftMetadata | null} draft - Active draft when present
 * @property {boolean} loading - Loading flag
 */
export interface DraftState {
  draft: DraftMetadata | null;
  loading: boolean;
}

/**
 * Loads draft metadata for locale and slug.
 *
 * @param {string} locale - Content locale
 * @param {string} slug - Content slug
 * @returns {DraftState} Draft loading state
 */
export function useActiveDraft(locale: string, slug: string): DraftState {
  const { data, isLoading } = useSWR<DraftMetadata | null>(
    draftKey(locale, slug),
    () => fetchActiveDraft(locale, slug),
  );

  return { draft: data ?? null, loading: isLoading };
}

/**
 * Corrections tree loading state.
 *
 * @interface CorrectionsTreeState
 * @property {TreeNode[]} tree - Tree data for file picker
 * @property {boolean} loading - Loading flag
 */
export interface CorrectionsTreeState {
  tree: TreeNode[];
  loading: boolean;
}

/**
 * Loads corrections tree nodes for the editor.
 *
 * @param {string} locale - Current locale
 * @returns {CorrectionsTreeState} Tree loading state
 */
export function useCorrectionsTreeData(locale: string): CorrectionsTreeState {
  const { data, isLoading } = useSWR<TreeNode[]>(
    correctionsTreeKey(locale),
    async () => {
      const result = await fetchCorrectionsTree(locale);
      return result as TreeNode[];
    },
  );

  return { tree: data ?? [], loading: isLoading };
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

