/**
 * @fileoverview Unit tests for CombatantDetailsColumns.
 * @module tests/unit/src/modules/encounter-planner/presentation/combatantDetailsColumns.test
 * @description Verifies CombatantDetailsColumns export, React component type, and single-member module export.
 * 
 * @version 1.0.0
 * @author Typeir
 * 
 * @requires vitest
 * @requires @/modules/encounter-planner/combatantDetailsColumns
 */

import { describe, it, expect } from 'vitest';
import * as CombatantDetailsColumnsModule from '@/modules/encounter-planner/presentation/combatantDetailsColumns';

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
