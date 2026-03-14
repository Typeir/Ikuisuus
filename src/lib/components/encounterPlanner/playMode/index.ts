/**
 * @fileoverview Play Mode Components Exports
 * @description Barrel export for play mode components.
 * Re-exports for convenient import from single module.
 *
 * @module encounterPlanner/playMode
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 *
 * @example
 * ```tsx
 * import { PlayMode } from '@/lib/components/encounterPlanner/playMode';
 * // CombatantRow moved to @/lib/components/encounterPlanner/combatantRow
 * import { CombatantRow } from '@/lib/components/encounterPlanner/combatantRow';
 * ```
 */

export { PlayMode } from './playMode';

/** Backwards compatibility: re-export moved components */
export { CombatantRow as PlayModeCombatantRow } from '../combatantRow';
export type { CombatantRowProps as PlayModeCombatantRowProps } from '../combatantRow';

/** Backwards compatibility: re-export sub-components from combatantRow */
export {
  CombatantMainStats,
  CombatantNameSection,
  CombatantMechanicsSection,
  CombatantHeroicSection,
  CombatantConditionsManager,
  type CombatantMainStatsProps,
  type CombatantNameSectionProps,
  type CombatantMechanicsSectionProps,
  type CombatantHeroicSectionProps,
  type CombatantConditionsManagerProps,
} from '../combatantRow';

export { getPhaseMarker, PHASE_THRESHOLDS } from '../combatantRow/utils';
export type { PhaseMarkerType } from '../combatantRow/utils';
