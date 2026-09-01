/**
 * @fileoverview World Sim Reducer
 * @description Pure reducer function for World Sim state transitions.
 * Handles body/region selection, zoom level changes, and UI toggles.
 *
 * @module modules/world-sim/application/state/worldSimReducer
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import {
  INITIAL_WORLD_SIM_STATE,
  WorldSimActionType,
  ZoomLevel,
  type WorldSimAction,
  type WorldSimState,
} from '@/modules/world-sim/application/state/worldSimTypes';

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
    case WorldSimActionType.Initialize:
      return { ...state, isInitialized: true };

    case WorldSimActionType.SelectBody:
      return {
        ...state,
        selectedBodyId: action.bodyId,
        selectedRegionId: null,
        zoomLevel: ZoomLevel.Body,
        hoveredBodyId: null,
      };

    case WorldSimActionType.SelectRegion:
      return {
        ...state,
        selectedBodyId: action.bodyId,
        selectedRegionId: action.regionId,
        zoomLevel: ZoomLevel.Region,
      };

    case WorldSimActionType.Deselect:
      return {
        ...state,
        selectedBodyId: null,
        selectedRegionId: null,
        zoomLevel: ZoomLevel.System,
      };

    case WorldSimActionType.DeselectRegion:
      return {
        ...state,
        selectedRegionId: null,
        zoomLevel: ZoomLevel.Body,
      };

    case WorldSimActionType.SetZoomLevel:
      return { ...state, zoomLevel: action.level };

    case WorldSimActionType.SetTransitioning:
      return { ...state, isTransitioning: action.isTransitioning };

    case WorldSimActionType.HoverBody:
      return { ...state, hoveredBodyId: action.bodyId };

    case WorldSimActionType.ToggleLabels:
      return { ...state, labelsVisible: !state.labelsVisible };

    case WorldSimActionType.ToggleOrbits:
      return { ...state, orbitsVisible: !state.orbitsVisible };

    case WorldSimActionType.Reset:
      return { ...INITIAL_WORLD_SIM_STATE, isInitialized: state.isInitialized };

    default:
      return state;
  }
}
