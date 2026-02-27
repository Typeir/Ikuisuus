/**
 * @fileoverview World Sim Reducer
 * @description Pure reducer function for World Sim state transitions.
 * Handles body/region selection, zoom level changes, and UI toggles.
 *
 * @module worldSim/context/worldSimReducer
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
    INITIAL_WORLD_SIM_STATE,
    ZoomLevel,
    type WorldSimAction,
    type WorldSimState,
} from './worldSimTypes';

/**
 * World Sim state reducer.
 * All state transitions are handled here in a single, pure function.
 *
 * @function worldSimReducer
 * @param {WorldSimState} state - Current state
 * @param {WorldSimAction} action - Action to apply
 * @returns {WorldSimState} New state
 */
export function worldSimReducer(
  state: WorldSimState,
  action: WorldSimAction,
): WorldSimState {
  switch (action.type) {
    case 'INITIALIZE':
      return { ...state, isInitialized: true };

    case 'SELECT_BODY':
      return {
        ...state,
        selectedBodyId: action.bodyId,
        selectedRegionId: null,
        zoomLevel: ZoomLevel.Body,
        hoveredBodyId: null,
      };

    case 'SELECT_REGION':
      return {
        ...state,
        selectedBodyId: action.bodyId,
        selectedRegionId: action.regionId,
        zoomLevel: ZoomLevel.Region,
      };

    case 'DESELECT':
      return {
        ...state,
        selectedBodyId: null,
        selectedRegionId: null,
        zoomLevel: ZoomLevel.System,
      };

    case 'DESELECT_REGION':
      return {
        ...state,
        selectedRegionId: null,
        zoomLevel: ZoomLevel.Body,
      };

    case 'SET_ZOOM_LEVEL':
      return { ...state, zoomLevel: action.level };

    case 'SET_TRANSITIONING':
      return { ...state, isTransitioning: action.isTransitioning };

    case 'HOVER_BODY':
      return { ...state, hoveredBodyId: action.bodyId };

    case 'TOGGLE_LABELS':
      return { ...state, labelsVisible: !state.labelsVisible };

    case 'TOGGLE_ORBITS':
      return { ...state, orbitsPaused: !state.orbitsPaused };

    case 'RESET':
      return { ...INITIAL_WORLD_SIM_STATE, isInitialized: state.isInitialized };

    default:
      return state;
  }
}
