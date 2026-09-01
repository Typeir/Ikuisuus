/**
 * @fileoverview Unit tests for domain/sortItems
 * @module tests/unit/src/modules/navigation-sidebar/domain/sortItems.test
 */

import { sortItems } from '@/modules/navigation-sidebar/domain/sortItems';
import type { Item } from '@/modules/navigation-sidebar/domain/types';
import { describe, expect, it } from 'vitest';

describe('sortItems', () => {
  it('should sort files before folders', () => {
    const items: Item[] = [
      {
        name: 'Folder A',
        path: 'folder-a',
        children: [{ name: 'Child', path: 'child' }],
      },
      { name: 'File B', path: 'file-b' },
      { name: 'File A', path: 'file-a' },
      {
        name: 'Folder B',
        path: 'folder-b',
        children: [{ name: 'Child', path: 'child' }],
      },
    ];

    const sorted = sortItems(items);

    expect(sorted[0].path).toBe('file-a');
    expect(sorted[1].path).toBe('file-b');
    expect(sorted[2].path).toBe('folder-a');
    expect(sorted[3].path).toBe('folder-b');
  });

  it('should sort alphabetically within each group', () => {
    const items: Item[] = [
      { name: 'Zebra', path: 'zebra' },
      { name: 'Apple', path: 'apple' },
      { name: 'Banana', path: 'banana' },
    ];

    const sorted = sortItems(items);

    expect(sorted.map((it) => it.name)).toEqual(['Apple', 'Banana', 'Zebra']);
  });

  it('should handle numeric sorting correctly', () => {
    const items: Item[] = [
      { name: 'Item 10', path: 'item-10' },
      { name: 'Item 2', path: 'item-2' },
      { name: 'Item 1', path: 'item-1' },
    ];

    const sorted = sortItems(items);

    expect(sorted.map((it) => it.name)).toEqual([
      'Item 1',
      'Item 2',
      'Item 10',
    ]);
  });

  it('should use path as tiebreaker when names match', () => {
    const items: Item[] = [
      { name: 'Same', path: 'z-path' },
      { name: 'Same', path: 'a-path' },
    ];

    const sorted = sortItems(items);

    expect(sorted[0].path).toBe('a-path');
    expect(sorted[1].path).toBe('z-path');
  });

  it('should not mutate original array', () => {
    const items: Item[] = [
      { name: 'B', path: 'b' },
      { name: 'A', path: 'a' },
    ];
    const original = [...items];

    sortItems(items);

    expect(items).toEqual(original);
  });

  it('should handle empty array', () => {
    const sorted = sortItems([]);
    expect(sorted).toEqual([]);
  });

  it('should handle single item', () => {
    const items: Item[] = [{ name: 'Only', path: 'only' }];
    const sorted = sortItems(items);
    expect(sorted).toEqual(items);
  });
});
