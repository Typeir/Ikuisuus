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

import { logger } from '@/lib/logging/logger';
import {
    useNearestRoute as useNearestRouteFromModule,
    type NearestRouteState,
} from '@/modules/library/application/hooks/useNearestRoute';
import { useActiveDraft as useActiveDraftFromModule } from '@/modules/mdx-editor/application/hooks/useActiveDraft';
import { useCorrectionsTree as useCorrectionsTreeFromModule } from '@/modules/mdx-editor/application/hooks/useCorrectionsTree';
import type {
    CorrectionsTreeState,
    DraftState,
} from '@/modules/mdx-editor/domain/types';
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
 * Finds nearest route for current path.
 *
 * @param {string | null} pathname - Current pathname
 * @returns {NearestRouteState} Route suggestion state
 */
export function useNearestRoute(pathname: string | null): NearestRouteState {
  log.debug('useNearestRoute legacy shim invoked');
  return useNearestRouteFromModule(pathname);
}
