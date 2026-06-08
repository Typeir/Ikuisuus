/**
 * @fileoverview World Sim React Context
 * @description Provides state management for the World Sim module via React Context + useReducer.
 * Follows the same pattern as PersistentUiContext.
 *
 * @module worldSim/context/WorldSimContext
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

'use client';

import {
    createContext,
    useContext,
    useMemo,
    useReducer,
    type Dispatch,
    type ReactNode,
} from 'react';

import { worldSimReducer } from '@/modules/world-sim/application/state/worldSimReducer';
import {
    INITIAL_WORLD_SIM_STATE,
    type WorldSimAction,
    type WorldSimState,
} from '@/modules/world-sim/application/state/worldSimTypes';

/**
 * Context for World Sim state (read-only).
 * @constant
 */
const WorldSimStateContext = createContext<WorldSimState>(
  INITIAL_WORLD_SIM_STATE,
);

/**
 * Context for World Sim dispatch (write-only).
 * @constant
 */
const WorldSimDispatchContext = createContext<Dispatch<WorldSimAction>>(
  () => undefined,
);

/**
 * Props for WorldSimProvider component.
 * @interface WorldSimProviderProps
 * @property {ReactNode} children - Child components
 */
interface WorldSimProviderProps {
  children: ReactNode;
}

/**
 * World Sim context provider component.
 * Wraps children with state and dispatch contexts.
 *
 * @component
 * @param {WorldSimProviderProps} props - Provider props
 * @param {ReactNode} props.children - Child components to wrap
 * @returns {JSX.Element} Provider wrapping children
 */
export function WorldSimProvider({ children }: WorldSimProviderProps) {
  const [state, dispatch] = useReducer(
    worldSimReducer,
    INITIAL_WORLD_SIM_STATE,
  );

  const stateValue = useMemo(() => state, [state]);

  return (
    <WorldSimStateContext.Provider value={stateValue}>
      <WorldSimDispatchContext.Provider value={dispatch}>
        {children}
      </WorldSimDispatchContext.Provider>
    </WorldSimStateContext.Provider>
  );
}

/**
 * Hook to access World Sim read-only state.
 *
 * @function useWorldSimState
 * @returns {WorldSimState} Current World Sim state
 * @throws {Error} If used outside WorldSimProvider
 */
export function useWorldSimState(): WorldSimState {
  const context = useContext(WorldSimStateContext);
  if (context === undefined) {
    throw new Error('useWorldSimState must be used within a WorldSimProvider');
  }
  return context;
}

/**
 * Hook to access World Sim dispatch function.
 *
 * @function useWorldSimDispatch
 * @returns {Dispatch<WorldSimAction>} Dispatch function
 * @throws {Error} If used outside WorldSimProvider
 */
export function useWorldSimDispatch(): Dispatch<WorldSimAction> {
  const context = useContext(WorldSimDispatchContext);
  if (context === undefined) {
    throw new Error(
      'useWorldSimDispatch must be used within a WorldSimProvider',
    );
  }
  return context;
}
