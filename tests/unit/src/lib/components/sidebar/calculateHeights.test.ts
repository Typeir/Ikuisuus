/**
 * @fileoverview Tests for calculateHeights utility
 * @module tests/unit/src/lib/components/sidebar/calculateHeights
 */

import { calculateHeights } from '@/lib/components/sidebar/calculateHeights';
import { BASE_HEIGHT } from '@/lib/components/sidebar/constants';
import type { Item } from '@/lib/components/sidebar/types';
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
    expect(result[0].expandedHeight).toBe(BASE_HEIGHT + BASE_HEIGHT * 2);
  });

  it('should calculate height for stub item', () => {
    const items: Item[] = [
      {
        name: 'Stub Folder',
        path: 'stub',
        isStub: true,
        childCount: 5,
      },
    ];
    const result = calculateHeights(items);
    expect(result[0].expandedHeight).toBe(BASE_HEIGHT + BASE_HEIGHT * 5);
  });

  it('should sort folders before files', () => {
    const items: Item[] = [
      { name: 'File', path: 'file' },
      {
        name: 'Folder',
        path: 'folder',
        children: [{ name: 'Child', path: 'folder/child' }],
      },
    ];
    const result = calculateHeights(items);
    expect(result[0].name).toBe('Folder');
    expect(result[1].name).toBe('File');
  });
});
