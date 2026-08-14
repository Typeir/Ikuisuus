/**
 * @fileoverview Implements the Command pattern for camera transitions.
 * @description Commands zoom to a body, zoom to a region, or reset the view. Body
 * tracking is handled by CameraFollowSystem; commands lerp toward offsets from the
 * moving target.
 *
 * @module worldSim/camera/CameraCommand
 * @version 2.0.0
 * @author Typeir
 * @since 1.0.0
 */

import { PerspectiveCamera, Vector3 } from 'three';
import type { ICameraCommand } from '@/modules/world-sim/domain/celestials/celestialBody.types';
import {
    COMPLETION_THRESHOLD,
    EASE_FACTOR,
    REGION_TRANSITION_DURATION,
    SLERP_EPSILON,
} from '@/modules/world-sim/infrastructure/config/cameraTuning';
import { DEFAULT_CAMERA_LOOK_AT, DEFAULT_CAMERA_POSITION } from '@/modules/world-sim/infrastructure/constants';

/**
 * Camera transition state shared by all commands during execution.
 *
 * @interface CameraTransitionState
 * @property {Vector3} targetPosition - Target camera position
 * @property {Vector3} targetLookAt - Target look-at point
 * @property {Vector3} currentLookAt - Current interpolated look-at point
 * @property {boolean} initialized - Whether the state has been initialized
 */
interface CameraTransitionState {
  /** @property {Vector3} targetPosition - Destination for the camera position */
  targetPosition: Vector3;
  /** @property {Vector3} targetLookAt - Destination for the look-at point */
  targetLookAt: Vector3;
  /** @property {Vector3} currentLookAt - Interpolating look-at during transition */
  currentLookAt: Vector3;
  /** @property {boolean} initialized - Whether the state has been initialized */
  initialized: boolean;
}

/**
 * Transitions the camera to a position relative to a celestial body.
 * Lerps toward the body's position at initialization, which moves with
 * the body because the follow system shifts everything.
 *
 * @class ZoomToBodyCommand
 * @implements {ICameraCommand}
 *
 * @example
 * ```ts
 * const cmd = new ZoomToBodyCommand(
 *   new Vector3(100, 0, 0),
 *   20,
 *   'damocles'
 * );
 * controller.executeCommand(cmd);
 * ```
 */
export class ZoomToBodyCommand implements ICameraCommand {
  /** @property {string} type - Command identifier */
  public readonly type = 'zoom-to-body';

  /** @property {CameraTransitionState} state - Internal transition state */
  private state: CameraTransitionState;

  /** @property {Vector3} bodyPosition - World position of the target body */
  private bodyPosition: Vector3;

  /** @property {number} viewDistance - Distance from the body to orbit at */
  private viewDistance: number;

  /** @property {string} bodyId - Identifier of the target celestial body */
  public readonly bodyId: string;

  /**
   * @param {Vector3} bodyPosition - World position of the target body
   * @param {number} viewDistance - Desired distance from the body surface
   * @param {string} bodyId - Identifier of the celestial body being targeted
   */
  constructor(bodyPosition: Vector3, viewDistance: number, bodyId: string) {
    this.bodyPosition = bodyPosition.clone();
    this.viewDistance = viewDistance;
    this.bodyId = bodyId;
    this.state = {
      targetPosition: new Vector3(),
      targetLookAt: bodyPosition.clone(),
      currentLookAt: new Vector3(),
      initialized: false,
    };
  }

  /**
   * Advance the camera transition by one frame.
   *
   * @param {PerspectiveCamera} camera - The camera to move
   * @param {number} _deltaTime - Time since last frame (unused, using lerp factor)
   * @returns {boolean} True when the transition is complete
   */
  execute(camera: PerspectiveCamera, _deltaTime: number): boolean {
    if (!this.state.initialized) {
      this.initializeTransition(camera);
    }

    camera.position.lerp(this.state.targetPosition, EASE_FACTOR);
    this.state.currentLookAt.lerp(this.state.targetLookAt, EASE_FACTOR);
    camera.lookAt(this.state.currentLookAt);

    const distance = camera.position.distanceTo(this.state.targetPosition);
    return distance < COMPLETION_THRESHOLD;
  }

  /**
   * Applies the follow system's frame delta to target positions.
   *
   * @param {Vector3} delta - Frame-to-frame movement of the followed body
   */
  applyFollowDelta(delta: Vector3): void {
    if (!this.state.initialized) return;
    this.bodyPosition.add(delta);
    this.state.targetPosition.add(delta);
    this.state.targetLookAt.add(delta);
  }

