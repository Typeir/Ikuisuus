/**
 * @fileoverview Counts total descendants in a navigation tree.
 * @module modules/navigation-sidebar/infrastructure/tree-walk/countDescendants
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import type { Item } from '@/modules/navigation-sidebar/domain/types';

/**
 * Recursively counts all descendants (folders and files) in a tree.
 *
 * @param {Item[]} items - Navigation items
 * @returns {number} Total descendant count
 */
export function countDescendants(items: Item[]): number {
  let total = 0;

  for (const item of items) {
    total += 1;

    if (item.children && item.children.length > 0) {
      total += countDescendants(item.children);
    }
  }

  return total;
}
