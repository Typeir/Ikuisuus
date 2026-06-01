/**
 * Corrections Tree Hook
 *
 * @fileoverview Corrections tree data hook for mdx-editor path picker.
 * @module modules/mdx-editor/application/hooks/useCorrectionsTree
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 */

import { correctionsTreeKey } from '@/lib/fetch/swrKeys';
import type {
    CorrectionsTreeState,
    TreeNode,
} from '@/modules/mdx-editor/domain/types';
import { fetchCorrectionsTree } from '@/modules/mdx-editor/infrastructure/api-clients/draftEditorClient';
import useSWR from 'swr';

/**
 * Loads corrections tree nodes for the current locale.
 *
 * @param {string} locale - Active locale.
 * @returns {CorrectionsTreeState} Tree data state.
 */
export function useCorrectionsTree(locale: string): CorrectionsTreeState {
  const { data, isLoading } = useSWR<TreeNode[]>(
    correctionsTreeKey(locale),
    async () => {
      const result = await fetchCorrectionsTree(locale);
      return result as TreeNode[];
    },
  );

  return { tree: data ?? [], loading: isLoading };
}
