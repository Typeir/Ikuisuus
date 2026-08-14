/**
 * @fileoverview Phase Marker Utility
 * @description Determines combat phase from HP percentage thresholds.
 *
 * @module phaseMarker
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

/**
 * Phase marker type representing HP threshold states.
 * @type PhaseMarkerType
 */
export type PhaseMarkerType = 'Wounded' | 'Bloodied' | 'Doomed' | 'Slain' | null;

/**
 * HP percentage thresholds for each phase marker.
 * @constant
 */
export const PHASE_THRESHOLDS = {
  WOUNDED: 75,
  BLOODIED: 50,
  DOOMED: 25,
  SLAIN: 0,
} as const;

/**
 * Determines phase marker from HP percentage.
 *
 * Phase thresholds:
 * - > 75%: null (healthy)
 * - 51-75%: 'Wounded'
 * - 26-50%: 'Bloodied'
 * - ≤ 25%: 'Doomed'
 * - 0%: 'Slain'
 *
 * @function getPhaseMarker
 * @param {number} hpCurrent - Current HP value
 * @param {number} hpMax - Maximum HP value
 * @returns {PhaseMarkerType} Phase marker string or null if healthy
 *
 * @example
 * getPhaseMarker(50, 100) // Returns 'Bloodied'
 * getPhaseMarker(80, 100) // Returns null
 * getPhaseMarker(10, 100) // Returns 'Doomed'
 * getPhaseMarker(0, 100) // Returns 'Slain'
 */
export function getPhaseMarker(hpCurrent: number, hpMax: number): PhaseMarkerType {
  if (hpMax <= 0) return null;

  const hpPercentage = (hpCurrent / hpMax) * 100;

  if (hpPercentage > PHASE_THRESHOLDS.WOUNDED) return null;
  if (hpPercentage > PHASE_THRESHOLDS.BLOODIED) return 'Wounded';
  if (hpPercentage > PHASE_THRESHOLDS.DOOMED) return 'Bloodied';
  if (hpPercentage > PHASE_THRESHOLDS.SLAIN) return 'Doomed';
  return 'Slain';
}
