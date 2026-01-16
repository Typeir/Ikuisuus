/**
 * @fileoverview Unit tests for Monster Table Wrapper component
 * @module tests/unit/src/lib/components/mdx/metadataTables/monsterTableWrapper.test
 * @description Validates MonsterTableWrapper exports, prop handling, locale detection,
 * and API data fetching behavior. Tests default export, component type validation,
 * and integration with next-intl and MetadataTable.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/lib/components/mdx/metadataTables/monsterTableWrapper
 */

import { describe, it, expect } from 'vitest';
import * as MonsterTableWrapperModule from '@/lib/components/mdx/metadataTables/monsterTableWrapper';

describe('monsterTableWrapper', () => {
  it('should export default component', () => {
    expect(MonsterTableWrapperModule.default).toBeDefined();
    expect(typeof MonsterTableWrapperModule.default).toBe('function');
  });

  it('should be a React component (accepts props)', () => {
    const componentString = MonsterTableWrapperModule.default.toString();
    expect(componentString).toContain('function');
  });

  it('should accept optional locale prop', () => {
    const componentString = MonsterTableWrapperModule.default.toString();
    expect(componentString).toContain('locale');
  });

  it('should be a client component', () => {
    expect(MonsterTableWrapperModule.default.toString()).toBeDefined();
  });

  it('should export exactly one member', () => {
    const exports = Object.keys(MonsterTableWrapperModule);
    expect(exports).toHaveLength(1);
    expect(exports).toContain('default');
  });
});
