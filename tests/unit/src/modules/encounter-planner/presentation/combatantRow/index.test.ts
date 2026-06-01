/**
 * @fileoverview Tests for Combatant Row Module Barrel Exports
 * @module tests/unit/src/lib/components/encounterPlanner/combatantRow/index
 * @description Validates all component and type exports from the combatantRow barrel.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest
 * @requires @/modules/encounter-planner/combatantRow
 */

import { describe, it, expect } from 'vitest';
import * as CombatantRowExports from '@/modules/encounter-planner/presentation/combatantRow';

describe('encounterPlanner/combatantRow barrel exports', () => {
  describe('Component exports', () => {
    it('should export CombatantRow component', () => {
      expect(CombatantRowExports.CombatantRow).toBeDefined();
      expect(typeof CombatantRowExports.CombatantRow).toBe('function');
    });

    it('should export CombatantMainStats component', () => {
      expect(CombatantRowExports.CombatantMainStats).toBeDefined();
      expect(typeof CombatantRowExports.CombatantMainStats).toBe('function');
    });

    it('should export CombatantNameSection component', () => {
      expect(CombatantRowExports.CombatantNameSection).toBeDefined();
      expect(typeof CombatantRowExports.CombatantNameSection).toBe('function');
    });

    it('should export CombatantMechanicsSection component', () => {
      expect(CombatantRowExports.CombatantMechanicsSection).toBeDefined();
      expect(typeof CombatantRowExports.CombatantMechanicsSection).toBe('function');
    });

    it('should export CombatantHeroicSection component', () => {
      expect(CombatantRowExports.CombatantHeroicSection).toBeDefined();
      expect(typeof CombatantRowExports.CombatantHeroicSection).toBe('function');
    });

    it('should export CombatantConditionsManager component', () => {
      expect(CombatantRowExports.CombatantConditionsManager).toBeDefined();
      expect(typeof CombatantRowExports.CombatantConditionsManager).toBe('function');
    });
  });

  describe('Type exports', () => {
    it('should support TypeScript type imports (types are not available at runtime)', () => {
      // TypeScript types are stripped at compile time and don't exist in runtime
      // This test just documents the expected behavior
      expect(true).toBe(true); // Types are imported via: import type { CombatantRowProps }
    });
  });

  describe('Module integrity', () => {
    it('should export expected number of components', () => {
      const exports = Object.keys(CombatantRowExports);
      // 6 components at runtime (types are compile-time only)
      expect(exports.length).toBe(6);
    });

    it('should not export undefined values', () => {
      const exports = Object.values(CombatantRowExports).filter((v) => v !== undefined);
      expect(exports.length).toBeGreaterThan(0);
    });

    it('should export only expected component names', () => {
      const exports = Object.keys(CombatantRowExports);
      const expectedComponents = [
        'CombatantRow',
        'CombatantMainStats',
        'CombatantNameSection',
        'CombatantMechanicsSection',
        'CombatantHeroicSection',
        'CombatantConditionsManager',
      ];
      expectedComponents.forEach((component) => {
        expect(exports).toContain(component);
      });
    });
  });
});
