/**
 * @fileoverview Draft and Route Data Hooks
 * @description Hooks for draft retrieval, corrections tree loading, and
 * nearest route lookups.
 *
 * @module lib/hooks/data/useDraftAndRouteData
 */

import type { TreeNode } from '@/lib/components/mdxEditor/fileTreeSelect';
import type { DraftMetadata } from '@/lib/db/content/schemas/draftMetadata';
import { logger } from '@/lib/logging/logger';
import {
  fetchActiveDraft,
  fetchCorrectionsTree,
} from '@/lib/services/api/draftEditorService';
import {
  fetchNearestRoute,
  type RouteMatch,
} from '@/lib/services/api/searchService';
import { useEffect, useState } from 'react';

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
  const [draft, setDraft] = useState<DraftMetadata | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const result = await fetchActiveDraft(locale, slug);
      if (!cancelled) {
        setDraft(result);
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [locale, slug]);

  return { draft, loading };
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
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const result = await fetchCorrectionsTree(locale);
      if (!cancelled) {
        setTree(result as TreeNode[]);
        setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [locale]);

  return { tree, loading };
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
  const [nearestRoute, setNearestRoute] = useState<RouteMatch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!pathname) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const match = await fetchNearestRoute(pathname);
        if (!cancelled) {
          setNearestRoute(match);
        }
      } catch (error) {
        if (!cancelled) {
          log.error('Failed to find nearest route', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return { nearestRoute, loading };
}
