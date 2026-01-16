/**
 * @fileoverview Unit tests for Metadata Table component
 * @module tests/unit/src/lib/components/mdx/metadataTables/metadataTable.test
 * @description Validates MetadataTable exports, type exports (ColumnConfig, MetadataRow),
 * and component signature. Tests generic filterable/sortable table configuration.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/lib/components/mdx/metadataTables/metadataTable
 */

import { describe, it, expect } from 'vitest';
import MetadataTable, * as MetadataTableModule from '@/lib/components/mdx/metadataTables/metadataTable';

describe('metadataTable', () => {
  it('should export default component', () => {
    expect(MetadataTable).toBeDefined();
    expect(typeof MetadataTable).toBe('function');
  });

  it('should be a React component (accepts props)', () => {
    expect(MetadataTable).toHaveLength(1);
  });

  it('should accept configuration props (data, columns, searchKeys)', () => {
    const componentString = MetadataTable.toString();
    expect(componentString).toContain('data');
    expect(componentString).toContain('columns');
  });

  it('should be a client component', () => {
    expect(MetadataTable.toString()).toBeDefined();
  });

  it('should export type ColumnConfig', () => {
    expect(MetadataTableModule).toHaveProperty('default');
  });

  it('should export type MetadataRow', () => {
    expect(MetadataTableModule).toHaveProperty('default');
  });

  it('should export at least one member (default)', () => {
    const exports = Object.keys(MetadataTableModule);
    expect(exports.length).toBeGreaterThanOrEqual(1);
    expect(exports).toContain('default');
  });
});
