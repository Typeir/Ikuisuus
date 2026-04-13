/**
 * @fileoverview Unit tests for CombatantStatsGrid component
 * @description Tests the extracted stats grid sub-component.
 *
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @requires vitest - Test framework
 * @requires @/lib/components/encounterPlanner/combatantRow/combatantStatsGrid
 */

import { CombatantStatsGrid } from '@/lib/components/encounterPlanner/combatantRow/combatantStatsGrid';
import { describe, expect, it } from 'vitest';

describe('CombatantStatsGrid', () => {
  it('should export CombatantStatsGrid component', () => {
    expect(CombatantStatsGrid).toBeDefined();
    expect(typeof CombatantStatsGrid).toBe('function');
  });
});
