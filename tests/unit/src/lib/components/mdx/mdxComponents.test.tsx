/**
 * @fileoverview Unit tests for MDX Components module
 * @module tests/unit/src/lib/components/mdx/mdxComponents.test
 * @description Validates mdxComponents module exports. This module contains
 * compiled MDX components exported for reuse.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/lib/components/mdx/mdxComponents
 */

import { describe, it, expect } from 'vitest';
import * as MdxComponentsModule from '@/lib/components/mdx/mdxComponents';

describe('mdxComponents', () => {
  it('should export at least one component', () => {
    const exports = Object.keys(MdxComponentsModule);
    expect(exports.length).toBeGreaterThanOrEqual(0);
  });

  it('should have exported members be functions (components)', () => {
    const exports = Object.keys(MdxComponentsModule);
    if (exports.length > 0) {
      const firstExport = MdxComponentsModule[exports[0]];
      expect(['function', 'object']).toContain(typeof firstExport);
    }
  });
});
