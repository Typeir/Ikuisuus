/**
 * @fileoverview Pure sort logic for sidebar navigation items.
 * @module modules/navigation-sidebar/domain/sortItems
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import type { Item } from './types';

/**
 * Sorts navigation items alphabetically (numeric-aware) with folders last.
 *
 * @param {Item[]} items - Items to sort
 * @returns {Item[]} Sorted items (folders last)
 */
export function sortItems(items: Item[]): Item[] {
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
  });

  const label = (it: Item): string => it.name || it.path;

  return [...items].sort((a, b) => {
    const aIsFolder = Boolean(a.children && a.children.length > 0);
    const bIsFolder = Boolean(b.children && b.children.length > 0);

    if (aIsFolder !== bIsFolder) {
      return aIsFolder ? 1 : -1;
    }

    const byLabel = collator.compare(label(a), label(b));
    if (byLabel !== 0) return byLabel;

    return collator.compare(a.path, b.path);
  });
}
