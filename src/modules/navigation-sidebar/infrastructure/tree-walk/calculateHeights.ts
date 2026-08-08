/**
 * @fileoverview Height calculation utility for sidebar items
 * @module infrastructure/tree-walk/calculateHeights
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import { BASE_HEIGHT } from '@/modules/navigation-sidebar/domain/constants';
import type {
  Item,
  LayoutItem,
} from '@/modules/navigation-sidebar/domain/types';

/**
 * Recursively calculates collapsed and expanded heights for each sidebar item.
 * Sorts items by folder status (folders last), then alphabetically.
 *
 * A stub carries `children: []` until its contents are fetched, so folder status
 * reads `isStub` as well as child count. Counting only children put stubs in the
 * leaf group, which sorted them above every real folder and — worse — moved them
 * across the group boundary the moment their children arrived, reordering the
 * tree under the pointer that had just expanded them.
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
  const isFolder = (it: Item) =>
    Boolean(it.isStub || (it.children && it.children.length > 0));

  const sorted = [...items].sort((a, b) => {
    const aIsFolder = isFolder(a);
    const bIsFolder = isFolder(b);

    if (aIsFolder !== bIsFolder) return aIsFolder ? 1 : -1;
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
