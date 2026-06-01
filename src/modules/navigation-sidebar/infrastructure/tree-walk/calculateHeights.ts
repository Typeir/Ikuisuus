/**
 * @fileoverview Calculate expanded heights for sidebar items.
 * Sorts items (folders last, alphabetically) and computes heights recursively.
 * Handles stub nodes (lazy-loaded) with pre-calculated childCount.
 * @module modules/navigation-sidebar/infrastructure/tree-walk/calculateHeights
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import { BASE_HEIGHT } from '@/modules/navigation-sidebar/domain/constants';
import { sortItems } from '@/modules/navigation-sidebar/domain/sortItems';
import type {
    Item,
    LayoutItem,
} from '@/modules/navigation-sidebar/domain/types';

/**
 * Sorts items and annotates with computed expanded heights.
 * Recursively calculates height as: BASE_HEIGHT + sum of children's heights.
 * Stub nodes use pre-calculated childCount for height estimation before fetch.
 *
 * @param {Item[]} items - Navigation items to annotate
 * @returns {LayoutItem[]} Items sorted (folders last) with heights
 */
export function calculateHeights(items: Item[]): LayoutItem[] {
  const sorted = sortItems(items);

  return sorted.map((item): LayoutItem => {
    if (item.isStub) {
      return {
        ...item,
        expandedHeight: BASE_HEIGHT + (item.childCount ?? 1) * BASE_HEIGHT,
      };
    }

    if (!item.children || item.children.length === 0) {
      return { ...item, expandedHeight: BASE_HEIGHT } as LayoutItem;
    }

    const children = calculateHeights(item.children);
    const totalChildrenHeight = children.reduce(
      (sum, child) => sum + child.expandedHeight,
      0,
    );

    return {
      ...item,
      children,
      expandedHeight: BASE_HEIGHT + totalChildrenHeight,
    };
  });
}
