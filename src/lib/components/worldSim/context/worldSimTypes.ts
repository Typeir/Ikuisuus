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
 * Union of all actions the World Sim reducer can handle.
 * @typedef {Object} WorldSimAction
 */
export type WorldSimAction =
  | { type: 'INITIALIZE' }
  | { type: 'SELECT_BODY'; bodyId: string }
  | { type: 'SELECT_REGION'; regionId: string; bodyId: string }
  | { type: 'DESELECT' }
  | { type: 'DESELECT_REGION' }
  | { type: 'SET_ZOOM_LEVEL'; level: ZoomLevel }
  | { type: 'SET_TRANSITIONING'; isTransitioning: boolean }
  | { type: 'HOVER_BODY'; bodyId: string | null }
  | { type: 'TOGGLE_LABELS' }
  | { type: 'TOGGLE_ORBITS' }
  | { type: 'RESET' };

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
