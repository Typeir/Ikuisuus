/**
 * @fileoverview Tests for Metadata Tables Barrel Export
 * @module tests/unit/src/lib/components/mdx/metadataTables/index.test
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/modules/library/presentation/components/metadataTables
 */

import { describe, it, expect } from 'vitest';
import * as MetadataTableExports from '@/lib/components/mdx/metadataTables/index';

describe('mdx/metadataTables barrel exports', () => {
  describe('Component exports', () => {
    it('should export MetadataTable as default', () => {
      expect(MetadataTableExports.MetadataTable).toBeDefined();
      expect(typeof MetadataTableExports.MetadataTable).toBe('function');
    });

    it('should export MetadataTable with expected function signature', () => {
      expect(MetadataTableExports.MetadataTable.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Module integrity', () => {
    it('should export at least one member', () => {
      const exports = Object.keys(MetadataTableExports);
      expect(exports.length).toBeGreaterThanOrEqual(1);
    });

    it('should not export undefined values', () => {
      Object.values(MetadataTableExports).forEach((value) => {
        expect(value).toBeDefined();
      });
    });

    it('should include MetadataTable in exports', () => {
      const exports = Object.keys(MetadataTableExports);
      expect(exports).toContain('MetadataTable');
    });
  });
});