  /**
   * Computes the target position from the camera's angle to the body.
   *
   * @private
   * @param {PerspectiveCamera} camera - Current camera
   */
  private initializeTransition(camera: PerspectiveCamera): void {
    const direction = new Vector3()
      .subVectors(camera.position, this.bodyPosition)
      .normalize();

    this.state.targetPosition.copy(
      this.bodyPosition
        .clone()
        .add(direction.multiplyScalar(this.viewDistance)),
    );
    this.state.currentLookAt.copy(camera.position);
    this.state.initialized = true;
  }
}

/**
 * Spherical linear interpolation between two unit-length direction vectors.
 * Produces an arc path to avoid cutting through the planet interior.
 *
 * @param {Vector3} a - Start direction (unit length)
 * @param {Vector3} b - End direction (unit length)
 * @param {number} t - Interpolation factor (0 = a, 1 = b)
 * @returns {Vector3} Interpolated direction (unit length)
 */
function slerpDirections(a: Vector3, b: Vector3, t: number): Vector3 {
  const dot = Math.max(-1, Math.min(1, a.dot(b)));
  const omega = Math.acos(dot);
  if (omega < SLERP_EPSILON) return a.clone().lerp(b, t).normalize();
  const sinOmega = Math.sin(omega);
  const s0 = Math.sin((1 - t) * omega) / sinOmega;
  const s1 = Math.sin(t * omega) / sinOmega;
  return new Vector3(
    s0 * a.x + s1 * b.x,
    s0 * a.y + s1 * b.y,
    s0 * a.z + s1 * b.z,
  ).normalize();
}

/**
 * Cosine ease-in-out curve for camera orbiting.
 * Formula: $\frac{1 - \cos(\pi t)}{2}$
 *
 * @param {number} t - Linear progress from 0 to 1
 * @returns {number} Eased progress from 0 to 1
 */
function easeInOut(t: number): number {
  return (1 - Math.cos(Math.PI * t)) / 2;
}

/**
 * Transition state for region camera commands using spherical interpolation.
 * Stores directions and radii relative to the planet center. Uses time-based
 * progression with ease-in-out.
 *
 * @interface RegionTransitionState
 * @property {Vector3} startDirection - Normalized direction from planet center to initial camera position
 * @property {Vector3} endDirection - Normalized surface normal at the region (outward from planet center)
 * @property {number} startRadius - Initial distance from planet center to camera
 * @property {number} endRadius - Final distance from planet center to target position
 * @property {number} elapsed - Accumulated transition time in seconds
 * @property {boolean} initialized - Whether the transition has been set up
 */
interface RegionTransitionState {
  /** @property {Vector3} startDirection - Direction from planet center to initial camera pos */
  startDirection: Vector3;
  /** @property {Vector3} endDirection - Surface normal at region (planet center → region) */
  endDirection: Vector3;
  /** @property {number} startRadius - Initial distance from planet center */
  startRadius: number;
  /** @property {number} endRadius - Final distance from planet center */
  endRadius: number;
  /** @property {number} elapsed - Accumulated transition time in seconds */
  elapsed: number;
  /** @property {boolean} initialized - Whether transition is set up */
  initialized: boolean;
}

/**
 * Transitions the camera to focus on a specific surface region.
 * Uses spherical interpolation to arc the camera around the planet. Ends
 * along the region's outward surface normal, facing the planet center.
 *
 * @class ZoomToRegionCommand
 * @implements {ICameraCommand}
 */
export class ZoomToRegionCommand implements ICameraCommand {
  /** @property {string} type - Command identifier */
  public readonly type = 'zoom-to-region';

  /** @property {RegionTransitionState} state - Spherical transition state */
  private state: RegionTransitionState;

  /** @property {Vector3} regionWorldPosition - Region position in world space */
  private regionWorldPosition: Vector3;

  /** @property {Vector3} planetCenter - World-space center of the parent body */
  private planetCenter: Vector3;

  /** @property {number} viewDistance - Distance from the region surface */
  private viewDistance: number;

  /** @property {string} regionId - Identifier of the target region */
  public readonly regionId: string;

  /**
   * @param {Vector3} regionWorldPosition - World-space position of the region
   * @param {Vector3} planetCenter - World-space center of the parent body
   * @param {number} viewDistance - Desired distance from the region
   * @param {string} regionId - Identifier of the region being targeted
   */
  constructor(
    regionWorldPosition: Vector3,
    planetCenter: Vector3,
    viewDistance: number,
    regionId: string,
  ) {
    this.regionWorldPosition = regionWorldPosition.clone();
    this.planetCenter = planetCenter.clone();
    this.viewDistance = viewDistance;
    this.regionId = regionId;
    this.state = {
      startDirection: new Vector3(),
      endDirection: new Vector3(),
      startRadius: 0,
      endRadius: 0,
      elapsed: 0,
      initialized: false,
    };
  }

