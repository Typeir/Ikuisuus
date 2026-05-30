/**
 * @fileoverview Camera Tuning Constants — Centralized Camera Configuration
 * @description Single source of truth for all numeric tuning values used by
 * `CameraOrbitControls`, `CameraCommand`, and `CameraController`. Extracting
 * these into one module keeps mouse-feel, transition smoothness, and orbit
 * bounds adjustable without hunting through three files.
 *
 * @module worldSim/config/cameraTuning
 * @version 1.0.0
 * @author Typeir
 * @since 2.0.0
 */

/** @constant {number} ORBIT_SENSITIVITY - Mouse-drag rotation rate (radians per pixel of pointer travel). */
export const ORBIT_SENSITIVITY = 0.005;

/** @constant {number} ZOOM_SENSITIVITY - Mouse-wheel zoom rate (fraction of current orbit distance per wheel notch). */
export const ZOOM_SENSITIVITY = 0.1;

/** @constant {number} PAN_SCALE_FACTOR - Middle-click pan scale multiplied by orbit radius (world units per pixel per unit of radius). */
export const PAN_SCALE_FACTOR = 0.002;

/** @constant {number} MIN_DISTANCE - Smallest allowed orbit radius (world units); prevents the camera from clipping into bodies. */
export const MIN_DISTANCE = 5;

/** @constant {number} MAX_DISTANCE - Largest allowed orbit radius (world units); kept inside the Everdark boundary shell. */
export const MAX_DISTANCE = 4800;

/** @constant {number} MIN_POLAR_ANGLE - Lower polar-angle clamp (radians) preventing gimbal lock at the north pole. */
export const MIN_POLAR_ANGLE = 0.1;

/** @constant {number} MAX_POLAR_ANGLE - Upper polar-angle clamp (radians) preventing gimbal lock at the south pole. */
export const MAX_POLAR_ANGLE = Math.PI - 0.1;

/** @constant {number} DAMPING_FACTOR - Per-frame angular-velocity decay (0-1); higher values produce longer glide after a drag release. */
export const DAMPING_FACTOR = 0.92;

/** @constant {number} VELOCITY_THRESHOLD - Angular-velocity floor (radians/frame) below which residual motion is zeroed. */
export const VELOCITY_THRESHOLD = 0.0001;

/** @constant {number} EASE_FACTOR - Per-frame lerp factor (0-1) used by camera commands to smoothly approach their target. */
export const EASE_FACTOR = 0.08;

/** @constant {number} COMPLETION_THRESHOLD - Squared-distance threshold (world units) at which a transition is considered finished. */
export const COMPLETION_THRESHOLD = 0.5;

/** @constant {number} REGION_TRANSITION_DURATION - Total duration in seconds of a "zoom to surface region" command. */
export const REGION_TRANSITION_DURATION = 1.6;

/** @constant {number} SLERP_EPSILON - Angle threshold (radians) below which slerp falls back to linear interpolation to avoid division by zero. */
export const SLERP_EPSILON = 1e-4;

/** @constant {number} BOUND_RADIUS - Hard sphere bound (world units) that keeps both the camera and the orbit center inside the Everdark shell. Sits inside the current Everdark radius (7000) with a 200-unit safety margin so the camera cannot clip the boundary mesh. */
export const BOUND_RADIUS = 6800;
