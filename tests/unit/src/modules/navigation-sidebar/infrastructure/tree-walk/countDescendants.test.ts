/**
 * @fileoverview Unit tests for infrastructure/tree-walk/countDescendants
 * @module tests/unit/src/modules/navigation-sidebar/infrastructure/tree-walk/countDescendants.test
 */

import type { Item } from '@/modules/navigation-sidebar/domain/types';
import { countDescendants } from '@/modules/navigation-sidebar/infrastructure/tree-walk/countDescendants';
import { describe, expect, it } from 'vitest';

describe('countDescendants', () => {
  it('should count single item', () => {
    const items: Item[] = [{ name: 'Test', path: 'test' }];
    expect(countDescendants(items)).toBe(1);
  });

  it('should count multiple items', () => {
    const items: Item[] = [
      { name: 'Item 1', path: 'item1' },
      { name: 'Item 2', path: 'item2' },
      { name: 'Item 3', path: 'item3' },
    ];
    expect(countDescendants(items)).toBe(3);
  });

  it('should count folder and children', () => {
    const items: Item[] = [
      {
        name: 'Folder',
        path: 'folder',
        children: [
          { name: 'Child 1', path: 'child1' },
          { name: 'Child 2', path: 'child2' },
        ],
      },
    ];
    expect(countDescendants(items)).toBe(3);
  });

  it('should count nested descendants', () => {
    const items: Item[] = [
      {
        name: 'Level 1',
        path: 'l1',
        children: [
          {
            name: 'Level 2',
            path: 'l2',
            children: [
              { name: 'Level 3', path: 'l3' },
              { name: 'Level 3b', path: 'l3b' },
            ],
          },
          { name: 'Level 2b', path: 'l2b' },
        ],
      },
    ];
    expect(countDescendants(items)).toBe(5);
  });

  it('should return 0 for empty array', () => {
    expect(countDescendants([])).toBe(0);
  });
});
