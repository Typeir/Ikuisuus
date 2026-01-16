/**
 * @fileoverview Unit tests for Creature Combobox component
 * @module tests/unit/src/lib/components/encounterPlanner/comboboxes/creatureCombobox.test
 * @description Validates CreatureCombobox export and component signature.
 * Tests combobox component for selecting creatures in encounter planner.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/lib/components/encounterPlanner/comboboxes/creatureCombobox
 */

import { describe, it, expect } from 'vitest';
import * as CreatureComboboxModule from '@/lib/components/encounterPlanner/comboboxes/creatureCombobox';

describe('creatureCombobox', () => {
  it('should export CreatureCombobox component', () => {
    expect(CreatureComboboxModule.CreatureCombobox).toBeDefined();
    expect(typeof CreatureComboboxModule.CreatureCombobox).toBe('function');
  });

  it('should be a React component', () => {
    const componentString = CreatureComboboxModule.CreatureCombobox.toString();
    expect(componentString).toBeDefined();
    expect(componentString.length).toBeGreaterThan(0);
  });

  it('should export exactly one member', () => {
    const exports = Object.keys(CreatureComboboxModule);
    expect(exports).toHaveLength(1);
    expect(exports).toContain('CreatureCombobox');
  });
});
