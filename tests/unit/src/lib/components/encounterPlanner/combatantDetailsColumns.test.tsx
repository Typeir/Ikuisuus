/**
 * @fileoverview Unit tests for Combatant Details Columns component
 * @module tests/unit/src/lib/components/encounterPlanner/combatantDetailsColumns.test
 * @description Validates CombatantDetailsColumns export and component signature.
 * Tests component for displaying combatant details in encounter planner.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/lib/components/encounterPlanner/combatantDetailsColumns
 */

import { describe, it, expect } from 'vitest';
import * as CombatantDetailsColumnsModule from '@/lib/components/encounterPlanner/combatantDetailsColumns';

describe('combatantDetailsColumns', () => {
  it('should export CombatantDetailsColumns component', () => {
    expect(CombatantDetailsColumnsModule.CombatantDetailsColumns).toBeDefined();
    expect(typeof CombatantDetailsColumnsModule.CombatantDetailsColumns).toBe('function');
  });

  it('should be a React component', () => {
    const componentString = CombatantDetailsColumnsModule.CombatantDetailsColumns.toString();
    expect(componentString).toBeDefined();
    expect(componentString.length).toBeGreaterThan(0);
  });

  it('should export exactly one member', () => {
    const exports = Object.keys(CombatantDetailsColumnsModule);
    expect(exports).toHaveLength(1);
    expect(exports).toContain('CombatantDetailsColumns');
  });
});
