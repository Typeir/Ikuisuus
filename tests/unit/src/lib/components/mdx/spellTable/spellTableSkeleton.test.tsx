/**
 * @fileoverview Unit tests for Spell Table Skeleton component
 * @module tests/unit/src/lib/components/mdx/spellTable/spellTableSkeleton.test
 * @description Validates SpellTableSkeleton export and component signature.
 * Tests skeleton loading state for SpellTable component.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/lib/components/mdx/spellTable/spellTableSkeleton
 */

import { describe, it, expect } from 'vitest';
import * as SpellTableSkeletonModule from '@/lib/components/mdx/spellTable/spellTableSkeleton';

describe('spellTableSkeleton', () => {
  it('should export SpellTableSkeleton component', () => {
    expect(SpellTableSkeletonModule.SpellTableSkeleton).toBeDefined();
    expect(typeof SpellTableSkeletonModule.SpellTableSkeleton).toBe('function');
  });

  it('should be a React component', () => {
    const componentString = SpellTableSkeletonModule.SpellTableSkeleton.toString();
    expect(componentString).toContain('function');
  });

  it('should export exactly one member', () => {
    const exports = Object.keys(SpellTableSkeletonModule);
    expect(exports).toHaveLength(1);
    expect(exports).toContain('SpellTableSkeleton');
  });
});
