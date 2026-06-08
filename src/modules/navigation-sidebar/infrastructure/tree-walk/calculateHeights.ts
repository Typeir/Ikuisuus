/**
 * @fileoverview Height calculation utility for sidebar items
 * @module infrastructure/tree-walk/calculateHeights
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import { BASE_HEIGHT } from '@/modules/navigation-sidebar/domain/constants';
import type { Item, LayoutItem } from '@/modules/navigation-sidebar/domain/types';

/**
 * Recursively calculates collapsed and expanded heights for each sidebar item.
 * Sorts items by folder status (folders first), then alphabetically.
 *
 * @param {Item[]} items - The sidebar items to process
 * @returns {LayoutItem[]} Sidebar items with calculated height metadata
 */
export const calculateHeights = (items: Item[]): LayoutItem[] => {
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
  });

  const label = (it: Item) => it.name || it.path;

  const sorted = [...items].sort((a, b) => {
    const aIsFolder = Boolean(a.children && a.children.length > 0);
    const bIsFolder = Boolean(b.children && b.children.length > 0);

    if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1;
    const byLabel = collator.compare(label(a), label(b));
    if (byLabel !== 0) return byLabel;

    return collator.compare(a.path, b.path);
  });

  return sorted.map((item) => {
    if (item.isStub) {
      return {
        ...item,
        expandedHeight: BASE_HEIGHT + (item.childCount ?? 1) * BASE_HEIGHT,
      };
    }

    if (!item.children || item.children.length === 0) {
      return {
        ...item,
        expandedHeight: BASE_HEIGHT,
      };
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
};
