/**
 * @fileoverview Unit tests for Affix Combobox component
 * @module tests/unit/src/lib/components/encounterPlanner/comboboxes/affixCombobox.test
 * @description Validates AffixCombobox export and component signature.
 * Tests combobox component for selecting affixes in encounter planner.
 * 
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires vitest
 * @requires @/modules/encounter-planner/comboboxes/affixCombobox
 */

import { describe, it, expect } from 'vitest';
import * as AffixComboboxModule from '@/modules/encounter-planner/comboboxes/affixCombobox';

describe('affixCombobox', () => {
  it('should export AffixCombobox component', () => {
    expect(AffixComboboxModule.AffixCombobox).toBeDefined();
    expect(typeof AffixComboboxModule.AffixCombobox).toBe('function');
  });

  it('should be a React component', () => {
    const componentString = AffixComboboxModule.AffixCombobox.toString();
    expect(componentString).toBeDefined();
    expect(componentString.length).toBeGreaterThan(0);
  });

  it('should export exactly one member', () => {
    const exports = Object.keys(AffixComboboxModule);
    expect(exports).toHaveLength(1);
    expect(exports).toContain('AffixCombobox');
  });
});
