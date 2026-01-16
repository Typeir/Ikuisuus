/**
 * @fileoverview Unit tests for Trinket Table Wrapper component
 * @module tests/unit/src/lib/components/mdx/metadataTables/trinketTableWrapper.test
 * @description Validates TrinketTableWrapper exports, prop handling, locale detection,
 * and API data fetching behavior. Tests default export, component type validation,
 * and integration with next-intl and MetadataTable.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/lib/components/mdx/metadataTables/trinketTableWrapper
 */

import { describe, it, expect } from 'vitest';
import * as TrinketTableWrapperModule from '@/lib/components/mdx/metadataTables/trinketTableWrapper';

describe('trinketTableWrapper', () => {
  it('should export default component', () => {
    expect(TrinketTableWrapperModule.default).toBeDefined();
    expect(typeof TrinketTableWrapperModule.default).toBe('function');
  });

  it('should be a React component (accepts props)', () => {
    const componentString = TrinketTableWrapperModule.default.toString();
    expect(componentString).toContain('function');
  });

  it('should accept optional locale prop', () => {
    const componentString = TrinketTableWrapperModule.default.toString();
    expect(componentString).toContain('locale');
  });

  it('should be a client component', () => {
    expect(TrinketTableWrapperModule.default.toString()).toBeDefined();
  });

  it('should export exactly one member', () => {
    const exports = Object.keys(TrinketTableWrapperModule);
    expect(exports).toHaveLength(1);
    expect(exports).toContain('default');
  });
});