  /**
   * Advance the camera transition by one frame.
   * Uses time-based progression with a cosine ease-in-out curve. The camera
   * always faces the planet center.
   *
   * @param {PerspectiveCamera} camera - The camera to move
   * @param {number} deltaTime - Time since last frame in seconds
   * @returns {boolean} True when the transition is complete
   */
  execute(camera: PerspectiveCamera, deltaTime: number): boolean {
    if (!this.state.initialized) {
      this.initializeTransition(camera);
    }

    this.state.elapsed += deltaTime;
    const linearT = Math.min(
      this.state.elapsed / REGION_TRANSITION_DURATION,
      1,
    );
    const easedT = easeInOut(linearT);

    const currentDir = slerpDirections(
      this.state.startDirection,
      this.state.endDirection,
      easedT,
    );
    const currentRadius =
      this.state.startRadius +
      (this.state.endRadius - this.state.startRadius) * easedT;

    camera.position
      .copy(this.planetCenter)
      .add(currentDir.multiplyScalar(currentRadius));

    camera.lookAt(this.planetCenter);

    return linearT >= 1;
  }

  /**
   * Applies the follow system's frame delta to world-space positions.
   *
   * @param {Vector3} delta - Frame-to-frame movement of the followed body
   */
  applyFollowDelta(delta: Vector3): void {
    if (!this.state.initialized) return;
    this.regionWorldPosition.add(delta);
    this.planetCenter.add(delta);
  }

  /**
   * Computes start/end directions and radii for the spherical arc.
   * Start direction is from planet center toward the camera; end direction
   * is the surface normal at the region.
   *
   * @private
   * @param {PerspectiveCamera} camera - Current camera for initial direction/radius
   */
  private initializeTransition(camera: PerspectiveCamera): void {
    const toCamera = new Vector3().subVectors(
      camera.position,
      this.planetCenter,
    );
    this.state.startDirection = toCamera.clone().normalize();
    this.state.startRadius = toCamera.length();

    const surfaceNormal = new Vector3()
      .subVectors(this.regionWorldPosition, this.planetCenter)
      .normalize();
    this.state.endDirection = surfaceNormal;

    const bodyRadius = this.regionWorldPosition.distanceTo(this.planetCenter);
    this.state.endRadius = bodyRadius + this.viewDistance;

    this.state.elapsed = 0;
    this.state.initialized = true;
  }
}

/**
 * Animated return to the default system overview position.
 *
 * @class ResetViewCommand
 * @implements {ICameraCommand}
 */
export class ResetViewCommand implements ICameraCommand {
  /** @property {string} type - Command identifier */
  public readonly type = 'reset-view';

  /** @property {Vector3} defaultPosition - Default camera position */
  private defaultPosition: Vector3;

  /** @property {Vector3} defaultLookAt - Default look-at target */
  private defaultLookAt: Vector3;

  /** @property {Vector3} currentLookAt - Interpolating look-at point */
  private currentLookAt: Vector3;

  /** @property {boolean} initialized - Whether the interpolation started */
  private initialized: boolean = false;

  /**
   * @param {Vector3} [defaultPosition] - Override for default camera position
   * @param {Vector3} [defaultLookAt] - Override for default look-at target
   */
  constructor(defaultPosition?: Vector3, defaultLookAt?: Vector3) {
    this.defaultPosition = defaultPosition ?? DEFAULT_CAMERA_POSITION.clone();
    this.defaultLookAt = defaultLookAt ?? DEFAULT_CAMERA_LOOK_AT.clone();
    this.currentLookAt = new Vector3();
  }

  /**
   * Advance the camera transition by one frame.
   *
   * @param {PerspectiveCamera} camera - The camera to move
   * @param {number} _deltaTime - Time since last frame
   * @returns {boolean} True when the transition is complete
   */
  execute(camera: PerspectiveCamera, _deltaTime: number): boolean {
    if (!this.initialized) {
      this.currentLookAt.copy(camera.position);
      this.initialized = true;
    }

    camera.position.lerp(this.defaultPosition, EASE_FACTOR);
    this.currentLookAt.lerp(this.defaultLookAt, EASE_FACTOR);
    camera.lookAt(this.currentLookAt);

    const distance = camera.position.distanceTo(this.defaultPosition);
    return distance < COMPLETION_THRESHOLD;
  }

  /**
   * No-op; the follow target is cleared before reset.
   *
   * @param {Vector3} _delta - Unused movement delta
   */
  applyFollowDelta(_delta: Vector3): void {}
}
