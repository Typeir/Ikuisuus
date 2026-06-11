/**
 * @fileoverview Filename deduplication for sidebar navigation.
 * Handles collapsing related file variants (e.g., .sheet.mdx and .mdx).
 * @module modules/navigation-sidebar/domain/filenameDedup
 * @author Typeir
 * @version 1.0.0
 * @since 3.0.0
 */

import type { Item } from './types';

/**
 * Deduplicates items when both .sheet.mdx and .mdx variants exist.
 * In monsters/spells modules, `.sheet.mdx` is the canonical stat block,
 * but `.mdx` description may also be present. When both exist at the same
 * level, we keep `.sheet.mdx` and collapse the description variant.
 *
 * @param {Item[]} items - Items to deduplicate
 * @returns {Item[]} Deduplicated items
 */
export function deduplicateFilenames(items: Item[]): Item[] {
  const basenames = new Map<string, Item[]>();

  for (const item of items) {
    const base = extractBasename(item.path);
    if (!basenames.has(base)) {
      basenames.set(base, []);
    }
    basenames.get(base)!.push(item);
  }

  const result: Item[] = [];
  for (const group of basenames.values()) {
    if (group.length === 1) {
      const item = group[0];
      const dedupedItem: Item = { ...item };
      if (item.children) {
        dedupedItem.children = deduplicateFilenames(item.children);
      }
      result.push(dedupedItem);
      continue;
    }

    const hasSheet = group.some((it) => it.path.endsWith('.sheet.mdx'));
    const hasPlain = group.some(
      (it) => it.path.endsWith('.mdx') && !it.path.endsWith('.sheet.mdx'),
    );

    if (hasSheet && hasPlain) {
      const selected = group.find((it) => it.path.endsWith('.sheet.mdx'))!;
      const dedupedItem: Item = { ...selected };
      if (selected.children) {
        dedupedItem.children = deduplicateFilenames(selected.children);
      }
      result.push(dedupedItem);
    } else {
      result.push(
        ...group.map((it) => {
          const dedupedItem: Item = { ...it };
          if (it.children) {
            dedupedItem.children = deduplicateFilenames(it.children);
          }
          return dedupedItem;
        }),
      );
    }
  }

  return result;
}

/**
 * Extracts the base filename (without extension) from a path.
 * E.g., 'spells/fireball.sheet.mdx' → 'spells/fireball'
 *
 * @param {string} path - File path
 * @returns {string} Basename without extension
 */
function extractBasename(path: string): string {
  return path.replace(/(?:\.sheet)?\.mdx$/, '');
}
