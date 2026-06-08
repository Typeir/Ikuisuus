/**
 * @fileoverview Unit tests for infrastructure/tree-walk/detectMainPath
 * @module tests/unit/src/modules/navigation-sidebar/infrastructure/tree-walk/detectMainPath
 */

import type { Item } from '@/modules/navigation-sidebar/domain/types';
import {
    detectMainPaths,
    findMainPath,
} from '@/modules/navigation-sidebar/infrastructure/tree-walk/detectMainPath';
import { describe, expect, it } from 'vitest';

describe('detectMainPath', () => {
  describe('findMainPath', () => {
    it('should find main.mdx in children', () => {
      const items: Item[] = [
        { name: 'Main', path: 'spells/main' },
        { name: 'Fireball', path: 'spells/fireball' },
      ];
      const result = findMainPath(items, 'spells');

      expect(result).toBe('spells/main');
    });

    it('should return undefined when no main exists', () => {
      const items: Item[] = [
        { name: 'Fireball', path: 'spells/fireball' },
        { name: 'Magic Missile', path: 'spells/magic-missile' },
      ];
      const result = findMainPath(items, 'spells');

      expect(result).toBeUndefined();
    });

    it('should work with root path', () => {
      const items: Item[] = [{ name: 'Main', path: 'main' }];
      const result = findMainPath(items, '');

      expect(result).toBe('main');
    });
  });

  describe('detectMainPaths', () => {
    it('should detect main.mdx in nested structure', () => {
      const items: Item[] = [
        {
          name: 'Spells',
          path: 'spells',
          children: [
            { name: 'Main', path: 'spells/main' },
            { name: 'Fireball', path: 'spells/fireball' },
          ],
        },
      ];
      const result = detectMainPaths(items);

      expect(result.has('spells')).toBe(true);
      expect(result.get('spells')).toBe('spells/main');
    });

    it('should find main in multiple branches', () => {
      const items: Item[] = [
        {
          name: 'Monsters',
          path: 'monsters',
          children: [
            { name: 'Main', path: 'monsters/main' },
            { name: 'Zombie', path: 'monsters/zombie' },
          ],
        },
        {
          name: 'Spells',
          path: 'spells',
          children: [
            { name: 'Main', path: 'spells/main' },
            { name: 'Fireball', path: 'spells/fireball' },
          ],
        },
      ];
      const result = detectMainPaths(items);

      expect(result.size).toBe(2);
      expect(result.get('monsters')).toBe('monsters/main');
      expect(result.get('spells')).toBe('spells/main');
    });

    it('should return empty map when no main exists', () => {
      const items: Item[] = [
        {
          name: 'Spells',
          path: 'spells',
          children: [{ name: 'Fireball', path: 'spells/fireball' }],
        },
      ];
      const result = detectMainPaths(items);

      expect(result.size).toBe(0);
    });
  });
});
