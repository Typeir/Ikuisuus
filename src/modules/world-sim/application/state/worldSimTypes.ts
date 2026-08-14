/**
 * @fileoverview World Sim State & Action Type Definitions
 * @description Defines the state shape and action union for the World Sim reducer.
 *
 * @module worldSim/context/worldSimTypes
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

/**
 * Zoom level enum. Three levels: System, Body, Region.
 * @enum {string}
 */
export enum ZoomLevel {
  /** Full system view, all bodies visible */
  System = 'system',
  /** Single body, surface details visible */
  Body = 'body',
  /** Surface region, DOM panel anchored */
  Region = 'region',
}

/**
 * State shape for the World Sim reducer.
 * @interface WorldSimState
 * @property {string | null} selectedBodyId - Currently selected celestial body
 * @property {string | null} selectedRegionId - Currently selected surface region
 * @property {ZoomLevel} zoomLevel - Current navigation depth
 * @property {boolean} isTransitioning - Whether camera is mid-animation
 * @property {string | null} hoveredBodyId - Body currently under cursor
 * @property {boolean} labelsVisible - Whether floating labels are shown
 * @property {boolean} orbitsPaused - Whether orbital animation is paused
 * @property {boolean} isInitialized - Whether the Three.js scene has mounted
 */
export interface WorldSimState {
  selectedBodyId: string | null;
  selectedRegionId: string | null;
  zoomLevel: ZoomLevel;
  isTransitioning: boolean;
  hoveredBodyId: string | null;
  labelsVisible: boolean;
  orbitsPaused: boolean;
  isInitialized: boolean;
}

/**
 * Action type enum for all World Sim reducer actions.
 * @enum {string}
 */
export enum WorldSimActionType {
  /** Scene mounted */
  Initialize = 'INITIALIZE',
  /** Select a body */
  SelectBody = 'SELECT_BODY',
  /** Select a surface region */
  SelectRegion = 'SELECT_REGION',
  /** Clear body and region selection */
  Deselect = 'DESELECT',
  /** Clear region selection */
  DeselectRegion = 'DESELECT_REGION',
  /** Set zoom level */
  SetZoomLevel = 'SET_ZOOM_LEVEL',
  /** Set transition state */
  SetTransitioning = 'SET_TRANSITIONING',
  /** Set hovered body */
  HoverBody = 'HOVER_BODY',
  /** Toggle label visibility */
  ToggleLabels = 'TOGGLE_LABELS',
  /** Toggle orbit visibility */
  ToggleOrbits = 'TOGGLE_ORBITS',
  /** Reset to initial state */
  Reset = 'RESET',
}

/**
 * Union of all World Sim reducer actions.
 * @typedef {Object} WorldSimAction
 */
export type WorldSimAction =
  | { type: WorldSimActionType.Initialize }
  | { type: WorldSimActionType.SelectBody; bodyId: string }
  | { type: WorldSimActionType.SelectRegion; regionId: string; bodyId: string }
  | { type: WorldSimActionType.Deselect }
  | { type: WorldSimActionType.DeselectRegion }
  | { type: WorldSimActionType.SetZoomLevel; level: ZoomLevel }
  | { type: WorldSimActionType.SetTransitioning; isTransitioning: boolean }
  | { type: WorldSimActionType.HoverBody; bodyId: string | null }
  | { type: WorldSimActionType.ToggleLabels }
  | { type: WorldSimActionType.ToggleOrbits }
  | { type: WorldSimActionType.Reset };

/**
 * Default World Sim reducer state.
 * @constant
 */
export const INITIAL_WORLD_SIM_STATE: WorldSimState = {
  selectedBodyId: null,
  selectedRegionId: null,
  zoomLevel: ZoomLevel.System,
  isTransitioning: false,
  hoveredBodyId: null,
  labelsVisible: true,
  orbitsPaused: false,
  isInitialized: false,
};
