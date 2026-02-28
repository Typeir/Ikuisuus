/**
 * @fileoverview World Sim State & Action Type Definitions
 * @description Defines the state shape and action union for the World Sim reducer.
 * Follows the existing PersistentUiContext pattern.
 *
 * @module worldSim/context/worldSimTypes
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

/**
 * Zoom level enum representing the three navigation tiers.
 * @enum {string}
 */
export enum ZoomLevel {
  /** Full system view — all bodies visible */
  System = 'system',
  /** Zoomed to single body — surface details visible */
  Body = 'body',
  /** Close-up on region — DOM panel anchored */
  Region = 'region',
}

/**
 * Complete state shape for the World Sim module.
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
  /** Scene finished mounting */
  Initialize = 'INITIALIZE',
  /** Select a celestial body */
  SelectBody = 'SELECT_BODY',
  /** Select a surface region on a body */
  SelectRegion = 'SELECT_REGION',
  /** Clear body and region selection */
  Deselect = 'DESELECT',
  /** Clear region selection only */
  DeselectRegion = 'DESELECT_REGION',
  /** Set navigation zoom level */
  SetZoomLevel = 'SET_ZOOM_LEVEL',
  /** Set camera transition state */
  SetTransitioning = 'SET_TRANSITIONING',
  /** Set hovered body */
  HoverBody = 'HOVER_BODY',
  /** Toggle floating label visibility */
  ToggleLabels = 'TOGGLE_LABELS',
  /** Toggle orbit line visibility */
  ToggleOrbits = 'TOGGLE_ORBITS',
  /** Reset to initial state */
  Reset = 'RESET',
}

/**
 * Union of all actions the World Sim reducer can handle.
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
 * Initial state for the World Sim reducer.
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
