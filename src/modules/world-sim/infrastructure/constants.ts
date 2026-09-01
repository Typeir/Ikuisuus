/**
 * @fileoverview World Sim shared constants.
 * @description Centralizes magic numbers and default values used across World Sim
 * modules.
 *
 * @module modules/world-sim/infrastructure/constants
 * @version 1.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { Vector3 } from 'three';

/** @constant {Vector3} DEFAULT_CAMERA_POSITION - Default overview camera position */
export const DEFAULT_CAMERA_POSITION = new Vector3(0, 800, 2500);

/** @constant {Vector3} DEFAULT_CAMERA_LOOK_AT - Default camera look-at target (origin) */
export const DEFAULT_CAMERA_LOOK_AT = new Vector3(0, 0, 0);
