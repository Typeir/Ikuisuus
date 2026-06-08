/**
 * @fileoverview Unit tests for infrastructure/tree-walk/calculateHeights
 * @module tests/unit/src/modules/navigation-sidebar/infrastructure/tree-walk/calculateHeights
 */

import { BASE_HEIGHT } from '@/modules/navigation-sidebar/domain/constants';
import type { Item } from '@/modules/navigation-sidebar/domain/types';
import { calculateHeights } from '@/modules/navigation-sidebar/infrastructure/tree-walk/calculateHeights';
import { describe, expect, it } from 'vitest';

describe('calculateHeights', () => {
  it('should calculate height for single item', () => {
    const items: Item[] = [{ name: 'Test', path: 'test' }];
    const result = calculateHeights(items);

    expect(result[0].expandedHeight).toBe(BASE_HEIGHT);
  });

  it('should calculate height for folder with children', () => {
    const items: Item[] = [
      {
        name: 'Folder',
        path: 'folder',
        children: [
          { name: 'Child 1', path: 'folder/child-1' },
          { name: 'Child 2', path: 'folder/child-2' },
        ],
      },
    ];
    const result = calculateHeights(items);

    expect(result[0].expandedHeight).toBe(BASE_HEIGHT * 3);
  });

  it('should sort folders last', () => {
    const items: Item[] = [
      { name: 'Folder B', path: 'b', children: [{ name: 'Child', path: 'c' }] },
      { name: 'File A', path: 'a' },
      {
        name: 'Folder A',
        path: 'fa',
        children: [{ name: 'Child', path: 'fc' }],
      },
      { name: 'File B', path: 'fb' },
    ];
    const result = calculateHeights(items);

    expect(result[0].name).toBe('File A');
    expect(result[1].name).toBe('File B');
    expect(result[2].name).toBe('Folder A');
    expect(result[3].name).toBe('Folder B');
  });

  it('should handle deeply nested structures', () => {
    const items: Item[] = [
      {
        name: 'Level 1',
        path: 'l1',
        children: [
          {
            name: 'Level 2',
            path: 'l1/l2',
            children: [
              { name: 'Level 3', path: 'l1/l2/l3' },
              { name: 'Level 3b', path: 'l1/l2/l3b' },
            ],
          },
        ],
      },
    ];
    const result = calculateHeights(items);

    expect(result[0].expandedHeight).toBe(BASE_HEIGHT * 4);
  });
});
