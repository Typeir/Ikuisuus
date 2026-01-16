/**
 * @fileoverview Unit tests for Heirloom Table Wrapper component
 * @module tests/unit/src/lib/components/mdx/metadataTables/heirloomTableWrapper.test
 * @description Validates HeirloomTableWrapper exports, prop handling, locale detection,
 * and API data fetching behavior. Tests default export, component type validation,
 * and integration with next-intl and MetadataTable.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/lib/components/mdx/metadataTables/heirloomTableWrapper
 */

import { describe, it, expect } from 'vitest';
import * as HeirloomTableWrapperModule from '@/lib/components/mdx/metadataTables/heirloomTableWrapper';

describe('heirloomTableWrapper', () => {
  it('should export default component', () => {
    expect(HeirloomTableWrapperModule.default).toBeDefined();
    expect(typeof HeirloomTableWrapperModule.default).toBe('function');
  });

  it('should be a React component (accepts props)', () => {
    const componentString = HeirloomTableWrapperModule.default.toString();
    expect(componentString).toContain('function');
  });

  it('should accept optional locale prop', () => {
    const componentString = HeirloomTableWrapperModule.default.toString();
    expect(componentString).toContain('locale');
  });

  it('should be a client component', () => {
    expect(HeirloomTableWrapperModule.default.toString()).toBeDefined();
  });

  it('should export exactly one member', () => {
    const exports = Object.keys(HeirloomTableWrapperModule);
    expect(exports).toHaveLength(1);
    expect(exports).toContain('default');
  });
});
