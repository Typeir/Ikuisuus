/**
 * @fileoverview Combatant Context for Play Mode
 * @description Provides combatant state and update functions to all child components
 * without prop drilling. Each combatant row creates its own context.
 *
 * @module CombatantContext
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 */

'use client';

import type { CreatureStats } from '@/lib/types/encounterPlanner';
import type { InProgressCombatant } from '@/lib/types/inProgressCombat';
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    type ReactNode,
} from 'react';

/**
 * Context value for combatant data and update functions.
 *
 * @interface CombatantContextValue
 * @property {InProgressCombatant} combatant - The combatant data
 * @property {(combatant: InProgressCombatant) => void} onUpdate - Full combatant update
 * @property {<K extends keyof InProgressCombatant>(field: K, value: InProgressCombatant[K]) => void} updateField - Single field update
 * @property {(stats: CreatureStats) => void} updateStats - Stats object update
 * @property {() => void} [onRemoveSessionOnly] - Remove session-only combatant
 * @property {boolean} disableLocking - If true, lock functionality is disabled
 */
interface CombatantContextValue {
  combatant: InProgressCombatant;
  onUpdate: (combatant: InProgressCombatant) => void;
  updateField: <K extends keyof InProgressCombatant>(
    field: K,
    value: InProgressCombatant[K],
  ) => void;
  updateStats: (stats: CreatureStats) => void;
  onRemoveSessionOnly?: () => void;
  disableLocking: boolean;
}

const CombatantContext = createContext<CombatantContextValue | null>(null);

/** @internal Exported for unit testing */
export { CombatantContext };

/**
 * Props for CombatantProvider component.
 *
 * @interface CombatantProviderProps
 * @property {InProgressCombatant} combatant - The combatant data
 * @property {(combatant: InProgressCombatant) => void} onUpdate - Update callback
 * @property {() => void} [onRemoveSessionOnly] - Remove session-only callback
 * @property {ReactNode} children - Child components
 * @property {boolean} [disableLocking=false] - If true, hides lock button and prevents locking
 */
interface CombatantProviderProps {
  combatant: InProgressCombatant;
  onUpdate: (combatant: InProgressCombatant) => void;
  onRemoveSessionOnly?: () => void;
  children: ReactNode;
  disableLocking?: boolean;
}

/**
 * Provider component that wraps a combatant row and provides context to all children.
 *
 * @component CombatantProvider
 * @param {CombatantProviderProps} props - Provider props
 * @param {InProgressCombatant} props.combatant - The combatant data object
 * @param {Function} props.onUpdate - Callback when combatant data changes
 * @param {Function} [props.onRemoveSessionOnly] - Optional callback to remove combatant from session
 * @param {ReactNode} props.children - Child components to wrap
 * @param {boolean} [props.disableLocking=false] - Whether to disable row locking
 * @returns {React.ReactElement} Provider with children
 *
 * @example
 * <CombatantProvider combatant={c} onUpdate={handleUpdate}>
 *   <CombatantMainStats />
 *   <CombatantNameSection />
 * </CombatantProvider>
 */
export const CombatantProvider: React.FC<CombatantProviderProps> = ({
  combatant,
  onUpdate,
  onRemoveSessionOnly,
  children,
  disableLocking = false,
}) => {
  const updateField = useCallback(
    <K extends keyof InProgressCombatant>(
      field: K,
      value: InProgressCombatant[K],
    ) => {
      onUpdate({ ...combatant, [field]: value });
    },
    [combatant, onUpdate],
  );

  const updateStats = useCallback(
    (newStats: CreatureStats) => {
      onUpdate({ ...combatant, stats: newStats });
    },
    [combatant, onUpdate],
  );

  const value = useMemo<CombatantContextValue>(
    () => ({
      combatant,
      onUpdate,
      updateField,
      updateStats,
      onRemoveSessionOnly,
      disableLocking,
    }),
    [
      combatant,
      onUpdate,
      updateField,
      updateStats,
      onRemoveSessionOnly,
      disableLocking,
    ],
  );

  return (
    <CombatantContext.Provider value={value}>
      {children}
    </CombatantContext.Provider>
  );
};

/**
 * Hook to access combatant context. Must be used within a CombatantProvider.
 *
 * @function useCombatant
 * @returns {CombatantContextValue} Context value with combatant and update functions
 * @throws {Error} If used outside of CombatantProvider
 *
 * @example
 * const { combatant, updateField } = useCombatant();
 * updateField('slain', true);
 */
export const useCombatant = (): CombatantContextValue => {
  const context = useContext(CombatantContext);
  if (!context) {
    throw new Error('useCombatant must be used within a CombatantProvider');
  }
  return context;
};
