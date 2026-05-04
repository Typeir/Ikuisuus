/**
 * @fileoverview Type definitions test for sidebar types
 * @module tests/unit/src/lib/components/sidebar/types
 */

import type {
    Item,
    LayoutItem
} from '@/lib/components/sidebar/types';
import { describe, expect, it } from 'vitest';

describe('Sidebar Types', () => {
  it('should allow Item type creation', () => {
    const item: Item = {
      name: 'Test',
      path: 'test',
    };
    expect(item.name).toBe('Test');
  });

  it('should allow LayoutItem type creation', () => {
    const item: LayoutItem = {
      name: 'Test',
      path: 'test',
      expandedHeight: 52,
    };
    expect(item.expandedHeight).toBe(52);
  });

  it('should allow optional Item properties', () => {
    const item: Item = {
      name: 'Folder',
      path: 'folder',
      children: [{ name: 'Child', path: 'folder/child' }],
      isStub: false,
      childCount: 1,
      mainPath: 'folder/main',
    };
    expect(item.children).toHaveLength(1);
  });
});
