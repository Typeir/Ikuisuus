/**
 * @fileoverview Unit tests for Phase Marker utility
 * @module tests/unit/src/lib/components/encounterPlanner/playMode/utils/phaseMarker.test
 * @description Validates getPhaseMarker utility for HP phase calculation.
 * Tests threshold-based phase determination (Wounded, Bloodied, Doomed).
 *
 * @version 1.0.0
 * @author Typeir
 *
 * @requires vitest
 * @requires @/modules/encounter-planner/playMode/utils/phaseMarker
 */

import { describe, it, expect } from 'vitest';
import { getPhaseMarker, PHASE_THRESHOLDS } from '@/modules/encounter-planner/presentation/combatantRow/utils/phaseMarker';

describe('PHASE_THRESHOLDS', () => {
  it('should export PHASE_THRESHOLDS constant', () => {
    expect(PHASE_THRESHOLDS).toBeDefined();
    expect(typeof PHASE_THRESHOLDS).toBe('object');
  });

  it('should have correct threshold values (as percentages)', () => {
    expect(PHASE_THRESHOLDS.WOUNDED).toBe(75);
    expect(PHASE_THRESHOLDS.BLOODIED).toBe(50);
    expect(PHASE_THRESHOLDS.DOOMED).toBe(25);
  });

  it('should have descending threshold order', () => {
    expect(PHASE_THRESHOLDS.WOUNDED).toBeGreaterThan(PHASE_THRESHOLDS.BLOODIED);
    expect(PHASE_THRESHOLDS.BLOODIED).toBeGreaterThan(PHASE_THRESHOLDS.DOOMED);
  });
});

describe('getPhaseMarker', () => {
  it('should export getPhaseMarker function', () => {
    expect(getPhaseMarker).toBeDefined();
    expect(typeof getPhaseMarker).toBe('function');
  });

  describe('return null (healthy - above 75%)', () => {
    it('should return null when at full HP', () => {
      expect(getPhaseMarker(100, 100)).toBeNull();
    });

    it('should return null when above 75% HP', () => {
      expect(getPhaseMarker(80, 100)).toBeNull();
      expect(getPhaseMarker(76, 100)).toBeNull();
    });

    it('should return null when at exactly above 75% HP boundary', () => {
      expect(getPhaseMarker(75.1, 100)).toBeNull();
    });
  });

  describe('return Wounded (50-75%)', () => {
    it('should return Wounded when at exactly 75% HP', () => {
      expect(getPhaseMarker(75, 100)).toBe('Wounded');
    });

    it('should return Wounded when below 75% HP', () => {
      expect(getPhaseMarker(74, 100)).toBe('Wounded');
    });

    it('should return Wounded at 51% HP', () => {
      expect(getPhaseMarker(51, 100)).toBe('Wounded');
    });

    it('should return Wounded when just above 50% HP', () => {
      expect(getPhaseMarker(50.1, 100)).toBe('Wounded');
    });
  });

  describe('return Bloodied (25-50%)', () => {
    it('should return Bloodied when at exactly 50% HP', () => {
      expect(getPhaseMarker(50, 100)).toBe('Bloodied');
    });

    it('should return Bloodied when below 50% HP', () => {
      expect(getPhaseMarker(49, 100)).toBe('Bloodied');
    });

    it('should return Bloodied at 26% HP', () => {
      expect(getPhaseMarker(26, 100)).toBe('Bloodied');
    });

    it('should return Bloodied when just above 25% HP', () => {
      expect(getPhaseMarker(25.1, 100)).toBe('Bloodied');
    });
  });

  describe('return Doomed (0-25%)', () => {
    it('should return Doomed when at exactly 25% HP', () => {
      expect(getPhaseMarker(25, 100)).toBe('Doomed');
    });

    it('should return Doomed when below 25% HP', () => {
      expect(getPhaseMarker(24, 100)).toBe('Doomed');
    });

    it('should return Doomed at 1% HP', () => {
      expect(getPhaseMarker(1, 100)).toBe('Doomed');
    });

    it('should return Slain at 0 HP', () => {
      expect(getPhaseMarker(0, 100)).toBe('Slain');
    });

    it('should return Slain with negative HP', () => {
      expect(getPhaseMarker(-10, 100)).toBe('Slain');
    });
  });

  describe('edge cases', () => {
    it('should handle zero maxHp by returning null', () => {
      expect(getPhaseMarker(0, 0)).toBeNull();
    });

    it('should handle negative maxHp by returning null', () => {
      expect(getPhaseMarker(50, -100)).toBeNull();
    });

    it('should handle current HP greater than max HP', () => {
      expect(getPhaseMarker(150, 100)).toBeNull();
    });

    it('should work with non-round numbers', () => {
      expect(getPhaseMarker(37, 100)).toBe('Bloodied');
      expect(getPhaseMarker(12, 100)).toBe('Doomed');
      expect(getPhaseMarker(63, 100)).toBe('Wounded');
    });

    it('should work with small HP pools', () => {
      expect(getPhaseMarker(3, 4)).toBe('Wounded');
      expect(getPhaseMarker(2, 4)).toBe('Bloodied');
      expect(getPhaseMarker(1, 4)).toBe('Doomed');
    });

    it('should work with large HP pools', () => {
      expect(getPhaseMarker(700, 1000)).toBe('Wounded');
      expect(getPhaseMarker(400, 1000)).toBe('Bloodied');
      expect(getPhaseMarker(200, 1000)).toBe('Doomed');
    });
  });

  describe('boundary precision', () => {
    it('should correctly identify Wounded at boundary', () => {
      expect(getPhaseMarker(74.9, 100)).toBe('Wounded');
      expect(getPhaseMarker(75.1, 100)).toBeNull();
    });

    it('should correctly identify Bloodied at boundary', () => {
      expect(getPhaseMarker(49.9, 100)).toBe('Bloodied');
      expect(getPhaseMarker(50.1, 100)).toBe('Wounded');
    });

    it('should correctly identify Doomed at boundary', () => {
      expect(getPhaseMarker(24.9, 100)).toBe('Doomed');
      expect(getPhaseMarker(25.1, 100)).toBe('Bloodied');
    });
  });
});

describe('getPhaseMarker return type', () => {
  it('should return correct PhaseMarkerType values', () => {
    const validValues = [null, 'Wounded', 'Bloodied', 'Doomed'];
    
    expect(validValues).toContain(getPhaseMarker(100, 100));
    expect(validValues).toContain(getPhaseMarker(60, 100));
    expect(validValues).toContain(getPhaseMarker(40, 100));
    expect(validValues).toContain(getPhaseMarker(10, 100));
  });
});
