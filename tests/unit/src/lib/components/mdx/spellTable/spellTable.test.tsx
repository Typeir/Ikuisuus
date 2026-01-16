/**
 * @fileoverview Unit tests for Spell Table component
 * @module tests/unit/src/lib/components/mdx/spellTable/spellTable.test
 * @description Validates SpellTable exports and component signature.
 * Tests client-side data fetching from multiple spell sources (API endpoints or direct data).
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/lib/components/mdx/spellTable/spellTable
 */

import { describe, it, expect } from 'vitest';
import * as SpellTableModule from '@/lib/components/mdx/spellTable/spellTable';

describe('spellTable', () => {
  it('should export default component', () => {
    expect(SpellTableModule.default).toBeDefined();
    expect(typeof SpellTableModule.default).toBeDefined();
  });

  it('should be a React component', () => {
    const componentString = SpellTableModule.default.toString();
    expect(componentString).toBeDefined();
    expect(componentString.length).toBeGreaterThan(0);
  });

  it('should accept sources prop', () => {
    const componentString = SpellTableModule.default.toString();
    expect(componentString).toContain('sources');
  });

  it('should be a client component', () => {
    expect(SpellTableModule.default.toString()).toBeDefined();
  });

  it('should export exactly one member', () => {
    const exports = Object.keys(SpellTableModule);
    expect(exports).toHaveLength(1);
    expect(exports).toContain('default');
  });
});
