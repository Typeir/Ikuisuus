/**
 * Combatant Row Module
 *
 * @fileoverview Barrel export for combatant row component and all sub-components.
 * The CombatantRow is the primary display component for combatants in both design mode
 * and play mode, with complete state management via CombatantContext.
 *
 * @module combatantRow
 * @version 1.0.0
 * @author Typeir
 *
 * @exports CombatantRow - Main combatant row component
 * @exports CombatantRowProps - Props interface for CombatantRow
 * @exports CombatantMainStats - Displays HP, AC, stats, initiative, slain toggle
 * @exports CombatantNameSection - Displays name, CR, awakening badges
 * @exports CombatantMechanicsSection - Manages legendary deeds and resists
 * @exports CombatantHeroicSection - Manages heroic awakening state
 * @exports CombatantConditionsManager - Manages active conditions
 * @since 2.0.0
 */

export { CombatantRow, type CombatantRowProps } from './combatantRow';
export { CombatantMainStats, type CombatantMainStatsProps } from './combatantMainStats';
export { CombatantNameSection, type CombatantNameSectionProps } from './combatantNameSection';
export { CombatantMechanicsSection, type CombatantMechanicsSectionProps } from './combatantMechanicsSection';
export { CombatantHeroicSection, type CombatantHeroicSectionProps } from './combatantHeroicSection';
export { CombatantConditionsManager, type CombatantConditionsManagerProps } from './combatantConditionsManager';
