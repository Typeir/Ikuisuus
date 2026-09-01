/**
 * @fileoverview Tests for Skeleton Component Barrel Export
 * @module tests/unit/src/lib/components/skeleton/index.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/lib/components/skeleton
 */

import { describe, it, expect } from 'vitest';
import * as SkeletonExports from '@/lib/components/skeleton/index';

describe('skeleton barrel exports', () => {
  describe('Component exports', () => {
    it('should export Skeleton', () => {
      expect(SkeletonExports.Skeleton).toBeDefined();
      expect(typeof SkeletonExports.Skeleton).toBe('function');
    });

    it('should export SkeletonGroup', () => {
      expect(SkeletonExports.SkeletonGroup).toBeDefined();
      expect(typeof SkeletonExports.SkeletonGroup).toBe('function');
    });
  });

  describe('Module integrity', () => {
    it('should export at least two members', () => {
      const exports = Object.keys(SkeletonExports);
      expect(exports.length).toBeGreaterThanOrEqual(2);
    });

    it('should not export undefined values', () => {
      Object.values(SkeletonExports).forEach((value) => {
        expect(value).toBeDefined();
      });
    });

    it('should export expected component names', () => {
      const exports = Object.keys(SkeletonExports);
      expect(exports).toContain('Skeleton');
      expect(exports).toContain('SkeletonGroup');
    });
  });
});
