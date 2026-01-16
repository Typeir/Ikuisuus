/**
 * @fileoverview Unit tests for Metadata Table Skeleton component
 * @module tests/unit/src/lib/components/mdx/metadataTables/metadataTableSkeleton.test
 * @description Validates MetadataTableSkeleton export and component signature.
 * Tests skeleton loading state for MetadataTable with configurable row/column counts.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/lib/components/mdx/metadataTables/metadataTableSkeleton
 */

import { describe, it, expect } from 'vitest';
import * as MetadataTableSkeletonModule from '@/lib/components/mdx/metadataTables/metadataTableSkeleton';

describe('metadataTableSkeleton', () => {
  it('should export MetadataTableSkeleton component', () => {
    expect(MetadataTableSkeletonModule.MetadataTableSkeleton).toBeDefined();
    expect(typeof MetadataTableSkeletonModule.MetadataTableSkeleton).toBe('function');
  });

  it('should be a React component (accepts props)', () => {
    expect(MetadataTableSkeletonModule.MetadataTableSkeleton).toHaveLength(1);
  });

  it('should accept rows and columns props', () => {
    const componentString = MetadataTableSkeletonModule.MetadataTableSkeleton.toString();
    expect(componentString).toContain('rows');
    expect(componentString).toContain('columns');
  });

  it('should export exactly one member', () => {
    const exports = Object.keys(MetadataTableSkeletonModule);
    expect(exports).toHaveLength(1);
    expect(exports).toContain('MetadataTableSkeleton');
  });
});
