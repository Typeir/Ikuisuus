/**
 * @fileoverview Scene Tuning Constants — Renderer, Bridge, and Mediator Defaults
 * @description Numeric configuration shared by `SceneManager`, `ProjectionBridge`,
 * `RaycastService`, `CelestialGlow`, and `WorldSimMediator`. Centralized so that
 * scene visuals (FOV, clipping, background), label scaling, and frame throttling
 * can be tuned without code-spelunking.
 *
 * @module worldSim/config/sceneTuning
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 */

/** @constant {number} STARFIELD_COUNT - Number of background star particles in the skybox sphere. */
export const STARFIELD_COUNT = 1200;

/** @constant {number} STARFIELD_SPREAD - Radius (world units) of the sphere the starfield is distributed over. */
export const STARFIELD_SPREAD = 12000;

/** @constant {number} CAMERA_FOV - Perspective camera vertical field of view in degrees. */
export const CAMERA_FOV = 60;

/** @constant {number} CAMERA_NEAR - Near clipping plane in world units. */
export const CAMERA_NEAR = 0.1;

/** @constant {number} CAMERA_FAR - Far clipping plane in world units; must exceed the Everdark radius plus starfield spread. */
export const CAMERA_FAR = 15000;

/** @constant {string} SCENE_BACKGROUND_COLOR - WebGL clear color (hex) used as the background between rendered geometry. */
export const SCENE_BACKGROUND_COLOR = '#050508';

/** @constant {number} MAX_LABEL_DISTANCE - Distance (world units) at which DOM labels fully shrink to their minimum size. */
export const MAX_LABEL_DISTANCE = 5000;

/** @constant {number} MIN_LABEL_DISTANCE - Distance (world units) below which DOM labels are clamped to their maximum size. */
export const MIN_LABEL_DISTANCE = 50;

/** @constant {number} MAX_LABEL_SCALE - Largest CSS scale multiplier applied to a label when very close to the camera. */
export const MAX_LABEL_SCALE = 1.5;

/** @constant {number} MIN_LABEL_SCALE - Smallest CSS scale multiplier applied to a label when far from the camera. */
export const MIN_LABEL_SCALE = 0.55;

/** @constant {number} VIEW_DISTANCE_MULTIPLIER - Multiplier applied to a body's radius when computing the default "zoom to body" distance. */
export const VIEW_DISTANCE_MULTIPLIER = 3;

/** @constant {number} REGION_VIEW_DISTANCE - Fixed orbit distance (world units) used by the "zoom to surface region" command. */
export const REGION_VIEW_DISTANCE = 40;

/** @constant {number} LOCAL_COORD_VIEW_DISTANCE - Fallback orbit distance when surface-region coords are missing. */
export const LOCAL_COORD_VIEW_DISTANCE = 30;

/** @constant {number} OCCLUSION_FRAME_STRIDE - Run occlusion raycasts only every Nth frame to bound CPU cost. */
export const OCCLUSION_FRAME_STRIDE = 3;

/** @constant {number} OCCLUSION_OPACITY_THRESHOLD - Minimum material opacity for a mesh to be treated as opaque when computing label occlusion. */
export const OCCLUSION_OPACITY_THRESHOLD = 0.9;

/** @constant {number} DEFAULT_GLOW_SCALE - Default halo-sprite scale multiplier relative to a body's radius. */
export const DEFAULT_GLOW_SCALE = 3.0;

/** @constant {number} DEFAULT_GLOW_OPACITY - Default halo-sprite opacity (0-1). */
export const DEFAULT_GLOW_OPACITY = 0.18;
