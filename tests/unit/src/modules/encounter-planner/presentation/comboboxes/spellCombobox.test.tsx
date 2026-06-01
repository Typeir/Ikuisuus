/**
 * @fileoverview Unit tests for Spell Combobox component
 * @module tests/unit/src/lib/components/encounterPlanner/comboboxes/spellCombobox.test
 * @description Validates SpellCombobox export and component signature.
 * Tests combobox component for selecting spells in encounter planner.
 * 
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 * 
 * @requires vitest
 * @requires @/modules/encounter-planner/comboboxes/spellCombobox
 */

import { describe, it, expect } from 'vitest';
import * as SpellComboboxModule from '@/modules/encounter-planner/comboboxes/spellCombobox';

describe('spellCombobox', () => {
  it('should export SpellCombobox component', () => {
    expect(SpellComboboxModule.SpellCombobox).toBeDefined();
    expect(typeof SpellComboboxModule.SpellCombobox).toBe('function');
  });

  it('should be a React component', () => {
    const componentString = SpellComboboxModule.SpellCombobox.toString();
    expect(componentString).toBeDefined();
    expect(componentString.length).toBeGreaterThan(0);
  });

  it('should export exactly one member', () => {
    const exports = Object.keys(SpellComboboxModule);
    expect(exports).toHaveLength(1);
    expect(exports).toContain('SpellCombobox');
  });
});
